import React from 'react';
import { TrendingUp } from 'lucide-react';

interface NavbarProps {
  activeTab: 'top20' | 'watchlist' | 'chart';
  setActiveTab: (tab: 'top20' | 'watchlist' | 'chart') => void;
  watchlistCount: number;
  selectedStockName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  watchlistCount,
  selectedStockName,
}) => {
  return (
    <header className="navbar-container">
      {/* 🌟 좌측: 앱 로고 */}
      <div className="navbar-logo" onClick={() => setActiveTab('top20')}>
        <div className="logo-icon">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <span className="logo-title">주식 매매 타이밍 추천</span>
          <span className="logo-subtitle">3일 이동평균 & 2단계 추천 시스템</span>
        </div>
      </div>

      {/* 🌟 우측 (오른쪽 상단 끝 정렬): 3개 메뉴 탭 버튼 */}
      <div className="flex items-center space-x-3 ml-auto">
        <nav className="navbar-tabs flex">
          <button
            className={`tab-btn ${activeTab === 'top20' ? 'active' : ''}`}
            onClick={() => setActiveTab('top20')}
          >
            🔥 대세주 Top 20
          </button>
          <button
            className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
          >
            ⭐ 마이 관심종목
            <span className="count-badge">{watchlistCount}</span>
          </button>
          {selectedStockName && (
            <button
              className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              📈 차트 분석 ({selectedStockName})
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
