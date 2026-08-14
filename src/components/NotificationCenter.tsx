import React from 'react';
import { PushNotification } from '../types/stock';
import { Bell, CheckCheck, Trash2, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface NotificationCenterProps {
  notifications: PushNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification: (stockCode: string) => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
  onClose,
}) => {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-700/80 shadow-2xl p-6 flex flex-col justify-between animate-slide-left">
      <div>
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">실시간 푸시 알림 센터</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 액션 버튼 */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between text-xs mb-4 text-slate-400">
            <span>총 {notifications.length}개의 매매 타이밍 알림</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={onMarkAllAsRead}
                className="hover:text-indigo-400 flex items-center transition"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                모두 읽음
              </button>
              <button
                onClick={onClearAll}
                className="hover:text-rose-400 flex items-center transition"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                삭제
              </button>
            </div>
          </div>
        )}

        {/* 알림 목록 */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Bell className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm">수신된 매매 신호 알림이 없습니다.</p>
              <p className="text-xs text-slate-600">
                장 마감 후 배치 스케줄러 실행 시 Cross-over 매수/매도 조건이 충족되면 알림이 도착합니다.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              let badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
              if (notif.signalType === 'SELL_2') badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
              if (notif.signalType === 'SELL_1') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              if (notif.signalType === 'BUY_2') badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
              if (notif.signalType === 'BUY_1') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    onSelectNotification(notif.stockCode);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer font-sans relative ${
                    notif.isRead
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                      : 'bg-slate-800/80 border-slate-700 hover:border-indigo-500/60 shadow-lg'
                  }`}
                >
                  {!notif.isRead && (
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
                    <span className="font-bold text-slate-200">{notif.stockName} ({notif.stockCode})</span>
                    <span>{notif.timestamp}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-1">{notif.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">{notif.body}</p>
                  <div className="flex justify-end text-[11px] text-indigo-400 font-semibold items-center">
                    <span>차트 분석 바로가기</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
