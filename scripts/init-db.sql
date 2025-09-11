-- Initialize SolGuard Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Create risk_scores table
CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_address VARCHAR(44) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    level VARCHAR(20) NOT NULL,
    breakdown JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create audits table
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    repository_url TEXT NOT NULL,
    branch VARCHAR(255) DEFAULT 'main',
    status VARCHAR(50) DEFAULT 'pending',
    vulnerabilities JSONB DEFAULT '[]',
    summary JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_risk_scores_token_address ON risk_scores(token_address);
CREATE INDEX IF NOT EXISTS idx_risk_scores_created_at ON risk_scores(created_at);
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Insert sample data for development
INSERT INTO users (email, password_hash, name, subscription_plan) VALUES
('admin@solguard.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2O', 'Admin User', 'sentinel'),
('demo@solguard.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2O', 'Demo User', 'developer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample risk scores
INSERT INTO risk_scores (token_address, score, level, breakdown) VALUES
('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 95, 'low', '{"staticAnalysis": 98, "dynamicAnalysis": 92, "onChainAnalysis": 95}'),
('So11111111111111111111111111111111111111112', 98, 'low', '{"staticAnalysis": 99, "dynamicAnalysis": 97, "onChainAnalysis": 98}'),
('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 72, 'medium', '{"staticAnalysis": 75, "dynamicAnalysis": 70, "onChainAnalysis": 71}')
ON CONFLICT DO NOTHING;
