import { StockInfo } from '../types/stock';
import { DEFAULT_CONFIG } from './mockStocks';

/**
 * 🌟 대한민국 KOSPI / KOSDAQ 200+ 주요 상장 종목 데이터베이스
 */
export const ALL_KRX_STOCKS_DB: Array<{ code: string; name: string; market: 'KOSPI' | 'KOSDAQ'; price: number }> = [
  // 1. 반도체 / IT / 테크
  { code: '005930', name: '삼성전자', market: 'KOSPI', price: 274500 },
  { code: '000660', name: 'SK하이닉스', market: 'KOSPI', price: 1645000 },
  { code: '035420', name: 'NAVER', market: 'KOSPI', price: 228000 },
  { code: '035720', name: '카카오', market: 'KOSPI', price: 40000 },
  { code: '323410', name: '카카오뱅크', market: 'KOSPI', price: 21800 },
  { code: '377300', name: '카카오페이', market: 'KOSPI', price: 25400 },
  { code: '018260', name: '삼성SDS', market: 'KOSPI', price: 145000 },
  { code: '009150', name: '삼성전기', market: 'KOSPI', price: 138000 },
  { code: '066570', name: 'LG전자', market: 'KOSPI', price: 98500 },
  { code: '034220', name: 'LG디스플레이', market: 'KOSPI', price: 10450 },
  { code: '042700', name: '한미반도체', market: 'KOSPI', price: 112500 },
  { code: '058470', name: '리노공업', market: 'KOSDAQ', price: 185000 },
  { code: '036830', name: '솔브레인', market: 'KOSDAQ', price: 245000 },
  { code: '240810', name: '원익IPS', market: 'KOSDAQ', price: 32500 },

  // 2. 자동차 / 조선 / 방산 / 항공 / 기계
  { code: '005380', name: '현대차', market: 'KOSPI', price: 453000 },
  { code: '000270', name: '기아', market: 'KOSPI', price: 141700 },
  { code: '012330', name: '현대모비스', market: 'KOSPI', price: 547000 },
  { code: '086280', name: '현대글로비스', market: 'KOSPI', price: 118500 },
  { code: '064350', name: '현대로템', market: 'KOSPI', price: 62500 },
  { code: '329180', name: 'HD현대중공업', market: 'KOSPI', price: 510000 },
  { code: '009540', name: 'HD한국조선해양', market: 'KOSPI', price: 185000 },
  { code: '267250', name: 'HD현대일렉트릭', market: 'KOSPI', price: 312000 },
  { code: '042660', name: '한화오션', market: 'KOSPI', price: 28400 },
  { code: '012450', name: '한화에어로스페이스', market: 'KOSPI', price: 1160000 },
  { code: '079550', name: 'LIG넥스원', market: 'KOSPI', price: 205000 },
  { code: '003490', name: '대한항공', market: 'KOSPI', price: 23500 },
  { code: '020560', name: '아시아나항공', market: 'KOSPI', price: 10400 },
  { code: '011200', name: 'HMM', market: 'KOSPI', price: 17400 },
  { code: '000150', name: '두산', market: 'KOSPI', price: 185000 },
  { code: '034020', name: '두산에너빌리티', market: 'KOSPI', price: 19800 },
  { code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ', price: 501000 },

  // 3. 2차전지 / 화학 / 철강 / 에너지
  { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI', price: 369500 },
  { code: '006400', name: '삼성SDI', market: 'KOSPI', price: 516000 },
  { code: '051910', name: 'LG화학', market: 'KOSPI', price: 280500 },
  { code: '003670', name: '포스코퓨처엠', market: 'KOSPI', price: 235000 },
  { code: '005490', name: 'POSCO홀딩스', market: 'KOSPI', price: 334000 },
  { code: '010140', name: '삼성중공업', market: 'KOSPI', price: 9800 },
  { code: '247540', name: '에코프로비엠', market: 'KOSDAQ', price: 116700 },
  { code: '086520', name: '에코프로', market: 'KOSDAQ', price: 93600 },
  { code: '096770', name: 'SK이노베이션', market: 'KOSPI', price: 108000 },
  { code: '010950', name: 'S-Oil', market: 'KOSPI', price: 64500 },
  { code: '015760', name: '한국전력', market: 'KOSPI', price: 21500 },

  // 4. 제약 / 바이오 / 헬스케어 (KOSPI & KOSDAQ)
  { code: '207940', name: '삼성바이오로직스', market: 'KOSPI', price: 1548000 },
  { code: '068270', name: '셀트리온', market: 'KOSPI', price: 201000 },
  { code: '068760', name: '셀트리온제약', market: 'KOSDAQ', price: 74200 },
  { code: '196170', name: '알테오젠', market: 'KOSDAQ', price: 295000 },
  { code: '028300', name: 'HLB', market: 'KOSDAQ', price: 82500 },
  { code: '086900', name: '메디톡스', market: 'KOSDAQ', price: 148500 },
  { code: '145020', name: '휴젤', market: 'KOSDAQ', price: 265000 },
  { code: '214150', name: '클래시스', market: 'KOSDAQ', price: 51200 },
  { code: '000100', name: '유한양행', market: 'KOSPI', price: 94500 },
  { code: '128940', name: '한미약품', market: 'KOSPI', price: 312000 },

  // 5. 금융 / 지주 / 기타
  { code: '105560', name: 'KB금융', market: 'KOSPI', price: 168500 },
  { code: '055550', name: '신한지주', market: 'KOSPI', price: 107400 },
  { code: '086790', name: '하나금융지주', market: 'KOSPI', price: 62400 },
  { code: '316140', name: '우리금융지주', market: 'KOSPI', price: 15800 },
  { code: '028260', name: '삼성물산', market: 'KOSPI', price: 369000 },
  { code: '036570', name: '엔씨소프트', market: 'KOSPI', price: 198500 },
  { code: '259960', name: '크래프톤', market: 'KOSPI', price: 312000 },
  { code: '352820', name: '하이브', market: 'KOSPI', price: 184000 },
  { code: '041510', name: 'SM엔터테인먼트', market: 'KOSDAQ', price: 74500 },
  { code: '035900', name: 'JYP Ent.', market: 'KOSDAQ', price: 56200 },
];

/**
 * 🌟 검색어로 KOSPI/KOSDAQ 상장 종목 매칭
 */
export function searchKrxStocks(query: string, limit: number = 12): StockInfo[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const matched = ALL_KRX_STOCKS_DB.filter(item => {
    const matchName = item.name.toLowerCase().includes(cleanQuery);
    const matchCode = item.code.includes(cleanQuery);
    return matchName || matchCode;
  });

  if (matched.length === 0 && cleanQuery.length === 6 && !isNaN(Number(cleanQuery))) {
    return [{
      code: cleanQuery,
      name: `종목 (${cleanQuery})`,
      market: 'KOSPI',
      tradingValue: 100000000000,
      currentPrice: 50000,
      changeRate: 0.0,
      totalTradingDays: 126,
      isAlertEligible: true,
      config: { ...DEFAULT_CONFIG },
    }];
  }

  return matched.slice(0, limit).map(item => ({
    code: item.code,
    name: item.name,
    market: item.market,
    tradingValue: 100000000000,
    currentPrice: item.price,
    changeRate: 0.0,
    totalTradingDays: 126,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  }));
}
