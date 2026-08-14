import React, { useState, useEffect, useMemo } from 'react';
import { StockInfo, StockConfig, DailyPriceData, CalculatedStockData } from './types/stock';
import { TOP_20_STOCKS, generateMockDailyPrices } from './data/mockStocks';
import { calculateStockSignals } from './utils/signalEngine';
import { fetchNaverDailyPrices } from './services/naverFinanceService';
import { Navbar } from './components/Navbar';
import { Top20List } from './components/Top20List';
import { Watchlist } from './components/Watchlist';
import { StockChart } from './components/StockChart';
import { ConfigModal } from './components/ConfigModal';

export const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockInfo[]>(TOP_20_STOCKS);
  const [activeTab, setActiveTab] = useState<'top20' | 'watchlist' | 'chart'>('top20');
  const [watchlistCodes, setWatchlistCodes] = useState<string[]>(['005930', '000660', '373220', '900010']);
  const [selectedStockCode, setSelectedStockCode] = useState<string>('005930');
  
  const [configTargetStock, setConfigTargetStock] = useState<StockInfo | null>(null);
  const [isLoadingNaver, setIsLoadingNaver] = useState<boolean>(false);

  const [dailyPricesMap, setDailyPricesMap] = useState<Record<string, DailyPriceData[]>>(() => {
    const initialMap: Record<string, DailyPriceData[]> = {};
    TOP_20_STOCKS.forEach(stock => {
      initialMap[stock.code] = generateMockDailyPrices(stock.code, stock.totalTradingDays, stock.currentPrice);
    });
    return initialMap;
  });

  const loadNaverStockData = async (stockCode: string) => {
    setIsLoadingNaver(true);
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const fetchPromise = fetchNaverDailyPrices(stockCode, 130);
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

  const watchlistCalculated = useMemo(() => {
    return watchlistCodes
      .map(code => {
        const stock = stocks.find(s => s.code === code);
        const prices = dailyPricesMap[code];
        if (!stock || !prices) return null;
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
          />
        )}

        {activeTab === 'watchlist' && (
          <Watchlist
            watchlistCalculated={watchlistCalculated}
            onRemoveWatchlist={handleRemoveWatchlist}
            onSelectStockChart={handleSelectStockChart}
            onOpenConfigModal={(stock) => setConfigTargetStock(stock)}
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
