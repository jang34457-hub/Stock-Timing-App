import React, { useState } from 'react';
import { StockInfo, StockConfig } from '../types/stock';
import { X, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { DEFAULT_CONFIG } from '../data/mockStocks';

interface ConfigModalProps {
  stock: StockInfo;
  onSave: (stockCode: string, newConfig: StockConfig) => void;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  stock,
  onSave,
  onClose,
}) => {
  const [config, setConfig] = useState<StockConfig>({ ...stock.config });

  const handleReset = () => {
    setConfig({ ...DEFAULT_CONFIG });
  };

  const handleSave = () => {
    // 유효성 검사 (X2 > X1, Y2 > Y1)
    if (config.x2 <= config.x1) {
      alert('2차 매도 하락률(X2)은 1차 매도 하락률(X1)보다 커야 합니다.');
      return;
    }
    if (config.y2 <= config.y1) {
      alert('2차 매수 상승률(Y2)은 1차 매수 상승률(Y1)보다 커야 합니다.');
      return;
    }

    onSave(stock.code, config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>{stock.name}</span>
              <span className="text-sm font-mono text-slate-400">({stock.code})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              종목별 매매 추천 임계값 ($X_1, X_2, Y_1, Y_2$) 개별 설정
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 설정 구역 */}
        <div className="space-y-6">
          {/* 매도 설정 구역 (X1, X2) */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-4">
            <h3 className="text-sm font-bold text-rose-300 flex items-center">
              🔴 매도 조건 (3개월 최고치 대비 하락률)
            </h3>

            {/* X1 */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">1차 매도 주의 (X1):</span>
                <span className="text-amber-400 font-bold">{config.x1}% 하락 시</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={config.x1}
                onChange={(e) => setConfig({ ...config, x1: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* X2 */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">2차 강력 매도 (X2):</span>
                <span className="text-rose-400 font-bold">{config.x2}% 하락 시</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="0.5"
                value={config.x2}
                onChange={(e) => setConfig({ ...config, x2: parseFloat(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 매수 설정 구역 (Y1, Y2) */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center">
              🟢 매수 조건 (3개월 최저치 대비 상승률)
            </h3>

            {/* Y1 */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">1차 매수 관심 (Y1):</span>
                <span className="text-emerald-400 font-bold">{config.y1}% 상승 시</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={config.y1}
                onChange={(e) => setConfig({ ...config, y1: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Y2 */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">2차 강력 매수 (Y2):</span>
                <span className="text-cyan-400 font-bold">{config.y2}% 상승 시</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="0.5"
                value={config.y2}
                onChange={(e) => setConfig({ ...config, y2: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 안내 텍스트 */}
        <div className="flex items-start space-x-2 text-xs text-slate-400 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            설정한 $X_1, X_2, Y_1, Y_2$ 값은 서버 DB에 동기화되며, 3거래일 이동평균선과 비교하여 조건 전환 당일 실시간 푸시 알림이 발송됩니다.
          </span>
        </div>

        {/* 모달 푸터 버튼 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="btn btn-outline text-xs flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            기본값 리셋 (10/20/10/20)
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={onClose} className="btn btn-secondary">
              취소
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              <Save className="w-4 h-4 mr-1.5" />
              설정 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
