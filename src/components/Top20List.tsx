import React from 'react';
import { StockInfo } from '../types/stock';
import { Plus, Check, LineChart, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Top20ListProps {
  stocks: StockInfo[];
  watchlistCodes: string[];
  onToggleWatchlist: (stock: StockInfo) => void;
  onSelectStockChart: (stock: StockInfo) => void;
}

export const Top20List: React.FC<Top20ListProps> = ({
  stocks,
  watchlistCodes,
  onToggleWatchlist,
  onSelectStockChart,
}) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔥 오늘의 대세주 Top 20</h1>
          <p className="page-description">
            당일 거래대금 상위 20개 종목입니다. 원하는 종목을 관심종목에 추가하여 3일 이동평균 기준 2단계 매매 타이밍 푸시 알림을 받아보세요.
          </p>
        </div>
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
