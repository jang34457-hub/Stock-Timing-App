import React, { useState } from 'react';
import { CalculatedStockData, StockInfo } from '../types/stock';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Settings, AlertTriangle, RefreshCw, Activity, Target, CheckCircle2, Timer } from 'lucide-react';

interface StockChartProps {
  calculatedData: CalculatedStockData;
  onOpenConfigModal: (stock: StockInfo) => void;
  onBack: () => void;
  onRefreshNaverData?: (stockCode: string) => Promise<void>;
  isLoadingNaver?: boolean;
}

export const StockChart: React.FC<StockChartProps> = ({
  calculatedData,
  onOpenConfigModal,
  onBack,
  onRefreshNaverData,
  isLoadingNaver = false,
}) => {
  const { stock, prices, peak3Month, trough3Month, latestMa3Day, dropFromPeakPercent, riseFromTroughPercent, signalsHistory } = calculatedData;
  const { x1, x2, y1, y2 } = stock.config;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const validPrices = prices.map(p => ({
    ...p,
    closePrice: p.closePrice || 0,
    ma3Day: p.ma3Day || p.closePrice || 0,
  }));

  const handleRefreshClick = async () => {
    if (onRefreshNaverData) {
      setToastMessage('⏳ 실시간 주가 시세를 동기화 중입니다...');
      await onRefreshNaverData(stock.code);
      setToastMessage('✅ 실시간 주가 시세 동기화가 완료되었습니다!');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const matchingSignal = signalsHistory.find(s => s.date === data.date);

      return (
        <div className="bg-slate-900/95 border border-indigo-500/50 p-3.5 rounded-xl shadow-2xl font-mono text-xs max-w-xs backdrop-blur-md">
          <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1.5 mb-2 flex items-center justify-between">
            <span>📅 {data.date}</span>
            <span className="text-slate-400 font-normal">거래일 #{data.rowNum}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">일별 종가:</span>
              <span className="font-semibold text-slate-100">{data.closePrice.toLocaleString()} 원</span>
            </div>
            <div className="flex justify-between text-indigo-300 font-semibold">
              <span>3일 평균가 (기준):</span>
              <span className="font-bold">{data.ma3Day?.toLocaleString()} 원</span>
            </div>
            {matchingSignal && (
              <div className="mt-2.5 pt-2 border-t border-slate-700/80 font-sans">
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                  matchingSignal.signalType === 'SELL_2' ? 'bg-rose-500 text-white' :
                  matchingSignal.signalType === 'SELL_1' ? 'bg-amber-500 text-slate-950' :
                  matchingSignal.signalType === 'BUY_2' ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-emerald-400 text-slate-950 font-bold'
                }`}>
                  {matchingSignal.signalType === 'BUY_1' ? `🟢 Y1 1차 매수 관심 (+${y1}%)` :
                   matchingSignal.signalType === 'BUY_2' ? `🔵 Y2 2차 강력 매수 (+${y2}%)` :
                   matchingSignal.signalType === 'SELL_1' ? `🟡 X1 1차 매도 주의 (-${x1}%)` : `🔴 X2 2차 강력 매도 (-${x2}%)`}
                </span>
                <p className="text-[11px] text-slate-300 mt-1">{matchingSignal.message}</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const signal = signalsHistory.find(s => s.date === payload.date);

    if (!signal) return <circle cx={cx} cy={cy} r={0} key={`dot-${payload.date}`} />;

    let color = '#10b981';
    let labelText = `Y1(+${signal.changePercent}%)`;

    if (signal.signalType === 'BUY_1') {
      color = '#10b981';
      labelText = `Y1(+${signal.changePercent}%)`;
    } else if (signal.signalType === 'BUY_2') {
      color = '#06b6d4';
      labelText = `Y2(+${signal.changePercent}%)`;
    } else if (signal.signalType === 'SELL_1') {
      color = '#f59e0b';
      labelText = `X1(-${signal.changePercent}%)`;
    } else if (signal.signalType === 'SELL_2') {
      color = '#f43f5e';
      labelText = `X2(-${signal.changePercent}%)`;
    }

    return (
      <g key={`signal-marker-${payload.date}`}>
        <circle cx={cx} cy={cy} r={8} fill={color} stroke="#0f172a" strokeWidth={2} className="animate-ping opacity-75" />
        <circle cx={cx} cy={cy} r={7} fill={color} stroke="#ffffff" strokeWidth={2} />
        <rect x={cx - 38} y={cy - 28} width={76} height={20} rx={6} fill="#0f172a" stroke={color} strokeWidth={2} />
        <text x={cx} y={cy - 14} fill={color} textAnchor="middle" fontSize={10} fontWeight="bold" fontFamily="monospace">
          {labelText}
        </text>
      </g>
    );
  };

  const allValues = validPrices.flatMap(p => [p.closePrice, p.ma3Day]);
  const minP = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxP = allValues.length > 0 ? Math.max(...allValues) : 100;
  const padding = (maxP - minP) * 0.1 || 1000;

  return (
    <div className="page-container relative min-h-[800px]">
      {/* 1. 실시간 시세 동기화 오버레이 팝업 모달 */}
      {isLoadingNaver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-indigo-500/80 p-8 md:p-10 rounded-3xl max-w-md w-full text-center shadow-2xl space-y-6 ring-4 ring-indigo-500/20 transform scale-100">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <Timer className="w-20 h-20 text-indigo-400 animate-pulse" />
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin absolute inset-0 m-auto" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                ⏳ 실시간 시세 동기화 중...
              </h2>
              <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs md:text-sm font-mono font-bold border border-indigo-500/40">
                {stock.name} ({stock.code})
              </div>
            </div>

            <div className="text-xs md:text-sm text-slate-300 leading-relaxed bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
              최신 파이낸스 주가 데이터를 실시간으로 동기화하고 있습니다.<br />
              <strong className="text-indigo-400 font-semibold mt-1 inline-block">
                동기화가 완료되면 분석차트가 선명하게 표시됩니다.
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 2. 분석차트 화면 전체 */}
      <div className={`transition-all duration-700 ${isLoadingNaver ? 'filter blur-md opacity-25 pointer-events-none' : 'filter-none opacity-100'}`}>
        
        {/* 🌟 상단 헤더 구역: 종목 이름과 완벽히 같은 수평 높이(Row)에 버튼 우측 정렬! */}
        <div className="flex flex-row items-center justify-between gap-4 mb-8 md:mb-10 pb-4 border-b border-slate-800/60">
          {/* 왼쪽: 종목명 및 코스피/코스닥 뱃지 */}
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">{stock.name}</h1>
            <span className="text-base font-mono text-slate-400 font-medium">({stock.code})</span>
            <span className={`badge ${stock.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'} px-2.5 py-1 text-xs`}>
              {stock.market}
            </span>
          </div>

          {/* 🌟 오른쪽: 종목 이름과 동일한 높이의 우측 끝 버튼 배치 ('시세 동기화' & 'X, Y 값 설정') */}
          <div className="flex items-center space-x-3">
            {onRefreshNaverData && (
              <button
                onClick={handleRefreshClick}
                disabled={isLoadingNaver}
                className="btn btn-outline text-xs md:text-sm px-3.5 py-2 flex items-center space-x-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 shadow-sm"
                title="실시간 주가 시세 수집 및 갱신"
              >
                <RefreshCw className={`w-4 h-4 text-indigo-400 ${isLoadingNaver ? 'animate-spin' : ''}`} />
                <span>시세 동기화</span>
              </button>
            )}

            <button
              onClick={() => onOpenConfigModal(stock)}
              className="btn btn-primary text-xs md:text-sm px-3.5 py-2 flex items-center space-x-2 shadow-sm"
              title="매도(X1,X2) 및 매수(Y1,Y2) 추천 임계값 설정"
            >
              <Settings className="w-4 h-4" />
              <span>X, Y 값 설정</span>
            </button>
          </div>
        </div>

        {/* 토스트 메시지 안내 */}
        {toastMessage && (
          <div className="mb-8 p-3.5 rounded-xl bg-slate-800 border border-indigo-500/40 text-xs md:text-sm font-mono text-indigo-300 flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {!stock.isAlertEligible && (
          <div className="p-4 mb-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 shrink-0 text-amber-400" />
            <div>
              <div className="font-bold text-sm">신규 상장 종목 알림 제외 안내</div>
              <div className="text-xs text-amber-300/80">
                이 종목은 누적 거래일수가 {stock.totalTradingDays}일입니다. 최근 3개월(60거래일) 데이터가 축적될 때까지 신호 푸시 알림이 발송되지 않습니다.
              </div>
            </div>
          </div>
        )}

        {/* 📊 1. 메인 차트 그래프 패널 */}
        <div className="chart-card p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl" style={{ marginBottom: '50px' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
            <div className="text-sm font-bold text-slate-200 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-indigo-400" />
              최근 6개월 주가 추이 & 추천 마커 시각화 (총 {validPrices.length}거래일)
            </div>
          </div>

          <div style={{ width: '100%', height: '460px', minHeight: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={validPrices} margin={{ top: 30, right: 35, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorClosePrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.8} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => (val ? val.slice(5) : '')}
                  dy={8}
                  minTickGap={20}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  domain={[Math.floor(minP - padding), Math.ceil(maxP + padding)]}
                  tickFormatter={(val) => (val ? val.toLocaleString() : '')}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />

                <ReferenceLine y={peak3Month} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `최근 3개월 최고점 (${peak3Month.toLocaleString()})`, fill: '#f43f5e', fontSize: 10, position: 'top' }} />
                <ReferenceLine y={trough3Month} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `최근 3개월 최저점 (${trough3Month.toLocaleString()})`, fill: '#10b981', fontSize: 10, position: 'bottom' }} />

                <Area
                  type="monotone"
                  dataKey="closePrice"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClosePrice)"
                  name="일별 종가"
                />

                <Line
                  type="monotone"
                  dataKey="ma3Day"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={renderCustomDot}
                  activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2, fill: '#f59e0b' }}
                  name="3일 평균가"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 📊 2. 표1: 2x2 신호 범례 표 */}
        <div className="table-card" style={{ marginTop: '50px', marginBottom: '50px' }}>
          <div className="table-responsive">
            <table className="custom-table text-xs">
              <tbody>
                <tr>
                  <td className="font-bold text-amber-400 w-1/2 py-4">🟡 X1 1차 매도 주의 (-{x1}%)</td>
                  <td className="font-bold text-rose-400 w-1/2 py-4">🔴 X2 2차 강력 매도 (-{x2}%)</td>
                </tr>
                <tr>
                  <td className="font-bold text-emerald-400 w-1/2 py-4">🟢 Y1 1차 매수 관심 (+{y1}%)</td>
                  <td className="font-bold text-cyan-400 w-1/2 py-4">🔵 Y2 2차 강력 매수 (+{y2}%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 📊 3. 표2: 핵심 시세 요약 지표 표 */}
        <div className="table-card" style={{ marginTop: '50px', marginBottom: '50px' }}>
          <div className="table-responsive">
            <table className="custom-table text-xs">
              <thead>
                <tr>
                  <th>최신 3일 평균가</th>
                  <th>최근 3개월 (60일) 최저점</th>
                  <th>최근 3개월 최저점 대비 상승률 (Y1/Y2)</th>
                  <th>최근 3개월 최고점 대비 하락률 (X1/X2)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-mono">
                  <td className="font-bold text-indigo-400 text-sm md:text-base py-4">
                    {latestMa3Day.toLocaleString()} 원
                  </td>
                  <td className="font-bold text-emerald-400 text-sm md:text-base py-4">
                    {trough3Month.toLocaleString()} 원
                  </td>
                  <td className="text-sm md:text-base py-4">
                    <span className={`font-bold ${riseFromTroughPercent >= y1 ? 'text-emerald-400' : 'text-slate-200'}`}>
                      +{riseFromTroughPercent}%
                    </span>
                    <span className="text-xs font-normal text-emerald-400/80 ml-1.5 font-sans">(Y1:{y1}%, Y2:{y2}%)</span>
                  </td>
                  <td className="text-sm md:text-base py-4">
                    <span className={`font-bold ${dropFromPeakPercent >= x1 ? 'text-rose-400' : 'text-slate-200'}`}>
                      -{dropFromPeakPercent}%
                    </span>
                    <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">(X1:{x1}%, X2:{x2}%)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 📊 4. 표3: 매매 추천 신호 발생 이력 표 */}
        <div className="table-card" style={{ marginTop: '50px' }}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center">
              <Target className="w-4 h-4 mr-2 text-emerald-400" />
              매매 추천 신호 발생 이력 표
            </h3>
            <span className="text-xs text-slate-400 font-mono">총 {signalsHistory.length}건 감지</span>
          </div>

          {signalsHistory.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">
              현재 설정된 임계값 조건($X_1={x1}\%, X_2={x2}\%, Y_1={y1}\%, Y_2={y2}\%$)을 초과한 매매 신호 이력이 없습니다.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>발생 날짜</th>
                    <th style={{ width: '190px' }}>매매 추천 신호</th>
                    <th>변동 분석 메시지</th>
                    <th style={{ textAlign: 'right', width: '140px' }}>3일 평균가</th>
                  </tr>
                </thead>
                <tbody>
                  {signalsHistory.map((sig, idx) => (
                    <tr key={idx} className="table-row hover:bg-slate-800/40 transition font-mono">
                      <td className="text-slate-300 font-semibold">{sig.date}</td>
                      <td>
                        <span className={`px-2.5 py-1 rounded text-[11px] font-bold inline-block ${
                          sig.signalType === 'SELL_2' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                          sig.signalType === 'SELL_1' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          sig.signalType === 'BUY_2' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {sig.signalType === 'BUY_1' ? `🟢 Y1 1차 매수 관심 (+${y1}%)` :
                           sig.signalType === 'BUY_2' ? `🔵 Y2 2차 강력 매수 (+${y2}%)` :
                           sig.signalType === 'SELL_1' ? `🟡 X1 1차 매도 주의 (-${x1}%)` : `🔴 X2 2차 강력 매도 (-${x2}%)`}
                        </span>
                      </td>
                      <td className="text-slate-200 font-sans text-xs">{sig.message}</td>
                      <td style={{ textAlign: 'right' }} className="text-indigo-300 font-bold">
                        {sig.maPrice.toLocaleString()} 원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
