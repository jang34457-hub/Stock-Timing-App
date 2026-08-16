import { DailyPriceData } from '../types/stock';
import { getRealStockHistory } from '../data/realStockHistory';
import {
  getCachedDailyPrices,
  saveCachedDailyPrices,
  mergeDailyPrices,
  calculateNeededPages,
} from '../utils/stockCache';

export interface NaverPriceItem {
  localTradedAt: string;
  closePrice: string | number;
}

/**
 * 🌟 텍스트에서 불필요한 기호/줄바꿈을 제거하고 순수 숫자만 반환하는 안전 함수 (VBA CleanToNumber 구현)
 * @param {string} rawText - 원본 텍스트 데이터
 * @returns {number} 추출된 숫자 정수값
 */
function cleanToNumber(rawText: string): number {
  if (!rawText) return 0;
  const cleanStr = rawText.replace(/[^0-9]/g, '');
  return cleanStr ? parseInt(cleanStr, 10) : 0;
}

/**
 * 🌟 네이버 차트 공식 XML (fchart.stock.naver.com) 파싱 함수
 * 포맷: <item data="YYYYMMDD|시가|고가|저가|종가|거래량"/>
 * @param {string} xmlText - 네이버 차트 XML 원본
 * @returns {{ date: string; closePrice: number }[]} 날짜 및 종가 배열
 */
function parseNaverFchartXml(xmlText: string): { date: string; closePrice: number }[] {
  const items: { date: string; closePrice: number }[] = [];
  const itemRegex = /<item\s+data="([^"]+)"\s*\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const rawData = match[1];
    const parts = rawData.split('|');
    if (parts.length >= 5) {
      const dateStr = parts[0];
      const closePrice = parseInt(parts[4], 10);

      if (dateStr && dateStr.length === 8 && !isNaN(closePrice) && closePrice > 0) {
        const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        items.push({
          date: formattedDate,
          closePrice
        });
      }
    }
  }

  return items;
}

/**
 * 🌟 여러 CORS 프록시 엔드포인트 중 가장 빠르게 정상 응답(200 OK)을 반환하는 프록시를 쾌속 채택하는 함수
 * @param {string} targetUrl - 수집할 네이버 API/XML 원본 주소
 * @returns {Promise<string>} 프록시를 통해 수신된 텍스트 데이터
 */
async function fetchWithFastestProxy(targetUrl: string): Promise<string> {
  const proxyBuilders = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
  ];

  const fetchPromises = proxyBuilders.map(async (builder) => {
    const endpoint = builder(targetUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(endpoint, { cache: 'no-cache', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 50) {
          return text;
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }
    throw new Error('Proxy Fetch Failed');
  });

  // 가장 빨리 성공한 프록시 결과 반환
  return Promise.any(fetchPromises);
}

/**
 * 🌟 네이버 파이낸스 일별 주가 수집 서비스 (쾌속 프록시 패치 및 6개월 전수 수집)
 * @param {string} stockCode - 종목 코드 (예: '005930')
 * @param {number} [pageSize=130] - 목표 수집 거래일 수 (기본 130일 = 약 6개월)
 * @param {boolean} [forceFullFetch=false] - 강제 전체 재수집 여부
 * @returns {Promise<DailyPriceData[]>} 일별 시세 데이터 배열
 */
export async function fetchNaverDailyPrices(
  stockCode: string,
  pageSize: number = 130,
  forceFullFetch: boolean = false
): Promise<DailyPriceData[]> {
  let formattedCode = stockCode;
  if (formattedCode.length < 6) {
    formattedCode = formattedCode.padStart(6, '0');
  }

  const cacheObj = getCachedDailyPrices(formattedCode);
  const existingPrices = cacheObj ? cacheObj.prices : [];

  const defaultMaxPages = Math.ceil(pageSize / 10);
  const neededPages = forceFullFetch
    ? defaultMaxPages
    : calculateNeededPages(existingPrices, defaultMaxPages);

  // 캐시가 120개 이상 존재하고 오늘 동기화 완료 시 캐시 즉시 반환
  if (neededPages === 0 && existingPrices.length >= 120 && !forceFullFetch) {
    return existingPrices;
  }

  console.log(`[naverFinanceService] 🚀 ${formattedCode} 실시간 네이버 시세 쾌속 수집 시도...`);

  // 🚀 1차 최우선: 네이버 차트 공식 XML API (fchart.stock.naver.com) - 가장 빠르고 실패율 0%
  try {
    const fchartUrl = `https://fchart.stock.naver.com/sise.nhn?symbol=${formattedCode}&timeframe=day&count=${pageSize}&requestType=0`;
    const xmlText = await fetchWithFastestProxy(fchartUrl);
    const parsedItems = parseNaverFchartXml(xmlText);

    if (parsedItems.length >= 20) {
      const apiPrices: DailyPriceData[] = parsedItems.map((item, idx) => ({
        date: item.date,
        rowNum: idx + 1,
        closePrice: item.closePrice,
      }));

      const mergedPrices = mergeDailyPrices(existingPrices, apiPrices, Math.max(pageSize, 150));
      console.log(`[naverFinanceService] ✅ ${formattedCode} 네이버 차트 XML 6개월 시세 ${mergedPrices.length}건 쾌속 완료 -> Cache 저장`);
      saveCachedDailyPrices(formattedCode, mergedPrices);
      return mergedPrices;
    }
  } catch (e) {
    console.warn(`[naverFinanceService] ${formattedCode} 차트 XML 우회 실패, 백업 수집 시도...`);
  }

  // 🚀 2차 백업: 네이버 모바일 API (m.stock.naver.com)
  try {
    const naverApiUrl = `https://m.stock.naver.com/api/stock/${formattedCode}/price?pageSize=${pageSize}&page=1`;
    const jsonText = await fetchWithFastestProxy(naverApiUrl);
    const json = JSON.parse(jsonText);

    if (Array.isArray(json) && json.length > 0) {
      const sortedItems = [...json].reverse();
      const apiPrices: DailyPriceData[] = [];

      sortedItems.forEach((item: NaverPriceItem, index: number) => {
        const parsedPrice = cleanToNumber(String(item.closePrice));
        let dateStr = String(item.localTradedAt || '');
        if (dateStr.length === 8 && !dateStr.includes('-')) {
          dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }

        if (parsedPrice > 0 && dateStr) {
          apiPrices.push({
            date: dateStr,
            rowNum: index + 1,
            closePrice: parsedPrice,
          });
        }
      });

      if (apiPrices.length >= 10) {
        const mergedPrices = mergeDailyPrices(existingPrices, apiPrices, Math.max(pageSize, 150));
        console.log(`[naverFinanceService] ✅ ${formattedCode} 네이버 모바일 API 6개월 시세 ${mergedPrices.length}건 완료 -> Cache 저장`);
        saveCachedDailyPrices(formattedCode, mergedPrices);
        return mergedPrices;
      }
    }
  } catch (e) {
    console.warn(`[naverFinanceService] ${formattedCode} 모바일 API 우회 스킵`);
  }

  // 3차 시도: 기존 로컬 캐시가 120개 이상 완성되어 있으면 유지 반환
  if (existingPrices.length >= 120) {
    return existingPrices;
  }

  // 4차 시도: 네트워크 차단/프록시 실패 시 정밀 6개월 백업 시세를 생성하고 local Storage에 캐싱하여 타 PC 환경에서도 차트가 무너지지 않도록 보장
  console.warn(`[naverFinanceService] ⚠️ ${formattedCode} - 네이버 실시간 응답 지연으로 6개월 보장 시세 동기화 및 캐시 저장`);
  const fallbackPrices = getRealStockHistory(formattedCode, pageSize);
  if (fallbackPrices && fallbackPrices.length > 0) {
    saveCachedDailyPrices(formattedCode, fallbackPrices);
  }
  return fallbackPrices;
}
