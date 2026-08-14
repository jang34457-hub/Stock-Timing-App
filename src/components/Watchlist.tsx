import React from 'react';
import { CalculatedStockData, StockInfo } from '../types/stock';
import { LineChart, Settings, Trash2, AlertCircle } from 'lucide-react';

interface WatchlistProps {
  watchlistCalculated: CalculatedStockData[];
  onRemoveWatchlist: (code: string) => void;
  onSelectStockChart: (stock: StockInfo) => void;
  onOpenConfigModal: (stock: StockInfo) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  watchlistCalculated,
  onRemoveWatchlist,
  onSelectStockChart,
  onOpenConfigModal,
}) => {
  if (watchlistCalculated.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[400px]">
        <div className="empty-state-card text-center p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 max-w-md">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-200 mb-2">등록된 관심종목이 없습니다</h2>
          <p className="text-sm text-slate-400 mb-6">
            '대세주 Top 20' 메뉴에서 원하는 종목을 관심종목에 추가하여 3일 이동평균 기반 매매 타이밍 추천을 받아보세요.
          </p>
        </div>
      </div>
    );
  }

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
      {/* 헤더 구역 (요청에 따라 서브 설명글 삭제 완료) */}
      <div className="page-header flex justify-between items-end mb-6">
        <div>
          <h1 className="page-title">⭐ 마이 관심종목 대시보드</h1>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          총 {watchlistCalculated.length}개 종목 모니터링 중
        </div>
      </div>

      {/* 📊 간결한 표 */}
      <div className="table-card">
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
                  <tr key={stock.code} className="table-row hover:bg-slate-800/40 transition">
                    <td>
                      <div className="font-semibold text-slate-100 flex items-center space-x-2">
                        <span>{stock.name}</span>
                        <span className={`badge ${stock.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}`}>
                          {stock.market}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{stock.code}</div>
                    </td>
                    <td>
                      {renderSignalBadge(currentState, stock.isAlertEligible)}
                    </td>
                    <td className="font-semibold font-mono text-indigo-400">
                      {latestMa3Day.toLocaleString()} 원
                    </td>
                    <td className="font-mono text-xs">
                      {stock.isAlertEligible ? (
                        <span className={`font-bold ${riseFromTroughPercent >= stock.config.y1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                          +{riseFromTroughPercent}%
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="font-mono text-xs">
                      {stock.isAlertEligible ? (
                        <span className={`font-bold ${dropFromPeakPercent >= stock.config.x1 ? 'text-rose-400' : 'text-slate-300'}`}>
                          -{dropFromPeakPercent}%
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition"
                          onClick={() => onOpenConfigModal(stock)}
                          title="X1,X2,Y1,Y2 설정"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition"
                          onClick={() => onRemoveWatchlist(stock.code)}
                          title="관심종목 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-sm btn-primary ml-1"
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
