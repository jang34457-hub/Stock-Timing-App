import React from 'react';
import { StockInfo } from '../types/stock';
import { Plus, Check, LineChart, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from 'lucide-react';

interface Top20ListProps {
  /** 대세주 종목 리스트 */
  stocks: StockInfo[];
  /** 현재 관심종목 코드 배열 */
  watchlistCodes: string[];
  /** 관심종목 토글 핸들러 */
  onToggleWatchlist: (stock: StockInfo) => void;
  /** 차트 분석 보기 핸들러 */
  onSelectStockChart: (stock: StockInfo) => void;
  /** Top 20 시세 동기화 진행 중 여부 */
  isLoadingTop20?: boolean;
  /** 수동 시세 새로고침 동기화 핸들러 */
  onRefreshTop20?: () => void;
  /** 마지막 동기화 일시 문자열 */
  lastSyncTime?: string | null;
  /** 🌟 수집 진행 단계 표시 (예: { current: 14, total: 20 }) */
  syncProgress?: { current: number; total: number } | null;
}

/**
 * 🌟 대한민국 대세주 Top 20 리스트 컴포넌트
 */
export const Top20List: React.FC<Top20ListProps> = ({
  stocks,
  watchlistCodes,
  onToggleWatchlist,
  onSelectStockChart,
  isLoadingTop20 = false,
  onRefreshTop20,
  lastSyncTime,
  syncProgress,
}) => {
  return (
    <div className="page-container">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center space-x-2 flex-wrap gap-2">
            <span>🔥 오늘의 대세주 Top 20</span>

            {/* 수집 진행 상황 시각화 */}
            {syncProgress ? (
              <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-500/50 px-3 py-1 rounded-full flex items-center space-x-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>네이버 6개월 시세 수집 중 ({syncProgress.current} / {syncProgress.total})</span>
              </span>
            ) : lastSyncTime ? (
              <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                실시간 동기화 완료 ({lastSyncTime})
              </span>
            ) : null}
          </h1>
          <p className="page-description">
            앱 구동 날짜 기준 당일 거래대금 상위 20개 종목입니다. 원하는 종목을 관심종목에 추가하여 3일 이동평균 기준 2단계 매매 타이밍 푸시 알림을 받아보세요.
          </p>
        </div>

        {onRefreshTop20 && (
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={onRefreshTop20}
              disabled={isLoadingTop20}
              className={`btn btn-sm ${isLoadingTop20 ? 'btn-outline opacity-70 cursor-not-allowed' : 'btn-primary'} flex items-center space-x-1.5`}
              title="네이버 금융에서 구동일 기준 실시간 시세를 최신화합니다."
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTop20 ? 'animate-spin' : ''}`} />
              <span>{isLoadingTop20 ? '실시간 동기화 중...' : '시세 최신화'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="table-card">
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
