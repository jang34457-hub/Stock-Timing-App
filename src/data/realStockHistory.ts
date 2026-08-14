import { DailyPriceData } from '../types/stock';

/**
 * 🌟 최근 6개월(125거래일) 거래일자 자동 생성 함수 (2026-02-16 ~ 2026-08-14)
 */
export function getTradingDates(totalDays: number = 125): string[] {
  const dates: string[] = [];
  const curr = new Date(2026, 7, 14); // 2026-08-14
  const d = new Date(curr);

  while (dates.length < totalDays) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.unshift(`${yyyy}-${mm}-${dd}`);
    }
    d.setDate(d.getDate() - 1);
  }
  return dates;
}

/**
 * 🌟 주요 종목별 6개월간 현실적인 시세 주가 추이 파동 매핑 데이터
 */
export function getRealStockHistory(stockCode: string, totalDays: number = 125): DailyPriceData[] {
  const dates = getTradingDates(totalDays);
  const result: DailyPriceData[] = [];

  // 종목별 6개월 시세 파동 설정 (시작 종가, 3개월 최저점/최고점, 최신 종가)
  const stockProfileMap: Record<string, { start: number; peak: number; trough: number; end: number }> = {
    '005930': { start: 74500, peak: 87500, trough: 62800, end: 68500 },  // 삼성전자
    '000660': { start: 148000, peak: 234000, trough: 154000, end: 186500 }, // SK하이닉스
    '373220': { start: 395000, peak: 442000, trough: 325000, end: 372000 }, // LG에너지솔루션
    '005380': { start: 235000, peak: 298000, trough: 215000, end: 245000 }, // 현대차
    '207940': { start: 812000, peak: 998000, trough: 735000, end: 782000 }, // 삼성바이오로직스
    '035420': { start: 202000, peak: 235000, trough: 158000, end: 178000 }, // NAVER
    '000270': { start: 114000, peak: 135000, trough: 98000, end: 112500 },  // 기아
    '005490': { start: 435000, peak: 485000, trough: 345000, end: 365000 }, // POSCO홀딩스
    '068270': { start: 182000, peak: 224000, trough: 168000, end: 195000 }, // 셀트리온
    '105560': { start: 68000, peak: 92500, trough: 64000, end: 86500 },    // KB금융
    '035720': { start: 58500, peak: 62000, trough: 38200, end: 45500 },    // 카카오
    '006400': { start: 420000, peak: 468000, trough: 310000, end: 335000 }, // 삼성SDI
    '012330': { start: 238000, peak: 268000, trough: 205000, end: 225000 }, // 현대모비스
    '247540': { start: 248000, peak: 312000, trough: 165000, end: 185000 }, // 에코프로비엠
    '086520': { start: 125000, peak: 154000, trough: 81000, end: 92500 },   // 에코프로
    '012450': { start: 168000, peak: 315000, trough: 155000, end: 295000 }, // 한화에어로스페이스
    '051910': { start: 410000, peak: 455000, trough: 295000, end: 315000 }, // LG화학
    '055550': { start: 44500, peak: 61500, trough: 42000, end: 56200 },    // 신한지주
    '028260': { start: 148000, peak: 168000, trough: 128000, end: 142000 }, // 삼성물산
    '900010': { start: 21000, peak: 32500, trough: 19500, end: 28500 },     // K-AI로보틱스
  };

  const profile = stockProfileMap[stockCode] || { start: 50000, peak: 65000, trough: 42000, end: 55000 };

  // 125거래일 주가 곡선 생성 (전반기 상승/하락 ➔ 중반기 최고점/최저점 형성 ➔ 후반기 최신 종가로 정밀 수렴)
  dates.forEach((dateStr, idx) => {
    const rowNum = idx + 1;
    const progress = idx / (dates.length - 1); // 0.0 ~ 1.0

    let baseP = profile.start;

    if (progress <= 0.35) {
      // 0~35% (2월~4월): 최고점 피크를 향해 상승 파동
      const t = progress / 0.35;
      baseP = profile.start + (profile.peak - profile.start) * Math.sin(t * (Math.PI / 2));
    } else if (progress <= 0.75) {
      // 35%~75% (5월~7월): 최저점 딥 바닥까지 하락 조정 파동
      const t = (progress - 0.35) / 0.40;
      baseP = profile.peak - (profile.peak - profile.trough) * Math.sin(t * (Math.PI / 2));
    } else {
      // 75%~100% (7월~8월): 최저점 대비 반등하여 현재 실시간 종가로 수렴
      const t = (progress - 0.75) / 0.25;
      baseP = profile.trough + (profile.end - profile.trough) * Math.sin(t * (Math.PI / 2));
    }

    // 미세 일별 거래 파동 추가 (+- 1.2%)
    const noiseSeed = (Math.sin(idx * 4.3 + stockCode.charCodeAt(0)) * 0.012);
    let closePrice = Math.round(baseP * (1 + noiseSeed));

    // 호가 단위 정돈 (10만 원 이상: 500원 단위, 1만 원 이상: 100원 단위)
    if (closePrice >= 100000) {
      closePrice = Math.round(closePrice / 500) * 500;
    } else if (closePrice >= 10000) {
      closePrice = Math.round(closePrice / 100) * 100;
    }

    // 🌟 마지막 날짜는 정확히 실시간 현 종가 보장
    if (idx === dates.length - 1) {
      closePrice = profile.end;
    }

    result.push({
      date: dateStr,
      rowNum,
      closePrice,
    });
  });

  return result;
}
