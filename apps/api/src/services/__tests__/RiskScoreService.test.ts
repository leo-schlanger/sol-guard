import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RiskScoreService } from '../RiskScoreService';
import { DatabaseService } from '../DatabaseService';
import { SolanaService } from '../SolanaService';
import { RiskLevel, RiskScore, RiskBreakdown, StaticAnalysisDetails as StaticAnalysis, DynamicAnalysisDetails as DynamicAnalysis, OnChainAnalysisDetails as OnChainAnalysis } from '@sol-guard/types';

// Mock dependencies
vi.mock('../DatabaseService');
vi.mock('../SolanaService');

describe('RiskScoreService', () => {
  let riskScoreService: RiskScoreService;
  let mockDatabase: DatabaseService;
  let mockSolana: SolanaService;

  const mockStaticAnalysis: StaticAnalysis = {
    vulnerabilities: [],
    codeQuality: 90,
    securityPatterns: []
  };

  const mockDynamicAnalysis: DynamicAnalysis = {
    runtimeBehavior: [],
    gasUsage: {
      average: 1000,
      max: 2000,
      min: 500,
      distribution: []
    },
    executionPaths: []
  };

  const mockOnChainAnalysis: OnChainAnalysis = {
    liquidity: {
      totalLiquidity: 1000000,
      liquidityPools: [],
      liquidityRisk: 'low'
    },
    holderDistribution: {
      totalHolders: 1000,
      topHolders: [],
      distributionRisk: 'low',
      concentration: 30
    },
    transactionHistory: {
      totalTransactions: 10000,
      volume24h: 1000000,
      averageTransactionSize: 100,
      suspiciousTransactions: [],
      risk: 'low'
    },
    contractInteractions: []
  };

  beforeEach(() => {
    mockDatabase = {
      storeRiskScore: vi.fn(),
      getRiskScoreHistory: vi.fn()
    } as any;

    mockSolana = {
      getTokenInfo: vi.fn(),
      getTokenLiquidity: vi.fn(),
      getTokenHolders: vi.fn(),
      getTokenProgram: vi.fn(),
      getMarketBehavior: vi.fn(),
      getTokenTransactions: vi.fn()
    } as any;

    riskScoreService = new RiskScoreService(mockDatabase, mockSolana);

    vi.spyOn(riskScoreService as any, 'performStaticAnalysis')
      .mockResolvedValue(mockStaticAnalysis);
    vi.spyOn(riskScoreService as any, 'performDynamicAnalysis')
      .mockResolvedValue(mockDynamicAnalysis);
    vi.spyOn(riskScoreService as any, 'performOnChainAnalysis')
      .mockResolvedValue(mockOnChainAnalysis);
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score correctly', async () => {
      const result = await riskScoreService.calculateRiskScore('mock-token-address');

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('tokenAddress');

      // Expected score = (85 * 0.3) + (75 * 0.3) + (90 * 0.4) = 84
      expect(result.score).toBeCloseTo(84, 1);
      expect(result.level).toBe('low');
    });

    it('should use cache for repeated requests', async () => {
      const result1 = await riskScoreService.calculateRiskScore('mock-token-address');
      
      expect(riskScoreService['performStaticAnalysis']).toHaveBeenCalledTimes(1);
      expect(riskScoreService['performDynamicAnalysis']).toHaveBeenCalledTimes(1);
      expect(riskScoreService['performOnChainAnalysis']).toHaveBeenCalledTimes(1);

      const result2 = await riskScoreService.calculateRiskScore('mock-token-address');
      
      expect(riskScoreService['performStaticAnalysis']).toHaveBeenCalledTimes(1);
      expect(riskScoreService['performDynamicAnalysis']).toHaveBeenCalledTimes(1);
      expect(riskScoreService['performOnChainAnalysis']).toHaveBeenCalledTimes(1);

      expect(result2).toEqual(result1);
    });

    it('should handle static analysis errors gracefully', async () => {
      vi.spyOn(riskScoreService as any, 'performStaticAnalysis')
        .mockRejectedValue(new Error('Static analysis failed'));

      await expect(
        riskScoreService.calculateRiskScore('mock-token-address')
      ).rejects.toThrow('Failed to calculate risk score: Static analysis failed');
    });

    it('should store history when includeHistory option is true', async () => {
      await riskScoreService.calculateRiskScore('mock-token-address', { includeHistory: true });
      expect(mockDatabase.storeRiskScore).toHaveBeenCalled();
    });
  });

  describe('getRiskScoreHistory', () => {
    it('should return risk score history', async () => {
      const mockHistory = [
        {
          tokenAddress: 'mock-token-address',
          score: 85,
          timestamp: new Date().toISOString(),
          breakdown: {
            staticAnalysis: 85,
            dynamicAnalysis: 75,
            onChainAnalysis: 90,
            details: {
              staticAnalysis: mockStaticAnalysis,
              dynamicAnalysis: mockDynamicAnalysis,
              onChainAnalysis: mockOnChainAnalysis
            }
          },
          level: 'low' as RiskLevel
        }
      ];

      vi.spyOn(mockDatabase, 'getRiskScoreHistory').mockImplementation(async () => mockHistory);

      const history = await riskScoreService.getRiskScoreHistory('mock-token-address');
      expect(history).toEqual(mockHistory);
    });

    it('should handle database errors', async () => {
      vi.spyOn(mockDatabase, 'getRiskScoreHistory').mockImplementation(async () => {
        throw new Error('Database error');
      });

      await expect(
        riskScoreService.getRiskScoreHistory('mock-token-address')
      ).rejects.toThrow('Failed to get risk score history: Database error');
    });
  });

  describe('getRiskLevel', () => {
    const testCases = [
      { score: 90, expected: 'low' },
      { score: 70, expected: 'medium' },
      { score: 50, expected: 'high' },
      { score: 20, expected: 'critical' },
    ];

    testCases.forEach(({ score, expected }) => {
      it(`should return ${expected} for score ${score}`, () => {
        expect(riskScoreService['getRiskLevel'](score)).toBe(expected);
      });
    });
  });
});
