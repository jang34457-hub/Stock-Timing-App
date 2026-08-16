import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StockInfo, StockConfig, DailyPriceData, CalculatedStockData } from './types/stock';
import { TOP_20_STOCKS } from './data/mockStocks';
import { getRealStockHistory } from './data/realStockHistory';
import { calculateStockSignals } from './utils/signalEngine';
import { fetchNaverDailyPrices } from './services/naverFinanceService';
import { getCachedDailyPrices, initializeStockCache } from './utils/stockCache';
import { Navbar } from './components/Navbar';
import { Top20List } from './components/Top20List';
import { Watchlist } from './components/Watchlist';
import { StockChart } from './components/StockChart';
import { ConfigModal } from './components/ConfigModal';

export const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockInfo[]>(TOP_20_STOCKS);
  const [activeTab, setActiveTab] = useState<'top20' | 'watchlist' | 'chart'>('top20');
  const [watchlistCodes, setWatchlistCodes] = useState<string[]>(['005930', '000660', '373220', '277810']);
  const [selectedStockCode, setSelectedStockCode] = useState<string>('005930');

  const [configTargetStock, setConfigTargetStock] = useState<StockInfo | null>(null);
  const [isLoadingNaver, setIsLoadingNaver] = useState<boolean>(false);
  const [isLoadingTop20, setIsLoadingTop20] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // 🌟 앱 마운트 시 오래된 오염 캐시(비거래일 포함 찌꺼기) 자동 정화 세척
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('stock_daily_prices_') || key.startsWith('downloaded_stock_history_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Cache purge error:', e);
    }
  }, []);

  /**
   * 🌟 초기 일별 시세 맵 생성자 (한국거래소 공식 거래일 100% 종가 데이터 로드)
   */
  const [dailyPricesMap, setDailyPricesMap] = useState<Record<string, DailyPriceData[]>>(() => {
    const initialMap: Record<string, DailyPriceData[]> = {};
    TOP_20_STOCKS.forEach(stock => {
      initialMap[stock.code] = getRealStockHistory(stock.code, 130);
    });
    return initialMap;
  });

  /**
   * 🌟 대세주 Top 20 전 종목에 대해 네이버 차트 공식 API로 6개월(130거래일) 실시간 시세를 100% 쾌속 전수 수집
   * @returns {Promise<void>}
   */
  const refreshAllTop20Stocks = useCallback(async () => {
    setIsLoadingTop20(true);
    setSyncProgress({ current: 0, total: TOP_20_STOCKS.length });

    try {
      // Top 20 전 종목을 순차 쾌속 동기화
      for (let i = 0; i < TOP_20_STOCKS.length; i++) {
        const stock = TOP_20_STOCKS[i];
        setSyncProgress({ current: i + 1, total: TOP_20_STOCKS.length });

        try {
          const realPrices = await fetchNaverDailyPrices(stock.code, 130, true);
          if (realPrices && realPrices.length > 0) {
            setDailyPricesMap(prev => ({
              ...prev,
              [stock.code]: realPrices
            }));

            const latestPriceItem = realPrices[realPrices.length - 1];
            const prevPriceItem = realPrices[realPrices.length - 2];
            if (latestPriceItem) {
              const latestClose = latestPriceItem.closePrice;
              const prevClose = prevPriceItem ? prevPriceItem.closePrice : latestClose;
              const changeRate = prevClose > 0
                ? Number((((latestClose - prevClose) / prevClose) * 100).toFixed(2))
                : 0;

              setStocks(prev =>
                prev.map(s =>
                  s.code === stock.code
                    ? { ...s, currentPrice: latestClose, changeRate }
                    : s
                )
              );
            }
          }
        } catch (e) {
          console.warn(`[Top20 6개월 수집 예외] ${stock.name}(${stock.code}):`, e);
        }

        // 종목 간 150ms 쾌속 간격
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      setLastSyncTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Top 20 전체 동기화 중 오류 발생:', err);
    } finally {
      setIsLoadingTop20(false);
      setSyncProgress(null);
    }
  }, []);

  // 🌟 앱 구동 시 자동 1회 실행하여 대세주 Top 20 전 종목의 6개월 실시간 시세를 순차 동기화
  useEffect(() => {
    refreshAllTop20Stocks();
  }, [refreshAllTop20Stocks]);

  /**
   * 단일 종목 시세 상세 동기화 함수
   * @param {string} stockCode - 동기화 대상 종목 코드
   */
  const loadNaverStockData = async (stockCode: string) => {
    setIsLoadingNaver(true);
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 800));

    try {
      const fetchPromise = fetchNaverDailyPrices(stockCode, 130, true);
      const [realPrices] = await Promise.all([fetchPromise, minDelayPromise]);

      if (realPrices && realPrices.length > 0) {
        setDailyPricesMap(prev => ({
          ...prev,
          [stockCode]: realPrices
        }));

        const latestPriceItem = realPrices[realPrices.length - 1];
        const prevPriceItem = realPrices[realPrices.length - 2];
        if (latestPriceItem) {
          const latestClose = latestPriceItem.closePrice;
          const prevClose = prevPriceItem ? prevPriceItem.closePrice : latestClose;
          const changeRate = prevClose > 0
            ? Number((((latestClose - prevClose) / prevClose) * 100).toFixed(2))
            : 0;

          setStocks(prev =>
            prev.map(s =>
              s.code === stockCode
                ? { ...s, currentPrice: latestClose, changeRate }
                : s
            )
          );
        }
      }
    } catch (err) {
      console.warn(`시세 동기화 수신 처리: ${stockCode}`, err);
    } finally {
      setIsLoadingNaver(false);
    }
  };

  /**
   * ➕ 관심종목 검색 드롭다운 종목 클릭 선택 핸들러
   * 1) stocks 리스트 추가
   * 2) watchlistCodes 리스트 추가
   * 3) 최근 6개월 일별 종가 시세 실시간 자동 수집 동기화 (loadNaverStockData)
   * 4) 관심종목 표(테이블)에 즉시 포함
   */
  const handleAddCustomStock = async (newStock: StockInfo) => {
    setStocks(prev => {
      if (prev.some(s => s.code === newStock.code)) return prev;
      return [...prev, newStock];
    });

    setWatchlistCodes(prev => {
      if (prev.includes(newStock.code)) return prev;
      return [...prev, newStock.code];
    });

    // 🌟 핵심: 6개월 일별 종가 시세 실시간 수집 연동
    await loadNaverStockData(newStock.code);
  };

  const watchlistCalculated = useMemo(() => {
    return watchlistCodes
      .map(code => {
        const stock = stocks.find(s => s.code === code);
        const prices = dailyPricesMap[code] || getRealStockHistory(code, 130);
        if (!stock) return null;
        return calculateStockSignals(stock, prices);
      })
      .filter((item): item is CalculatedStockData => item !== null);
  }, [watchlistCodes, stocks, dailyPricesMap]);

  const selectedCalculated = useMemo(() => {
    const stock = stocks.find(s => s.code === selectedStockCode) || stocks[0];
    const prices = dailyPricesMap[stock.code] || [];
    return calculateStockSignals(stock, prices);
  }, [selectedStockCode, stocks, dailyPricesMap]);

  const handleToggleWatchlist = (stock: StockInfo) => {
    if (watchlistCodes.includes(stock.code)) {
      setWatchlistCodes(watchlistCodes.filter(c => c !== stock.code));
    } else {
      setWatchlistCodes([...watchlistCodes, stock.code]);
      loadNaverStockData(stock.code);
    }
  };

  const handleRemoveWatchlist = (code: string) => {
    setWatchlistCodes(watchlistCodes.filter(c => c !== code));
  };

  const handleSelectStockChart = (stock: StockInfo) => {
    setSelectedStockCode(stock.code);
    setActiveTab('chart');
    loadNaverStockData(stock.code);
  };

  const handleSaveConfig = (stockCode: string, newConfig: StockConfig) => {
    setStocks(prev =>
      prev.map(s => (s.code === stockCode ? { ...s, config: newConfig } : s))
    );
  };

  const selectedStock = stocks.find(s => s.code === selectedStockCode);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistCount={watchlistCodes.length}
        selectedStockName={selectedStock?.name}
      />

      <main className="main-content">
        {activeTab === 'top20' && (
          <Top20List
            stocks={stocks}
            watchlistCodes={watchlistCodes}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectStockChart={handleSelectStockChart}
            isLoadingTop20={isLoadingTop20}
            onRefreshTop20={refreshAllTop20Stocks}
            lastSyncTime={lastSyncTime}
            syncProgress={syncProgress}
          />
        )}

        {activeTab === 'watchlist' && (
          <Watchlist
            watchlistCalculated={watchlistCalculated}
            onRemoveWatchlist={handleRemoveWatchlist}
            onSelectStockChart={handleSelectStockChart}
            onOpenConfigModal={(stock) => setConfigTargetStock(stock)}
            onAddStock={handleAddCustomStock}
          />
        )}

        {activeTab === 'chart' && (
          <StockChart
            calculatedData={selectedCalculated}
            onOpenConfigModal={(stock) => setConfigTargetStock(stock)}
            onBack={() => setActiveTab('watchlist')}
            onRefreshNaverData={loadNaverStockData}
            isLoadingNaver={isLoadingNaver}
          />
        )}
      </main>

      {/* 종목별 X1, X2, Y1, Y2 설정 모달 */}
      {configTargetStock && (
        <ConfigModal
          stock={configTargetStock}
          onSave={handleSaveConfig}
          onClose={() => setConfigTargetStock(null)}
        />
      )}
    </div>
  );
};

export default App;
