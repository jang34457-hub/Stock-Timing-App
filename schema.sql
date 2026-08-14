-- ============================================================
-- 주식 매매 타이밍 알림 앱 데이터베이스 스키마 (PostgreSQL / MySQL 호환)
-- ============================================================

-- 1. 사용자 테이블 (Users)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    push_token VARCHAR(512), -- FCM / APNS 푸시 토큰
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 종목 마스터 테이블 (Stocks)
CREATE TABLE IF NOT EXISTS stocks (
    stock_code VARCHAR(10) PRIMARY KEY, -- 예: '005930'
    stock_name VARCHAR(100) NOT NULL,    -- 예: '삼성전자'
    market_type VARCHAR(20) NOT NULL,   -- 'KOSPI', 'KOSDAQ'
    trading_value BIGINT DEFAULT 0,     -- 당일 거래대금 (대세주 Top 20 산출용)
    total_trading_days INT DEFAULT 0,   -- 누적 거래일수 (60거래일 미만 신규상장주 필터링용)
    is_alert_eligible BOOLEAN DEFAULT TRUE, -- 60거래일 이상 데이터 존재 시 TRUE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스: 거래대금 순 정렬
CREATE INDEX IF NOT EXISTS idx_stocks_trading_value ON stocks (trading_value DESC);

-- 3. 사용자 관심 종목 및 설정 테이블 (User Watchlists)
CREATE TABLE IF NOT EXISTS user_watchlists (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_code VARCHAR(10) NOT NULL REFERENCES stocks(stock_code) ON DELETE CASCADE,
    target_x1 DECIMAL(5,2) DEFAULT 10.00, -- 1차 매도 하락률 (%)
    target_x2 DECIMAL(5,2) DEFAULT 20.00, -- 2차 매도 하락률 (%)
    target_y1 DECIMAL(5,2) DEFAULT 10.00, -- 1차 매수 상승률 (%)
    target_y2 DECIMAL(5,2) DEFAULT 20.00, -- 2차 매수 상승률 (%)
    push_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_stock UNIQUE (user_id, stock_code)
);

-- 4. 일별 주가 데이터 테이블 (Stock Daily Prices)
CREATE TABLE IF NOT EXISTS stock_daily_prices (
    id VARCHAR(36) PRIMARY KEY,
    stock_code VARCHAR(10) NOT NULL REFERENCES stocks(stock_code) ON DELETE CASCADE,
    price_date DATE NOT NULL,              -- 거래일자 (휴장일 제외)
    row_num INT NOT NULL,                  -- 거래일 순서 (오름차순 1, 2, 3...)
    close_price DECIMAL(12,2) NOT NULL,    -- 당일 종가
    trading_volume BIGINT DEFAULT 0,       -- 거래량
    trading_value BIGINT DEFAULT 0,        -- 거래대금
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_stock_date UNIQUE (stock_code, price_date)
);

-- 인덱스: 종목코드 & row_num 조회를 빠르게 수행
CREATE INDEX IF NOT EXISTS idx_daily_prices_stock_rownum ON stock_daily_prices (stock_code, row_num DESC);
CREATE INDEX IF NOT EXISTS idx_daily_prices_stock_date ON stock_daily_prices (stock_code, price_date DESC);

-- 5. 3거래일 이동평균 계산 뷰 (Window Function 기반 SQL 뷰)
-- 날짜가 아닌 row_num(거래일 순서) 기준 3개 거래일 종가 산술 평균 계산
CREATE OR REPLACE VIEW v_stock_3day_ma AS
SELECT 
    p.id,
    p.stock_code,
    p.price_date,
    p.row_num,
    p.close_price,
    AVG(p.close_price) OVER (
        PARTITION BY p.stock_code 
        ORDER BY p.row_num 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS ma_3day
FROM stock_daily_prices p;

-- 6. 종목별 매매 신호 상태 머신 테이블 (Stock Signal States)
-- Cross-over 1회 알림 발송용 최신 상태 보관
CREATE TABLE IF NOT EXISTS stock_signal_states (
    stock_code VARCHAR(10) PRIMARY KEY REFERENCES stocks(stock_code) ON DELETE CASCADE,
    current_state VARCHAR(20) DEFAULT 'NORMAL', -- 'NORMAL', 'BUY_1', 'BUY_2', 'SELL_1', 'SELL_2'
    last_signal_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 매매 신호 및 알림 로그 테이블 (Trade Signals History)
CREATE TABLE IF NOT EXISTS trade_signals (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    stock_code VARCHAR(10) NOT NULL REFERENCES stocks(stock_code) ON DELETE CASCADE,
    signal_type VARCHAR(20) NOT NULL, -- 'BUY_1', 'BUY_2', 'SELL_1', 'SELL_2'
    signal_date DATE NOT NULL,
    trigger_ma_price DECIMAL(12,2) NOT NULL,   -- 발생 시점 3일 평균가
    reference_peak_trough DECIMAL(12,2) NOT NULL, -- 기준이 된 3개월 최고/최저가
    x1_val DECIMAL(5,2),
    x2_val DECIMAL(5,2),
    y1_val DECIMAL(5,2),
    y2_val DECIMAL(5,2),
    is_pushed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
