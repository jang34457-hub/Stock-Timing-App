import React from 'react';
import { StockInfo } from '../types/stock';
import { LineChart, Plus, Check, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Top20ListProps {
  stocks: StockInfo[];
  watchlistCodes: string[];
  onToggleWatchlist: (stock: StockInfo) => void;
  onSelectStockChart: (stock: StockInfo) => void;
  isLoadingTop20: boolean;
  onRefreshTop20: () => void;
  lastSyncTime: string | null;
  syncProgress: { current: number; total: number };
}

/**
 * 🌟 대한민국 20대 대세주 대시보드 컴포넌트
 */
export const Top20List: React.FC<Top20ListProps> = ({
  stocks,
  watchlistCodes,
  onToggleWatchlist,
  onSelectStockChart,
  isLoadingTop20,
  onRefreshTop20,
  lastSyncTime,
  syncProgress,
}) => {
  return (
    <div className="page-container">
      {/* 헤더 및 동기화 버튼 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <span>🔥</span> 대한민국 대세주 TOP 20
          </h2>
          <p className="page-description">
            코스피/코스닥 시가총액 및 거래대금 최상위 20개 종목의 3일 이동평균선 기반 타이밍 모니터링
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {lastSyncTime && (
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              동기화: {lastSyncTime}
            </span>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={onRefreshTop20}
            disabled={isLoadingTop20}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingTop20 ? 'animate-spin' : ''}`} />
            {isLoadingTop20
              ? `시세수집 중 (${syncProgress.current}/${syncProgress.total})...`
              : '시세 동기화'}
          </button>
        </div>
      </div>

      {/* 동기화 진행 상태 바 */}
      {isLoadingTop20 && (
        <div className="mb-4 bg-slate-900 border border-indigo-500/30 rounded-xl p-3">
          <div className="flex justify-between text-xs text-indigo-300 font-semibold mb-1">
            <span>네이버 파이낸스 실시간 시세 수집 중...</span>
            <span>{Math.round((syncProgress.current / syncProgress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 📊 대세주 메인 대시보드 표 */}
      <div className="table-card border border-slate-800 rounded-3xl shadow-2xl overflow-hidden bg-slate-900/80 backdrop-blur-md">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>순위</th>
                <th>종목명 / 종목코드</th>
                <th>현재가</th>
                <th>전일대비</th>
                <th>당일 거래대금</th>
                <th style={{ textAlign: 'right' }}>관리 / 분석</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => {
                const isAdded = watchlistCodes.includes(stock.code);
                const isNewStock = stock.totalTradingDays < 60;

                return (
                  <tr key={stock.code} className="table-row hover:bg-slate-800/40 transition">
                    <td className="rank-cell">{index + 1}</td>
                    <td>
                      <div className="font-semibold text-slate-100 flex items-center space-x-2">
                        <span>{stock.name}</span>
                        {isNewStock && (
                          <span className="badge badge-warning text-xs" title="최근 60거래일 미만 신규 상장주 - 알림 비활성화">
                            <AlertTriangle className="w-3 h-3 mr-1 inline" />
                            신규상장 (알림제외)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{stock.code}</div>
                    </td>
                    <td className="font-semibold font-mono text-slate-200">
                      {stock.currentPrice.toLocaleString()} 원
                    </td>
                    <td>
                      <span className={`flex items-center text-xs font-semibold font-mono ${stock.changeRate >= 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                        {stock.changeRate >= 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                        )}
                        {stock.changeRate >= 0 ? `+${stock.changeRate}%` : `${stock.changeRate}%`}
                      </span>
                    </td>
                    <td className="font-mono text-sm text-slate-300">
                      {(stock.tradingValue / 100000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} 억원
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className={`btn btn-sm ${isAdded ? 'btn-success' : 'btn-outline'}`}
                          onClick={() => onToggleWatchlist(stock)}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" />
                              관심종목
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              관심 추가
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onSelectStockChart(stock)}
                        >
                          <LineChart className="w-3.5 h-3.5 mr-1" />
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
    </div>
  );
};
