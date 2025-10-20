import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RiskScoreService, RiskLevel } from './RiskScoreService';
import { DatabaseService } from './DatabaseService';
import { SolanaService } from './SolanaService';

// Mock dependencies
describe('RiskScoreService', () => {
  let riskScoreService: RiskScoreService;
  let mockDatabaseService: any;
  let mockSolanaService: any;

  const tokenAddress = 'token123';

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create mock instances
    mockDatabaseService = {
      getRiskScoreHistory: vi.fn(),
      storeRiskScore: vi.fn(),
    } as any;

    mockSolanaService = {
      getTokenProgram: vi.fn(),
      getMarketBehavior: vi.fn(),
      getTokenInfo: vi.fn(),
      getTokenLiquidity: vi.fn(),
      getTokenHolders: vi.fn(),
      getTokenTransactions: vi.fn(),
    } as any;

    // Create service instance with mocks
    riskScoreService = new RiskScoreService(mockDatabaseService, mockSolanaService);
  });

  describe('calculateRiskScore', () => {
    it('should return cached result if valid', async () => {
      const mockScore = {
        score: 85,
        level: 'low' as RiskLevel,
        breakdown: {
          staticAnalysis: 90,
          dynamicAnalysis: 80,
          onChainAnalysis: 85,
          details: {
            staticAnalysis: { score: 90, vulnerabilities: [], codeQuality: 90, securityPatterns: [], timestamp: new Date().toISOString() },
            dynamicAnalysis: { score: 80, runtimeBehavior: [], gasUsage: { average: 100, max: 200, min: 50, distribution: [] }, executionPaths: [], timestamp: new Date().toISOString() },
            onChainAnalysis: { score: 85, liquidity: {}, holderDistribution: {}, transactionHistory: {}, contractInteractions: [], timestamp: new Date().toISOString() }
          }
        },
        timestamp: new Date().toISOString(),
        tokenAddress
      };

      // @ts-ignore - accessing private property for testing
      riskScoreService.cache.set(tokenAddress, {
        value: mockScore,
        timestamp: Date.now()
      });

      const result = await riskScoreService.calculateRiskScore(tokenAddress);
      expect(result).toEqual(mockScore);
      expect(mockSolanaService.getTokenProgram).not.toHaveBeenCalled();
    });

    it('should calculate new risk score when cache is empty', async () => {
      const mockProgramInfo = {
        isVerified: true,
        hasAudit: true,
        hasLockedUpgradeAuthority: true
      };

      const mockMarketBehavior = {
        priceVolatility: 0.2,
        abnormalTradingScore: 0.1,
        failedTransactions: 0.05,
        averageGas: 100,
        maxGas: 200,
        minGas: 50
      };

      const mockTokenInfo = {
        supply: 2000000000,
        name: 'Test Token'
      };

      const mockLiquidity = {
        totalLiquidity: 2000000,
        liquidityPools: []
      };

      mockSolanaService.getTokenProgram.mockResolvedValue(mockProgramInfo);
      mockSolanaService.getMarketBehavior.mockResolvedValue(mockMarketBehavior);
      mockSolanaService.getTokenInfo.mockResolvedValue(mockTokenInfo);
      mockSolanaService.getTokenLiquidity.mockResolvedValue(mockLiquidity);
      mockSolanaService.getTokenHolders.mockResolvedValue([
        { address: 'holder1', balance: 1000 }
      ]);
      mockSolanaService.getTokenTransactions.mockResolvedValue([
        { success: true, fee: 100, signature: 'sig1' }
      ]);

      const result = await riskScoreService.calculateRiskScore(tokenAddress);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.level);
      expect(mockSolanaService.getTokenProgram).toHaveBeenCalledWith(tokenAddress);
    });

    it('should store history when includeHistory option is true', async () => {
      const mockProgramInfo = {
        isVerified: true,
        hasAudit: true,
        hasLockedUpgradeAuthority: true
      };

      mockSolanaService.getTokenProgram.mockResolvedValue(mockProgramInfo);
      mockSolanaService.getMarketBehavior.mockResolvedValue({
        priceVolatility: 0.2,
        abnormalTradingScore: 0.1,
        failedTransactions: 0.05
      });
      mockSolanaService.getTokenInfo.mockResolvedValue({
        supply: 2000000000
      });
      mockSolanaService.getTokenLiquidity.mockResolvedValue({
        totalLiquidity: 2000000,
        liquidityPools: []
      });
      mockSolanaService.getTokenHolders.mockResolvedValue([
        { address: 'holder1', balance: 1000 }
      ]);
      mockSolanaService.getTokenTransactions.mockResolvedValue([
        { success: true, fee: 100, signature: 'sig1' }
      ]);

      await riskScoreService.calculateRiskScore(tokenAddress, { includeHistory: true });

      expect(mockDatabaseService.storeRiskScore).toHaveBeenCalledTimes(1);
    });

    it('should enforce cache size limit', async () => {
      const mockProgramInfo = { isVerified: true };
      mockSolanaService.getTokenProgram.mockResolvedValue(mockProgramInfo);
      mockSolanaService.getMarketBehavior.mockResolvedValue({});
      mockSolanaService.getTokenInfo.mockResolvedValue({ supply: 1000000 });
      mockSolanaService.getTokenLiquidity.mockResolvedValue({ totalLiquidity: 1000000 });
      mockSolanaService.getTokenHolders.mockResolvedValue([]);
      mockSolanaService.getTokenTransactions.mockResolvedValue([]);

      // Fill cache to max size + 1
      const maxSize = 1000; // This should match MAX_CACHE_SIZE in service
      for (let i = 0; i < maxSize + 1; i++) {
        await riskScoreService.calculateRiskScore(`token${i}`);
      }

      // @ts-ignore - accessing private property for testing
      expect(riskScoreService.cache.size).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('getRiskLevel', () => {
    const testCases = [
      { score: 90, expected: 'low' },
      { score: 70, expected: 'medium' },
      { score: 50, expected: 'high' },
      { score: 30, expected: 'critical' }
    ];

    testCases.forEach(({ score, expected }) => {
      it(`should return ${expected} for score ${score}`, () => {
        // @ts-ignore - accessing private method for testing
        expect(riskScoreService.getRiskLevel(score)).toBe(expected);
      });
    });
  });

  describe('getRiskScoreHistory', () => {
    it('should fetch history from database', async () => {
      const mockHistory = [
        {
          score: 85,
          level: 'low',
          timestamp: new Date().toISOString(),
          tokenAddress
        }
      ];

      mockDatabaseService.getRiskScoreHistory.mockResolvedValue(mockHistory);

      const result = await riskScoreService.getRiskScoreHistory(tokenAddress);

      expect(result).toEqual(mockHistory);
      expect(mockDatabaseService.getRiskScoreHistory).toHaveBeenCalledWith(tokenAddress, 100, 0);
    });

    it('should handle database errors', async () => {
      mockDatabaseService.getRiskScoreHistory.mockRejectedValue(new Error('Database error'));

      await expect(riskScoreService.getRiskScoreHistory(tokenAddress))
        .rejects.toThrow('Failed to get risk score history: Database error');
    });
  });

  describe('analyzeLiquidity', () => {
    it('should calculate liquidity risk levels correctly', async () => {
      const testCases = [
        { liquidity: 2000000, expectedRisk: 'low' },
        { liquidity: 500000, expectedRisk: 'medium' },
        { liquidity: 50000, expectedRisk: 'high' },
        { liquidity: 5000, expectedRisk: 'critical' }
      ];

      for (const { liquidity, expectedRisk } of testCases) {
        mockSolanaService.getTokenLiquidity.mockResolvedValue({
          totalLiquidity: liquidity,
          liquidityPools: []
        });

        // @ts-ignore - accessing private method for testing
        const result = await riskScoreService.analyzeLiquidity(tokenAddress);
        expect(result.liquidityRisk).toBe(expectedRisk);
      }
    });
  });

  describe('analyzeHolderDistribution', () => {
    it('should calculate concentration and distribution risk correctly', async () => {
      const holders = [
        { address: 'holder1', balance: 800 },
        { address: 'holder2', balance: 200 }
      ];

      mockSolanaService.getTokenHolders.mockResolvedValue(holders);

      // @ts-ignore - accessing private method for testing
      const result = await riskScoreService.analyzeHolderDistribution(tokenAddress);

      expect(result.concentration).toBe(100); // All holders are in top 10
      expect(result.distributionRisk).toBe('critical');
      expect(result.totalHolders).toBe(2);
    });
  });

  describe('analyzeTransactionHistory', () => {
    it('should analyze transaction history and calculate risk', async () => {
      const transactions = [
        { success: true, fee: 100, signature: 'sig1' },
        { success: true, fee: 200, signature: 'sig2' },
        { success: false, fee: 300, signature: 'sig3' }
      ];

      mockSolanaService.getTokenTransactions.mockResolvedValue(transactions);

      // @ts-ignore - accessing private method for testing
      const result = await riskScoreService.analyzeTransactionHistory(tokenAddress);

      expect(result.totalTransactions).toBe(3);
      expect(result.suspiciousTransactions).toHaveLength(1); // The failed transaction
      expect(result.risk).toBe('critical'); // Due to 66% success rate
    });
  });
});
