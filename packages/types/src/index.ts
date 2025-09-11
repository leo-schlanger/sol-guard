import { PublicKey } from '@solana/web3.js'

// Risk Score Types
export interface RiskScore {
  score: number // 0-100
  level: RiskLevel
  breakdown: RiskBreakdown
  timestamp: Date
  tokenAddress: string
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface RiskBreakdown {
  staticAnalysis: number // 0-100
  dynamicAnalysis: number // 0-100
  onChainAnalysis: number // 0-100
  details: {
    staticAnalysis: StaticAnalysisDetails
    dynamicAnalysis: DynamicAnalysisDetails
    onChainAnalysis: OnChainAnalysisDetails
  }
}

export interface StaticAnalysisDetails {
  vulnerabilities: Vulnerability[]
  codeQuality: number
  securityPatterns: SecurityPattern[]
}

export interface DynamicAnalysisDetails {
  runtimeBehavior: RuntimeBehavior[]
  gasUsage: GasAnalysis
  executionPaths: ExecutionPath[]
}

export interface OnChainAnalysisDetails {
  liquidity: LiquidityAnalysis
  holderDistribution: HolderDistribution
  transactionHistory: TransactionAnalysis
  contractInteractions: ContractInteraction[]
}

// Vulnerability Types
export interface Vulnerability {
  id: string
  type: VulnerabilityType
  severity: Severity
  description: string
  location: CodeLocation
  recommendation: string
  cwe?: string
}

export type VulnerabilityType = 
  | 'reentrancy'
  | 'integer-overflow'
  | 'access-control'
  | 'unchecked-call'
  | 'denial-of-service'
  | 'front-running'
  | 'timestamp-dependence'
  | 'randomness'
  | 'other'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface CodeLocation {
  file: string
  line: number
  column?: number
  function?: string
}

// Security Pattern Types
export interface SecurityPattern {
  name: string
  description: string
  implemented: boolean
  confidence: number
}

// Runtime Analysis Types
export interface RuntimeBehavior {
  pattern: string
  frequency: number
  risk: RiskLevel
}

export interface GasAnalysis {
  average: number
  max: number
  min: number
  distribution: GasDistribution[]
}

export interface GasDistribution {
  range: string
  count: number
  percentage: number
}

export interface ExecutionPath {
  path: string[]
  frequency: number
  risk: RiskLevel
}

// On-Chain Analysis Types
export interface LiquidityAnalysis {
  totalLiquidity: number
  liquidityPools: LiquidityPool[]
  liquidityRisk: RiskLevel
}

export interface LiquidityPool {
  address: string
  exchange: string
  liquidity: number
  volume24h: number
  risk: RiskLevel
}

export interface HolderDistribution {
  totalHolders: number
  topHolders: Holder[]
  distributionRisk: RiskLevel
  concentration: number // percentage held by top 10 holders
}

export interface Holder {
  address: string
  balance: number
  percentage: number
  isContract: boolean
}

export interface TransactionAnalysis {
  totalTransactions: number
  volume24h: number
  averageTransactionSize: number
  suspiciousTransactions: SuspiciousTransaction[]
  risk: RiskLevel
}

export interface SuspiciousTransaction {
  signature: string
  type: string
  amount: number
  risk: RiskLevel
  description: string
}

export interface ContractInteraction {
  contract: string
  type: string
  frequency: number
  risk: RiskLevel
}

// API Types
export interface TokenAnalysisRequest {
  address: string
  includeHistory?: boolean
  includeDetailedReport?: boolean
}

export interface TokenAnalysisResponse {
  success: boolean
  data?: RiskScore
  error?: string
  processingTime: number
}

export interface AuditRequest {
  repositoryUrl: string
  branch?: string
  includeTests?: boolean
  customRules?: string[]
}

export interface AuditResponse {
  success: boolean
  auditId: string
  status: AuditStatus
  data?: AuditReport
  error?: string
}

export type AuditStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface AuditReport {
  id: string
  repositoryUrl: string
  branch: string
  timestamp: Date
  vulnerabilities: Vulnerability[]
  summary: AuditSummary
  recommendations: Recommendation[]
  certification?: Certification
}

export interface AuditSummary {
  totalVulnerabilities: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  overallRisk: RiskLevel
  codeQuality: number
}

export interface Recommendation {
  priority: Severity
  category: string
  description: string
  implementation: string
  estimatedEffort: string
}

export interface Certification {
  id: string
  tokenAddress: string
  issuedAt: Date
  validUntil?: Date
  metadata: CertificationMetadata
  nftAddress?: string
}

export interface CertificationMetadata {
  version: string
  standards: string[]
  compliance: string[]
  auditor: string
  reportUrl: string
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  subscription: Subscription
  createdAt: Date
  lastLoginAt?: Date
}

export interface Subscription {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: Date
  endDate?: Date
  features: string[]
}

export type SubscriptionPlan = 'free' | 'auditor' | 'developer' | 'sentinel'

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired'

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
}

export type NotificationType = 
  | 'vulnerability-detected'
  | 'audit-completed'
  | 'certification-issued'
  | 'subscription-expired'
  | 'system-alert'

// Utility Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Solana Specific Types
export interface SolanaTokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  supply: number
  mintAuthority?: string
  freezeAuthority?: string
  metadata?: TokenMetadata
}

export interface TokenMetadata {
  name: string
  symbol: string
  description: string
  image: string
  attributes?: TokenAttribute[]
}

export interface TokenAttribute {
  trait_type: string
  value: string | number
}

// Export all types
export * from './wallet'
export * from './api'
