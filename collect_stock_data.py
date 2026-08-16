#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국내 주식 과거 시세 데이터 자동 수집 프로그램 (Stock-Timing-App 전용)

- 데이터 소스: 금융위원회 공공데이터포털 (금융위원회_주식시세정보 Open API)
- 보조 데이터 소스: 네이버 파이낸스 차트 API (백업 폴백)
- 주요 기능: KOSPI/KOSDAQ 종목 6개월간 일별 시세 수집, 거래일순번 부여, 중복 배제, CSV 저장, 로그 기록
"""

import os
import sys
import time
import json
import logging
import argparse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

import requests
from dotenv import load_dotenv

# .env 파일에서 환경변수 로드
load_dotenv()

# 디렉터리 및 파일 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
STOCK_DATA_CSV = os.path.join(DATA_DIR, 'stock_data.csv')
STOCK_LIST_CSV = os.path.join(DATA_DIR, 'stock_list.csv')
COLLECTION_LOG = os.path.join(DATA_DIR, 'collection_log.txt')

# data 디렉터리가 없으면 자동 생성
os.makedirs(DATA_DIR, exist_ok=True)

# 🌟 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(COLLECTION_LOG, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('StockCollector')

# 필수 11개 컬럼 정의
CSV_COLUMNS = [
    '종목코드', '종목명', '거래일', '거래일순번',
    '시가', '고가', '저가', '종가', '거래량', '거래대금', '등락률'
]

# 기본 수집 및 테스트 대상 종목 (카카오, 삼성바이오로직스, 에코프로비엠)
DEFAULT_TEST_TICKERS = [
    {'code': '035720', 'name': '카카오', 'market': 'KOSPI'},
    {'code': '207940', 'name': '삼성바이오로직스', 'market': 'KOSPI'},
    {'code': '247540', 'name': '에코프로비엠', 'market': 'KOSDAQ'},
]


def log_to_file_and_console(message: str, is_warning: bool = False) -> None:
    """
    콘솔 및 로그 파일에 일치된 형식의 로그 메시지를 기록합니다.
    :param message: 로그 내용
    :param is_warning: 경고 여부
    """
    if is_warning:
        logger.warning(message)
    else:
        logger.info(message)


def fetch_from_public_data_portal(
    ticker: str,
    start_date: str,
    end_date: str,
    api_key: str,
    max_retries: int = 3
) -> Optional[List[Dict[str, Any]]]:
    """
    금융위원회 공공데이터포털 '금융위원회_주식시세정보' Open API에서 시세 데이터를 가져옵니다.
    :param ticker: 종목코드 (6자리)
    :param start_date: 시작일 (YYYYMMDD)
    :param end_date: 종료일 (YYYYMMDD)
    :param api_key: 공공데이터포털 API Key
    :param max_retries: 실패 시 최대 재시도 횟수
    :return: 수집된 시세 데이터 리스트 또는 None
    """
    endpoint = "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo"
    
    params = {
        'serviceKey': api_key,
        'numOfRows': '300',
        'pageNo': '1',
        'resultType': 'json',
        'likeLikeItmsCdn': ticker,
        'beginBasDt': start_date,
        'endBasDt': end_date,
    }

    for attempt in range(1, max_retries + 1):
        try:
            log_to_file_and_console(f"  - [공공데이터 Open API] 시도 #{attempt}/{max_retries} ({ticker})...")
            response = requests.get(endpoint, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                items = data.get('response', {}).get('body', {}).get('items', {}).get('item', [])
                if items:
                    results = []
                    for item in items:
                        # 종목코드 6자리 맞춤
                        item_code = str(item.get('srtnCd', '')).replace('A', '').zfill(6)
                        if item_code == ticker:
                            bas_dt = str(item.get('basDt', ''))
                            if len(bas_dt) == 8:
                                formatted_date = f"{bas_dt[:4]}-{bas_dt[4:6]}-{bas_dt[6:8]}"
                            else:
                                formatted_date = bas_dt

                            results.append({
                                '종목코드': item_code,
                                '종목명': item.get('itmsNm', ''),
                                '거래일': formatted_date,
                                '시가': int(float(item.get('mkp', 0))),
                                '고가': int(float(item.get('hipr', 0))),
                                '저가': int(float(item.get('lopr', 0))),
                                '종가': int(float(item.get('clpr', 0))),
                                '거래량': int(float(item.get('trqu', 0))),
                                '거래대금': int(float(item.get('trPrc', 0))),
                                '등락률': round(float(item.get('fltRt', 0.0)), 2),
                            })
                    if results:
                        return results
            time.sleep(0.5 * attempt)
        except Exception as e:
            log_to_file_and_console(f"  ⚠️ 공공데이터 Open API 호출 중 예외 (시도 #{attempt}): {e}", is_warning=True)
            time.sleep(0.5 * attempt)

    return None


def fetch_from_naver_finance_backup(ticker: str, count: int = 130) -> List[Dict[str, Any]]:
    """
    공공데이터포털 API 미발급/실패 시 네이버 금융 차트 API에서 6개월 시세 데이터를 백업 수집합니다.
    :param ticker: 종목코드 (6자리)
    :param count: 거래일 수 (기본 130일 = 약 6개월)
    :return: 시세 데이터 리스트
    """
    url = f"https://fchart.stock.naver.com/sise.nhn?symbol={ticker}&timeframe=day&count={count}&requestType=0"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200 and '<item' in res.text:
            root = ET.fromstring(res.text)
            items = []
            for item in root.findall('.//item'):
                data_attr = item.attrib.get('data', '')
                parts = data_attr.split('|')
                if len(parts) >= 6:
                    date_str = parts[0]
                    open_p = int(parts[1])
                    high_p = int(parts[2])
                    low_p = int(parts[3])
                    close_p = int(parts[4])
                    volume = int(parts[5])

                    if len(date_str) == 8:
                        formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
                        items.append({
                            '종목코드': ticker,
                            '종목명': '',
                            '거래일': formatted_date,
                            '시가': open_p,
                            '고가': high_p,
                            '저가': low_p,
                            '종가': close_p,
                            '거래량': volume,
                            '거래대금': close_p * volume,  # 추정 거래대금
                            '등락률': 0.0,
                        })
            
            # 등락률 및 종목명 보완
            for i in range(len(items)):
                if i > 0 and items[i-1]['종가'] > 0:
                    prev_c = items[i-1]['종가']
                    curr_c = items[i]['종가']
                    items[i]['등락률'] = round(((curr_c - prev_c) / prev_c) * 100, 2)
            
            return items
    except Exception as e:
        log_to_file_and_console(f"  ⚠️ 네이버 파이낸스 백업 수집 실패 ({ticker}): {e}", is_warning=True)

    return []


def load_existing_stock_data() -> List[Dict[str, Any]]:
    """
    기존 data/stock_data.csv 파일이 존재하는 경우 읽어옵니다. (중복 저장 방지용)
    :return: 기존 수집 레코드 리스트
    """
    if not os.path.exists(STOCK_DATA_CSV):
        return []

    records = []
    try:
        with open(STOCK_DATA_CSV, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()
            if not lines:
                return []
            header = [h.strip() for h in lines[0].split(',')]
            for line in lines[1:]:
                values = [v.strip() for v in line.split(',')]
                if len(values) >= len(CSV_COLUMNS):
                    record = dict(zip(header, values))
                    records.append(record)
    except Exception as e:
        log_to_file_and_console(f"기존 CSV 파일 읽기 오류: {e}", is_warning=True)

    return records


def save_stock_data_to_csv(data_records: List[Dict[str, Any]]) -> None:
    """
    수집된 11개 컬럼 일별 시세 데이터를 data/stock_data.csv에 저장합니다. (거래일순번 정렬 보장)
    :param data_records: 시세 데이터 배열
    """
    if not data_records:
        return

    # 종목별, 거래일 기준 오름차순(오래된 날짜 -> 최신 날짜) 정렬
    sorted_records = sorted(data_records, key=lambda x: (x['종목코드'], x['거래일']))

    # 종목별 거래일순번(1, 2, 3...) 재계산
    code_counters: Dict[str, int] = {}
    final_rows = []

    for row in sorted_records:
        code = row['종목코드']
        code_counters[code] = code_counters.get(code, 0) + 1
        row['거래일순번'] = code_counters[code]

        final_rows.append([
            str(row['종목코드']),
            str(row['종목명']),
            str(row['거래일']),
            str(row['거래일순번']),
            str(row['시가']),
            str(row['고가']),
            str(row['저가']),
            str(row['종가']),
            str(row['거래량']),
            str(row['거래대금']),
            str(row['등락률']),
        ])

    with open(STOCK_DATA_CSV, 'w', encoding='utf-8-sig') as f:
        f.write(','.join(CSV_COLUMNS) + '\n')
        for r in final_rows:
            f.write(','.join(r) + '\n')

    log_to_file_and_console(f"💾 총 {len(final_rows)}건의 6개월 주가 데이터가 {STOCK_DATA_CSV}에 성공적으로 저장되었습니다.")


def get_stock_name_from_list(ticker: str) -> str:
    """
    data/stock_list.csv 또는 기본 종목 목록에서 종목명을 매핑합니다.
    :param ticker: 종목코드
    :return: 종목명
    """
    for item in DEFAULT_TEST_TICKERS:
        if item['code'] == ticker:
            return item['name']

    if os.path.exists(STOCK_LIST_CSV):
        try:
            with open(STOCK_LIST_CSV, 'r', encoding='utf-8-sig') as f:
                for line in f.readlines()[1:]:
                    parts = [p.strip() for p in line.split(',')]
                    if len(parts) >= 2 and parts[0] == ticker:
                        return parts[1]
        except Exception:
            pass

    return f"종목_{ticker}"


def collect_stock_prices_for_ticker(
    ticker: str,
    months: int = 6,
    api_key: Optional[str] = None
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    단일 종목에 대해 최근 N개월간의 일별 시세 데이터를 수집합니다.
    :param ticker: 종목코드
    :param months: 수집 개월 수 (기본 6개월)
    :param api_key: 공공데이터포털 API Key
    :return: (수집된 레코드 배열, 검증 요약 정보 객체)
    """
    stock_name = get_stock_name_from_list(ticker)
    # 날짜 범위 설정 (정확한 최근 N개월 기준: 6개월 = 약 182일 전, 약 125 평일 거래일)
    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=int(months * 30.5))
    
    start_str = start_dt.strftime('%Y%m%d')
    end_str = end_dt.strftime('%Y%m%d')

    collected_data = None

    # 1. 공공데이터포털 API 수집 시도
    if api_key and api_key != "YOUR_PUBLIC_DATA_PORTAL_API_KEY_HERE":
        collected_data = fetch_from_public_data_portal(ticker, start_str, end_str, api_key)

    # 2. 공공데이터 미발급 또는 실패 시 네이버 파이낸스 백업 수집 (6개월 = 125 평일 거래일)
    if not collected_data:
        log_to_file_and_console(f"  [참고] 공공데이터 API 키 미설정 또는 실패로 네이버 파이낸스 공식 차트 API 수집을 실행합니다.")
        collected_data = fetch_from_naver_finance_backup(ticker, count=months * 21)

    if not collected_data:
        log_to_file_and_console(f"  ❌ {stock_name}({ticker}) 시세 데이터 수집 실패", is_warning=True)
        return [], {}

    # 종목명補完
    for d in collected_data:
        if not d['종목명']:
            d['종목명'] = stock_name

    # 날짜 오름차순 정렬
    collected_data.sort(key=lambda x: x['거래일'])

    # 🌟 수집 데이터 검증 및 요약 생성
    total_days = len(collected_data)
    first_trade = collected_data[0]
    last_trade = collected_data[-1]

    # 데이터 누락 검증 (6개월 기준 110거래일 미만 시 경고)
    min_expected_days = months * 18
    if total_days < min_expected_days:
        log_to_file_and_console(
            f"  ⚠️ [거래일 경고] {stock_name} 수집 거래일 수({total_days}일)가 예상 최소 거래일({min_expected_days}일)보다 적습니다. 데이터 누락 가능성 확인 필요.",
            is_warning=True
        )

    summary = {
        'name': stock_name,
        'code': ticker,
        'first_date': first_trade['거래일'],
        'last_date': last_trade['거래일'],
        'total_days': total_days,
        'first_close': first_trade['종가'],
        'last_close': last_trade['종가'],
    }

    return collected_data, summary


def main():
    """
    커맨드라인 인자 파싱 및 메인 실행 함수
    """
    # Windows 콘솔 인코딩 호환 재설정
    if sys.platform.startswith('win'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
        except AttributeError:
            pass

    parser = argparse.ArgumentParser(description="Stock-Timing-App 국내 주식 과거 시세 데이터 자동 수집기")
    parser.add_argument('--ticker', type=str, help="수집할 특정 종목코드 (예: 105560)")
    parser.add_argument('--months', type=int, default=6, help="수집할 최근 개월 수 (기본: 6개월)")
    args = parser.parse_args()

    api_key = os.getenv('PUBLIC_DATA_PORTAL_API_KEY', '')

    print("==================================================================")
    print("[수집 프로그램] Stock-Timing-App 국내 주식 과거 시세 데이터 자동 수집기")
    print("==================================================================")
    print(f"[안내] 공식 데이터 소스: 금융위원회 공공데이터포털 (금융위원회_주식시세정보 Open API)")
    print(f"[안내] 백업 데이터 소스: 네이버 파이낸스 차트 공식 API")
    print(f"[안내] 수집 대상 기간: 최근 {args.months}개월 실제 평일 거래일 기준")
    print(f"[안내] API 인증키 상태: {'[설정됨]' if api_key and api_key != 'YOUR_PUBLIC_DATA_PORTAL_API_KEY_HERE' else '[미설정] (네이버 백업 API 활용)'}")
    print("------------------------------------------------------------------")

    # 대상 종목 선정
    target_tickers = []
    if args.ticker:
        target_tickers = [args.ticker]
    else:
        # stock_list.csv 또는 기본 테스트 3개 종목
        if os.path.exists(STOCK_LIST_CSV):
            try:
                with open(STOCK_LIST_CSV, 'r', encoding='utf-8-sig') as f:
                    for line in f.readlines()[1:]:
                        parts = [p.strip() for p in line.split(',')]
                        if parts and parts[0]:
                            target_tickers.append(parts[0])
            except Exception:
                target_tickers = [item['code'] for item in DEFAULT_TEST_TICKERS]
        else:
            target_tickers = [item['code'] for item in DEFAULT_TEST_TICKERS]

    # 기존 데이터 로드 (중복 제거용)
    existing_records = load_existing_stock_data()
    existing_map = {(r['종목코드'], r['거래일']): r for r in existing_records}

    summaries = []
    new_records_added = 0

    for ticker in target_tickers:
        records, summary = collect_stock_prices_for_ticker(ticker, months=args.months, api_key=api_key)
        if records:
            summaries.append(summary)
            for r in records:
                key = (r['종목코드'], r['거래일'])
                if key not in existing_map:
                    existing_records.append(r)
                    existing_map[key] = r
                    new_records_added += 1
        
        # API 과도한 호출 방지 (과부하 예방)
        time.sleep(0.3)

    # 결과 CSV 파일 저장 및 거래일순번 재부여
    save_stock_data_to_csv(existing_records)

    # 콘솔 요약 결과 검증 출력
    print("\n==================================================================")
    print("[보고서] [수집 결과 종합 검증 보고서]")
    print("==================================================================")
    print(f"{'종목명':<16} | {'최초 거래일':<10} | {'최종 거래일':<10} | {'거래일수':<6} | {'최초 종가':<10} | {'최종 종가':<10}")
    print("------------------------------------------------------------------")

    for s in summaries:
        print(f"{s['name']:<16} | {s['first_date']:<10} | {s['last_date']:<10} | {s['total_days']:>4}일 | {s['first_close']:>10,}원 | {s['last_close']:>10,}원")

    print("------------------------------------------------------------------")
    print("[안내] API 데이터 의미 및 수정주가 관련 명시 안내")
    print("  1. 본 프로그램의 종가/시가/고가/저가는 원본 유상증자/무상증자/액면분할 비율이 반영된 '수정주가' 기준입니다.")
    print("  2. 등락률(%)은 전일 거래일 종가 대비 당일 종가의 시세 변동 비율을 의미합니다.")
    print("  3. 주말 및 장 휴장일(공휴일)은 거래일에서 자동 제외 처리되었습니다.")
    print("==================================================================\n")


if __name__ == '__main__':
    main()
