import { StockInfo, DailyPriceData, CalculatedStockData, SignalType, SignalDetail, PushNotification } from '../types/stock';

/**
 * 1. ROW_NUMBER(거래일 순서) 기준 3개 거래일 종가 산술 평균 계산
 */
export function compute3DayMA(prices: DailyPriceData[]): DailyPriceData[] {
  const sorted = [...prices].sort((a, b) => a.rowNum - b.rowNum);

  return sorted.map((item, index) => {
    let sum = 0;
    let count = 0;
    
    for (let i = Math.max(0, index - 2); i <= index; i++) {
      sum += sorted[i].closePrice;
      count++;
    }
    
    const ma3Day = Math.round(sum / count);
    return {
      ...item,
      ma3Day
    };
  });
}

/**
 * 2. 매도, 매수 추천점: 오직 최근 3개월 최고점/최저점 형성 이후 
 * X1(10%), X2(20%) 하락한 정확한 날짜 & Y1(10%), Y2(20%) 상승한 정확한 날짜에만 핀포인트 마킹!
 */
export function calculateStockSignals(stock: StockInfo, prices: DailyPriceData[]): CalculatedStockData {
  const pricesWithMA = compute3DayMA(prices);

  if (stock.totalTradingDays < 60 || !stock.isAlertEligible || pricesWithMA.length < 3) {
    const latest = pricesWithMA[pricesWithMA.length - 1];
    return {
      stock: { ...stock, isAlertEligible: false },
      prices: pricesWithMA,
      peak3Month: latest?.ma3Day || 0,
      trough3Month: latest?.ma3Day || 0,
      latestMa3Day: latest?.ma3Day || 0,
      dropFromPeakPercent: 0,
      riseFromTroughPercent: 0,
      currentState: 'NORMAL',
      signalsHistory: []
    };
  }

  const { x1, x2, y1, y2 } = stock.config;
  const signalsHistory: SignalDetail[] = [];

  // 최근 3개월 (최근 60거래일) 윈도우 추출
  const startIndex = Math.max(0, pricesWithMA.length - 60);
  const windowPrices = pricesWithMA.slice(startIndex);

  // 1) 최근 3개월 최저점(Trough) 및 해당 거래일 인덱스 찾기
  let minMA = Infinity;
  let minIndex = 0;

  // 2) 최근 3개월 최고점(Peak) 및 해당 거래일 인덱스 찾기
  let maxMA = -Infinity;
  let maxIndex = 0;

  windowPrices.forEach((p, idx) => {
    const ma = p.ma3Day || p.closePrice;
    if (ma < minMA) {
      minMA = ma;
      minIndex = idx;
    }
    if (ma > maxMA) {
      maxMA = ma;
      maxIndex = idx;
    }
  });

  // 🌟 [Y1, Y2 매수 추천점]: 최저점(minIndex) 이후 거래일에서 +Y1%, +Y2% 상승한 첫 번째 날짜 탐색
  let y1Found = false;
  let y2Found = false;

  for (let i = minIndex + 1; i < windowPrices.length; i++) {
    const curItem = windowPrices[i];
    const curMA = curItem.ma3Day || curItem.closePrice;
    const risePercent = Number((((curMA - minMA) / minMA) * 100).toFixed(2));

    // Y1 (+10% 상승한 첫 날짜)
    if (!y1Found && risePercent >= y1) {
      y1Found = true;
      signalsHistory.push({
        date: curItem.date,
        signalType: 'BUY_1',
        maPrice: curMA,
        referencePrice: minMA,
        changePercent: risePercent,
        message: `최근 3개월 최저점(${minMA.toLocaleString()}원) 대비 ${risePercent}% 상승 (Y1=${y1}% 1차 매수 관심)`,
      });
    }

    // Y2 (+20% 상승한 첫 날짜)
    if (!y2Found && risePercent >= y2) {
      y2Found = true;
      signalsHistory.push({
        date: curItem.date,
        signalType: 'BUY_2',
        maPrice: curMA,
        referencePrice: minMA,
        changePercent: risePercent,
        message: `최근 3개월 최저점(${minMA.toLocaleString()}원) 대비 ${risePercent}% 상승 (Y2=${y2}% 2차 강력 매수)`,
      });
    }
  }

  // 🌟 [X1, X2 매도 추천점]: 최고점(maxIndex) 이후 거래일에서 -X1%, -X2% 하락한 첫 번째 날짜 탐색
  let x1Found = false;
  let x2Found = false;

  for (let i = maxIndex + 1; i < windowPrices.length; i++) {
    const curItem = windowPrices[i];
    const curMA = curItem.ma3Day || curItem.closePrice;
    const dropPercent = Number((((maxMA - curMA) / maxMA) * 100).toFixed(2));

    // X1 (-10% 하락한 첫 날짜)
    if (!x1Found && dropPercent >= x1) {
      x1Found = true;
      signalsHistory.push({
        date: curItem.date,
        signalType: 'SELL_1',
        maPrice: curMA,
        referencePrice: maxMA,
        changePercent: dropPercent,
        message: `최근 3개월 최고점(${maxMA.toLocaleString()}원) 대비 ${dropPercent}% 하락 (X1=${x1}% 1차 매도 주의)`,
      });
    }

    // X2 (-20% 하락한 첫 날짜)
    if (!x2Found && dropPercent >= x2) {
      x2Found = true;
      signalsHistory.push({
        date: curItem.date,
        signalType: 'SELL_2',
        maPrice: curMA,
        referencePrice: maxMA,
        changePercent: dropPercent,
        message: `최근 3개월 최고점(${maxMA.toLocaleString()}원) 대비 ${dropPercent}% 하락 (X2=${x2}% 2차 강력 매도)`,
      });
    }
  }

  // 날짜순 정렬
  signalsHistory.sort((a, b) => a.date.localeCompare(b.date));

  const latestItem = pricesWithMA[pricesWithMA.length - 1];
  const latestMA = latestItem ? (latestItem.ma3Day || latestItem.closePrice) : 0;

  const dropFromPeakPercent = maxMA > 0 
    ? Number((((maxMA - latestMA) / maxMA) * 100).toFixed(2)) 
    : 0;

  const riseFromTroughPercent = minMA > 0 
    ? Number((((latestMA - minMA) / minMA) * 100).toFixed(2)) 
    : 0;

  let currentState: SignalType = 'NORMAL';
  if (signalsHistory.length > 0) {
    currentState = signalsHistory[signalsHistory.length - 1].signalType;
  }

  return {
    stock,
    prices: pricesWithMA,
    peak3Month: maxMA,
    trough3Month: minMA,
    latestMa3Day: latestMA,
    dropFromPeakPercent,
    riseFromTroughPercent,
    currentState,
    signalsHistory,
  };
}

export function createPushNotification(stock: StockInfo, signal: SignalDetail): PushNotification {
  let title = '';
  let body = '';

  switch (signal.signalType) {
    case 'SELL_2':
      title = `🚨 [2차 강력 매도] ${stock.name} (${stock.code})`;
      body = `최근 3개월 최고점 대비 ${signal.changePercent}% 하락! (${signal.maPrice.toLocaleString()}원) 강력 매도 추천. (X2=${stock.config.x2}%)`;
      break;
    case 'SELL_1':
      title = `⚠️ [1차 매도 주의] ${stock.name} (${stock.code})`;
      body = `최근 3개월 최고점 대비 ${signal.changePercent}% 하락! (${signal.maPrice.toLocaleString()}원) 하락 주의. (X1=${stock.config.x1}%)`;
      break;
    case 'BUY_2':
      title = `🚀 [2차 강력 매수 - Y2] ${stock.name} (${stock.code})`;
      body = `최근 3개월 최저점(${signal.referencePrice.toLocaleString()}원) 대비 ${signal.changePercent}% 상승! (${signal.maPrice.toLocaleString()}원) Y2 강력 매수 추천. (Y2=${stock.config.y2}%)`;
      break;
    case 'BUY_1':
      title = `💡 [1차 매수 관심 - Y1] ${stock.name} (${stock.code})`;
      body = `최근 3개월 최저점(${signal.referencePrice.toLocaleString()}원) 대비 ${signal.changePercent}% 상승! (${signal.maPrice.toLocaleString()}원) Y1 매수 관심 권고. (Y1=${stock.config.y1}%)`;
      break;
    default:
      title = `📊 [주가 알림] ${stock.name}`;
      body = signal.message;
  }

  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    stockCode: stock.code,
    stockName: stock.name,
    signalType: signal.signalType,
    title,
    body,
    timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    isRead: false,
  };
}
