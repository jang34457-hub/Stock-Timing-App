import { DailyPriceData } from '../types/stock';

/**
 * 종목 시세 캐시 데이터 인터페이스
 */
export interface CachedStockPrices {
  /** 마지막 동기화 일시 (ISO 형식) */
  updatedAt: string;
  /** 일별 시세 데이터 배열 */
  prices: DailyPriceData[];
}

const CACHE_PREFIX = 'stock_daily_prices_';

/**
 * 로컬 스토리지에서 특정 종목의 과거 시세 데이터를 조회합니다.
 * @param {string} stockCode - 종목 코드 (예: '005930')
 * @returns {CachedStockPrices | null} 저장된 캐시 데이터 객체 또는 null
 */
export function getCachedDailyPrices(stockCode: string): CachedStockPrices | null {
  try {
    const key = `${CACHE_PREFIX}${stockCode}`;
    const rawData = localStorage.getItem(key);
    if (!rawData) return null;

    const parsed: CachedStockPrices = JSON.parse(rawData);
    if (Array.isArray(parsed.prices) && parsed.prices.length > 0) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn(`[stockCache] 캐시 로드 중 오류 발생 (${stockCode}):`, error);
    return null;
  }
}

/**
 * 로컬 스토리지에 특정 종목의 시세 데이터를 저장합니다.
 * @param {string} stockCode - 종목 코드 (예: '005930')
 * @param {DailyPriceData[]} prices - 저장할 일별 시세 데이터 배열
 * @returns {void}
 */
export function saveCachedDailyPrices(stockCode: string, prices: DailyPriceData[]): void {
  try {
    const key = `${CACHE_PREFIX}${stockCode}`;
    const cacheData: CachedStockPrices = {
      updatedAt: new Date().toISOString(),
      prices,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn(`[stockCache] 캐시 저장 중 오류 발생 (${stockCode}):`, error);
  }
}

/**
 * 기존 캐시 데이터와 신규 수집 데이터를 날짜 기준으로 중복 제거하여 병합합니다.
 * @param {DailyPriceData[]} existingPrices - 기존 캐시된 시세 데이터
 * @param {DailyPriceData[]} newPrices - 새로 수집된 시세 데이터
 * @param {number} [maxLimit=150] - 유지할 최대 거래일 수 (기본값: 150일)
 * @returns {DailyPriceData[]} 날짜 오름차순으로 정렬되고 rowNum이 재계산된 시세 데이터 배열
 */
export function mergeDailyPrices(
  existingPrices: DailyPriceData[],
  newPrices: DailyPriceData[],
  maxLimit: number = 150
): DailyPriceData[] {
  const priceMap = new Map<string, number>();

  // 1. 기존 데이터 추가
  existingPrices.forEach(item => {
    if (item.date && item.closePrice > 0) {
      priceMap.set(item.date, item.closePrice);
    }
  });

  // 2. 신규 데이터 추가 (동일 날짜의 경우 최신 수집 데이터로 덮어씀)
  newPrices.forEach(item => {
    if (item.date && item.closePrice > 0) {
      priceMap.set(item.date, item.closePrice);
    }
  });

  // 3. 날짜 기준 오름차순(과거 -> 현재) 정렬
  const sortedDates = Array.from(priceMap.keys()).sort();

  // 4. 최대 거래일 수 제한 (최신 maxLimit 개 보관)
  const trimmedDates = sortedDates.slice(Math.max(0, sortedDates.length - maxLimit));

  // 5. rowNum 1부터 다시 부여하여 반환
  return trimmedDates.map((date, index) => ({
    date,
    rowNum: index + 1,
    closePrice: priceMap.get(date) || 0,
  }));
}

/**
 * 기존 캐시 데이터의 최신 날짜와 오늘 날짜를 비교하여 필요한 네이버 시세 동기화 페이지 수를 계산합니다.
 * @param {DailyPriceData[]} cachedPrices - 기존 캐시된 시세 데이터
 * @param {number} [defaultMaxPages=13] - 전체 수집 시 기본 페이지 수 (13페이지 = 약 130거래일)
 * @returns {number} 네이버 금융에서 수집해야 할 최소 페이지 수 (0 ~ defaultMaxPages)
 */
export function calculateNeededPages(
  cachedPrices: DailyPriceData[],
  defaultMaxPages: number = 13
): number {
  // 🌟 핵심 보완: 기존 캐시 데이터 개수가 6개월 미만(120거래일 미만)이면 전체 수집 (13페이지)
  if (!cachedPrices || cachedPrices.length < 120) {
    return defaultMaxPages;
  }

  // 캐시 데이터 중 가장 최근 날짜 (정렬되어 있으므로 마지막 항목)
  const lastItem = cachedPrices[cachedPrices.length - 1];
  if (!lastItem || !lastItem.date) return defaultMaxPages;

  const lastDate = new Date(lastItem.date);
  const today = new Date();

  // 날짜 차이 계산 (일 단위)
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 당일이거나 날짜 차이가 음수인 경우 (장 시작 전이거나 오늘 이미 업데이트됨)
  if (diffDays <= 0) {
    const todayStr = today.toISOString().split('T')[0];
    if (lastItem.date === todayStr) {
      return 0; // 오늘 날짜 데이터가 이미 존재하면 0페이지 (네트워크 호출 안 함)
    }
    return 1; // 오늘 날짜가 아니면 1페이지 수집
  }

  // 대략 거래일 수 추정 (주말 감안하여 diffDays * 5/7)
  const estimatedTradingDays = Math.ceil(diffDays * (5 / 7)) + 1;

  // 페이지당 10거래일 기준 필요한 페이지 계산 (최대 defaultMaxPages)
  const neededPages = Math.ceil(estimatedTradingDays / 10);
  return Math.min(defaultMaxPages, Math.max(1, neededPages));
}

/**
 * 앱 최초 실행 시 타인 PC 브라우저 환경 등 캐시가 비어 있거나 오차가 큰 경우,
 * 기본 6개월 시세 데이터를 자동 생성하여 local Storage에 초기화/갱신합니다.
 * @param {Array<{ code: string; currentPrice?: number }>} stocks - 대상 종목 리스트
 * @param {(code: string, totalDays?: number) => DailyPriceData[]} historyGenerator - 6개월 주가 데이터 생성 함수
 * @returns {void}
 */
export function initializeStockCache(
  stocks: Array<{ code: string; currentPrice?: number }>,
  historyGenerator: (code: string, totalDays?: number) => DailyPriceData[]
): void {
  try {
    stocks.forEach(stock => {
      const existing = getCachedDailyPrices(stock.code);
      let needsRefresh = !existing || !existing.prices || existing.prices.length < 120;

      // 💡 기존 캐시의 마지막 종가가 현재가(currentPrice)와 2% 이상 차이나는 경우 자동 재동기화
      if (existing && existing.prices && existing.prices.length > 0 && stock.currentPrice) {
        const lastCachedClose = existing.prices[existing.prices.length - 1].closePrice;
        const diffRate = Math.abs(lastCachedClose - stock.currentPrice) / stock.currentPrice;
        if (diffRate > 0.02) {
          needsRefresh = true;
        }
      }

      if (needsRefresh) {
        const initialPrices = historyGenerator(stock.code, 130);
        if (initialPrices && initialPrices.length > 0) {
          saveCachedDailyPrices(stock.code, initialPrices);
          console.log(`[stockCache] 💡 ${stock.code} 정밀 6개월 시세 캐시 자동 갱신 완료 (${initialPrices.length}건)`);
        }
      }
    });
  } catch (error) {
    console.warn('[stockCache] 초기 캐시 데이터 생성 중 예외 발생:', error);
  }
}

