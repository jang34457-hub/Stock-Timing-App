import { StockInfo, DailyPriceData } from '../types/stock';

export const DEFAULT_CONFIG = {
  x1: 10,
  x2: 20,
  y1: 10,
  y2: 20,
};

/**
 * 🌟 대한민국 20대 대표 대세주 정밀 시세 데이터베이스
 * - 삼성전자(005930) 수치는 사용자 검증 값 100% 보존
 * - 나머지 19개 종목도 한국 증시 실제 주가 단위로 완벽 교정
 */
export const TOP_20_STOCKS: StockInfo[] = [
  {
    code: '005930',
    name: '삼성전자',
    market: 'KOSPI',
    tradingValue: 2589106000000,
    currentPrice: 270250,
    changeRate: 0.84,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '000660',
    name: 'SK하이닉스',
    market: 'KOSPI',
    tradingValue: 3120000000000,
    currentPrice: 186500,
    changeRate: -1.45,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '373220',
    name: 'LG에너지솔루션',
    market: 'KOSPI',
    tradingValue: 840000000000,
    currentPrice: 372000,
    changeRate: 0.95,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '005380',
    name: '현대차',
    market: 'KOSPI',
    tradingValue: 780000000000,
    currentPrice: 245000,
    changeRate: 2.31,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '207940',
    name: '삼성바이오로직스',
    market: 'KOSPI',
    tradingValue: 610000000000,
    currentPrice: 782000,
    changeRate: -0.49,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '035420',
    name: 'NAVER',
    market: 'KOSPI',
    tradingValue: 590000000000,
    currentPrice: 178000,
    changeRate: 1.14,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '000270',
    name: '기아',
    market: 'KOSPI',
    tradingValue: 570000000000,
    currentPrice: 112500,
    changeRate: 1.81,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '005490',
    name: 'POSCO홀딩스',
    market: 'KOSPI',
    tradingValue: 540000000000,
    currentPrice: 365000,
    changeRate: -1.08,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '068270',
    name: '셀트리온',
    market: 'KOSPI',
    tradingValue: 490000000000,
    currentPrice: 195000,
    changeRate: 0.52,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '105560',
    name: 'KB금융',
    market: 'KOSPI',
    tradingValue: 450000000000,
    currentPrice: 86500,
    changeRate: 1.41,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '035720',
    name: '카카오',
    market: 'KOSPI',
    tradingValue: 410000000000,
    currentPrice: 45500,
    changeRate: -0.87,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '006400',
    name: '삼성SDI',
    market: 'KOSPI',
    tradingValue: 390000000000,
    currentPrice: 335000,
    changeRate: -1.47,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '012330',
    name: '현대모비스',
    market: 'KOSPI',
    tradingValue: 370000000000,
    currentPrice: 225000,
    changeRate: 0.89,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '247540',
    name: '에코프로비엠',
    market: 'KOSDAQ',
    tradingValue: 350000000000,
    currentPrice: 185000,
    changeRate: -2.63,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '086520',
    name: '에코프로',
    market: 'KOSDAQ',
    tradingValue: 330000000000,
    currentPrice: 92500,
    changeRate: -1.80,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '012450',
    name: '한화에어로스페이스',
    market: 'KOSPI',
    tradingValue: 320000000000,
    currentPrice: 295000,
    changeRate: 3.86,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '051910',
    name: 'LG화학',
    market: 'KOSPI',
    tradingValue: 310000000000,
    currentPrice: 315000,
    changeRate: -0.94,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '055550',
    name: '신한지주',
    market: 'KOSPI',
    tradingValue: 290000000000,
    currentPrice: 56200,
    changeRate: 1.08,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '028260',
    name: '삼성물산',
    market: 'KOSPI',
    tradingValue: 270000000000,
    currentPrice: 142000,
    changeRate: 0.57,
    totalTradingDays: 125,
    isAlertEligible: true,
    config: { ...DEFAULT_CONFIG },
  },
  {
    code: '900010',
    name: 'K-AI로보틱스 (신규상장주)',
    market: 'KOSDAQ',
    tradingValue: 250000000000,
    currentPrice: 28500,
    changeRate: 5.56,
    totalTradingDays: 35,
    isAlertEligible: false,
    config: { ...DEFAULT_CONFIG },
  },
];

/**
 * 🌟 일별 종가 시세 파동 정밀 생성기
 */
export function generateMockDailyPrices(stockCode: string, totalDays: number = 125, targetCurrentPrice?: number): DailyPriceData[] {
  const stockObj = TOP_20_STOCKS.find(s => s.code === stockCode);
  const baseCurrentPrice = targetCurrentPrice || stockObj?.currentPrice || 270250;

  const prices: DailyPriceData[] = [];
  const currentDate = new Date(2026, 7, 14);
  const tradeDates: string[] = [];
  
  let d = new Date(currentDate);
  while (tradeDates.length < totalDays) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      tradeDates.unshift(`${yyyy}-${mm}-${dd}`);
    }
    d.setDate(d.getDate() - 1);
  }

  // 🌟 삼성전자 (005930) 검증 수치 100% 철저 보존
  if (stockCode === '005930') {
    const totalCount = tradeDates.length;

    const exactPricesMap: Record<string, number> = {
      '2026-07-29': 237000,
      '2026-07-30': 237000,
      '2026-07-31': 238000, // 3일 평균 237,333원
      '2026-08-11': 241000,
      '2026-08-12': 260000,
      '2026-08-13': 288000, // 3일 평균 263,000원 (Y1 매수신호)
      '2026-08-14': 270250,
    };

    tradeDates.forEach((dateStr, index) => {
      const rowNum = index + 1;
      let closeP = exactPricesMap[dateStr];

      if (!closeP) {
        const progress = index / (totalCount - 1);
        if (progress <= 0.65) {
          const t = progress / 0.65;
          closeP = Math.round((151600 + (374500 - 151600) * Math.pow(t, 1.2)) / 500) * 500;
        } else if (progress <= 0.88) {
          const t = (progress - 0.65) / 0.23;
          closeP = Math.round((374500 - (374500 - 237000) * t) / 500) * 500;
        } else {
          const t = (progress - 0.88) / 0.12;
          closeP = Math.round((237000 + (270250 - 237000) * t) / 500) * 500;
        }
      }

      prices.push({
        date: dateStr,
        rowNum,
        closePrice: closeP,
      });
    });

    return prices;
  }

  // 🌟 나머지 19개 대세주 종목 정밀 주가 호가 파동
  const seed = stockCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let rawPrices: number[] = [];
  let p = baseCurrentPrice * 0.78; 

  tradeDates.forEach((_, index) => {
    const rowNum = index + 1;
    const cycle1 = Math.sin((rowNum + seed) / 7.2) * 0.034;
    const cycle2 = Math.cos((rowNum + seed) / 18.5) * 0.042;
    const noise = (Math.sin(rowNum * 2.9 + seed) * 0.011);
    
    const dailyChange = cycle1 + cycle2 + noise;
    p = p * (1 + dailyChange);
    if (p < 500) p = 500;
    rawPrices.push(p);
  });

  const scaleFactor = baseCurrentPrice / rawPrices[rawPrices.length - 1];

  rawPrices.forEach((rawP, index) => {
    let finalClosePrice = Math.round(rawP * scaleFactor);

    if (finalClosePrice >= 100000) {
      finalClosePrice = Math.round(finalClosePrice / 500) * 500;
    } else if (finalClosePrice >= 10000) {
      finalClosePrice = Math.round(finalClosePrice / 100) * 100;
    } else if (finalClosePrice >= 1000) {
      finalClosePrice = Math.round(finalClosePrice / 50) * 50;
    }

    prices.push({
      date: tradeDates[index],
      rowNum: index + 1,
      closePrice: finalClosePrice,
    });
  });

  return prices;
}
