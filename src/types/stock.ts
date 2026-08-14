export type SignalType = 'NORMAL' | 'BUY_1' | 'BUY_2' | 'SELL_1' | 'SELL_2';

export interface StockConfig {
  x1: number; // 1차 매도 하락률 (%)
  x2: number; // 2차 매도 하락률 (%)
  y1: number; // 1차 매수 상승률 (%)
  y2: number; // 2차 매수 상승률 (%)
}

export interface StockInfo {
  code: string;           // 종목코드 (예: '005930')
  name: string;           // 종목명 (예: '삼성전자')
  market: 'KOSPI' | 'KOSDAQ';
  tradingValue: number;   // 거래대금 (원)
  currentPrice: number;   // 최신 종가
  changeRate: number;     // 전일대비 변동률 (%)
  totalTradingDays: number; // 총 거래일수 (60일 미만 판단용)
  isAlertEligible: boolean; // 60거래일 이상 데이터 존재 시 true
  config: StockConfig;    // 종목별 X1, X2, Y1, Y2 설정
}

export interface DailyPriceData {
  date: string;         // 'YYYY-MM-DD'
  rowNum: number;       // 거래일 순서 (오름차순 1, 2, 3...)
  closePrice: number;   // 당일 종가
  ma3Day?: number;      // 3거래일 이동평균 (rowNum 3개 그룹핑 평균)
}

export interface SignalDetail {
  date: string;
  signalType: SignalType;
  maPrice: number;
  referencePrice: number; // 기준 3개월 Peak(최고) 또는 Trough(최저)
  changePercent: number;  // Peak/Trough 대비 변동 %
  message: string;
}

export interface CalculatedStockData {
  stock: StockInfo;
  prices: DailyPriceData[]; // 3일 평균 포함
  peak3Month: number;       // 최근 3개월(최근 60거래일) 3일 평균의 최고치
  trough3Month: number;     // 최근 3개월(최근 60거래일) 3일 평균의 최저치
  latestMa3Day: number;
  dropFromPeakPercent: number;   // 최고치 대비 하락률 (%)
  riseFromTroughPercent: number; // 최저치 대비 상승률 (%)
  currentState: SignalType;
  signalsHistory: SignalDetail[];
}

export interface PushNotification {
  id: string;
  stockCode: string;
  stockName: string;
  signalType: SignalType;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
}
