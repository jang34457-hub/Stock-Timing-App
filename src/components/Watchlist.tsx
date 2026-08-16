import React, { useState, useRef, useEffect } from 'react';
import { CalculatedStockData, StockInfo } from '../types/stock';
import { searchKrxStocks } from '../data/allKrxStocks';
import { LineChart, Settings, Trash2, AlertCircle, Search, Check, X } from 'lucide-react';

interface WatchlistProps {
  watchlistCalculated: CalculatedStockData[];
  onRemoveWatchlist: (code: string) => void;
  onSelectStockChart: (stock: StockInfo) => void;
  onOpenConfigModal: (stock: StockInfo) => void;
  onAddStock?: (stock: StockInfo) => void;
}

/**
 * 🌟 마이 관심종목 대시보드 컴포넌트 (데스크톱 & 모바일 완벽 대응)
 */
export const Watchlist: React.FC<WatchlistProps> = ({
  watchlistCalculated,
  onRemoveWatchlist,
  onSelectStockChart,
  onOpenConfigModal,
  onAddStock,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 실시간 유사 종목 검색 결과
  const searchResults = searchKrxStocks(searchQuery, 12);
  const existingCodes = watchlistCalculated.map(item => item.stock.code);

  // 외부 클릭 시 드롭다운 자동 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStockFromSearch = (stock: StockInfo) => {
    if (onAddStock && !existingCodes.includes(stock.code)) {
      onAddStock(stock);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const renderSignalBadge = (state: string, isEligible: boolean) => {
    if (!isEligible) {
      return (
        <span className="signal-badge bg-slate-800 text-slate-400 border border-slate-700 text-xs">
          ⚠️ 신규상장 (알림 제외)
        </span>
      );
    }

    switch (state) {
      case 'SELL_2':
        return (
          <span className="signal-badge bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse text-xs">
            🚨 2차 강력 매도
          </span>
        );
      case 'SELL_1':
        return (
          <span className="signal-badge bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs">
            🟡 1차 매도 주의
          </span>
        );
      case 'BUY_2':
        return (
          <span className="signal-badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse text-xs">
            🔵 2차 강력 매수
          </span>
        );
      case 'BUY_1':
        return (
          <span className="signal-badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs">
            🟢 1차 매수 관심
          </span>
        );
      default:
        return (
          <span className="signal-badge bg-slate-800 text-slate-300 border border-slate-700 text-xs">
            ⚪ 정상 관망
          </span>
        );
    }
  };

  return (
    <div className="page-container">
      {/* 🚀 52px 컴팩트 중앙 서치바 바디 */}
      <div className="giant-search-wrapper">
        <div className="w-full flex items-center justify-start mb-2 px-1">
          <span className="text-base font-bold text-slate-200">
            관심종목 검색
          </span>
        </div>

        <div ref={searchContainerRef} className="relative w-full z-30">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-4 w-5 h-5 text-blue-400 z-10 pointer-events-none" />
            
            <input
              type="text"
              placeholder="종목명 또는 종목코드"
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              className="giant-search-input"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 실시간 종목명 / 종목코드 드롭다운 */}
          {isDropdownOpen && searchQuery.trim() !== '' && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2.5 bg-slate-950 border-2 border-blue-500/70 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden max-h-[440px] overflow-y-auto z-50 backdrop-blur-3xl">
              <div className="p-2 flex flex-col divide-y divide-slate-800/80">
                {searchResults.map((stock) => {
                  const isAlreadyAdded = existingCodes.includes(stock.code);
                  return (
                    <div
                      key={stock.code}
                      onClick={() => handleSelectStockFromSearch(stock)}
                      className={`w-full px-5 py-3.5 flex items-center justify-between transition-all duration-200 cursor-pointer select-none rounded-xl ${
                        isAlreadyAdded
                          ? 'bg-slate-950/60 opacity-40 cursor-not-allowed border border-transparent'
                          : 'hover:bg-gradient-to-r hover:from-blue-600/30 hover:via-indigo-600/25 hover:to-blue-600/15 border border-transparent hover:border-blue-500/40 hover:scale-[1.015] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 text-slate-100 hover:text-white active:scale-100 group'
                      }`}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-extrabold text-xl text-slate-100 group-hover:text-blue-200 transition-colors">
                          {stock.name}
                        </span>
                        <span className="text-sm text-slate-400 group-hover:text-blue-300/80 font-mono transition-colors">
                          / {stock.code}
                        </span>
                      </div>

                      {isAlreadyAdded && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5" /> 추가됨
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 관심종목 대시보드 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-extrabold text-slate-200 flex items-center gap-2">
          <span>📊</span> 나의 등록 관심종목 현황 리스트
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          총 <strong className="text-blue-400 text-sm">{watchlistCalculated.length}</strong>개 종목 모니터링 중
        </span>
      </div>

      {/* 관심종목이 하나도 없을 때의 안내 카드 */}
      {watchlistCalculated.length === 0 ? (
        <div className="empty-state-card text-center p-12 rounded-3xl bg-slate-900/60 border border-slate-800 max-w-lg mx-auto shadow-2xl">
          <AlertCircle className="w-14 h-14 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-200 mb-2">등록된 관심종목이 없습니다</h2>
          <p className="text-sm text-slate-400 mb-4">
            상단 검색창에 종목이름(예: 현대, 삼성, 대한, 카카오, 003490 등)을 입력하고 글자를 터치하여 관심종목을 추가해 보세요.
          </p>
        </div>
      ) : (
        /* 📊 깨짐 없는 관심종목 메인 대시보드 표 */
        <div className="table-card border border-slate-800 rounded-3xl shadow-2xl overflow-hidden bg-slate-900/80 backdrop-blur-md">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>종목명 / 종목코드</th>
                  <th>매매 추천 상태</th>
                  <th>3거래일 평균가</th>
                  <th>3개월 최저 대비 상승</th>
                  <th>3개월 최고 대비 하락</th>
                  <th style={{ textAlign: 'right' }}>관리 / 차트 분석</th>
                </tr>
              </thead>
              <tbody>
                {watchlistCalculated.map(({ stock, latestMa3Day, dropFromPeakPercent, riseFromTroughPercent, currentState }) => {
                  return (
                    <tr key={stock.code} className="table-row hover:bg-slate-800/50 transition">
                      <td>
                        <div className="font-semibold text-slate-100 flex items-center space-x-2">
                          <span className="text-base font-bold text-slate-100">{stock.name}</span>
                          <span className={`badge ${stock.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}`}>
                            {stock.market}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{stock.code}</div>
                      </td>
                      <td>
                        {renderSignalBadge(currentState, stock.isAlertEligible)}
                      </td>
                      <td className="font-bold font-mono text-indigo-400 text-base">
                        {latestMa3Day.toLocaleString()} 원
                      </td>
                      <td className="font-mono text-sm">
                        {stock.isAlertEligible ? (
                          <span className={`font-extrabold ${riseFromTroughPercent >= stock.config.y1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            +{riseFromTroughPercent}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="font-mono text-sm">
                        {stock.isAlertEligible ? (
                          <span className={`font-extrabold ${dropFromPeakPercent >= stock.config.x1 ? 'text-rose-400' : 'text-slate-300'}`}>
                            -{dropFromPeakPercent}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700"
                            onClick={() => onOpenConfigModal(stock)}
                            title="X1,X2,Y1,Y2 설정"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700"
                            onClick={() => onRemoveWatchlist(stock.code)}
                            title="관심종목 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            className="btn btn-sm btn-primary ml-1"
                            onClick={() => onSelectStockChart(stock)}
                          >
                            <LineChart className="w-4 h-4 mr-1.5" />
                            차트 분석
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
