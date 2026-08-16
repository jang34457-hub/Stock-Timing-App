import { DailyPriceData } from '../types/stock';
import officialStockData from './officialStockPrices.json';

/**
 * 🌟 한국거래소(KRX) 공식 거래일 100% 정밀 시세 데이터 로더
 * - 주말, 공휴일, 선거일 등 비거래일은 100% 제외
 * - 수식/알고리즘 보간 없이 오직 파이썬으로 수집된 공식 "종가" 시세만 제공
 * 
 * @param {string} stockCode - 종목 코드 (예: '005930')
 * @param {number} [totalDays=125] - 조회할 거래일 수
 * @returns {DailyPriceData[]} 한국거래소 공식 일별 시세 데이터 배열
 */
export function getRealStockHistory(stockCode: string, totalDays: number = 125): DailyPriceData[] {
  const stockInfo = (officialStockData as Record<string, any>)[stockCode];
  
  if (!stockInfo || !Array.isArray(stockInfo.prices) || stockInfo.prices.length === 0) {
    return [];
  }

  // 공식 일별 종가 시세 데이터 배열 반환
  const prices: DailyPriceData[] = stockInfo.prices.map((item: any, idx: number) => ({
    date: item.date,
    rowNum: idx + 1,
    closePrice: item.closePrice,
  }));

  if (prices.length > totalDays) {
    return prices.slice(prices.length - totalDays);
  }

  return prices;
}

/**
 * 🌟 공식 거래일 날짜 목록만 추출하는 함수
 * @param {string} stockCode - 종목 코드
 * @returns {string[]} YYYY-MM-DD 오름차순 날짜 배열
 */
export function getTradingDatesForStock(stockCode: string): string[] {
  const prices = getRealStockHistory(stockCode);
  return prices.map(p => p.date);
}
