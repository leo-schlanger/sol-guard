import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RiskScoreService } from '../RiskScoreService';
import { DatabaseService } from '../DatabaseService';
import { SolanaService } from '../SolanaService';

// Mock dependencies
vi.mock('../DatabaseService');
vi.mock('../SolanaService');

describe('RiskScoreService', () => {
  let riskScoreService: RiskScoreService;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockSolana: jest.Mocked<SolanaService>;

  beforeEach(() => {
    mockDatabase = new DatabaseService() as jest.Mocked<DatabaseService>;
    mockSolana = new SolanaService('mock-url') as jest.Mocked<SolanaService>;
    riskScoreService = new RiskScoreService(mockDatabase, mockSolana);
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score correctly', async () => {
      // Mock dependencies responses
      mockSolana.getTokenLiquidity.mockResolvedValue({
        totalLiquidity: 1000000,
        lastWeekStability: 90,
        liquidityPools: []
      });

      mockSolana.getTokenHolders.mockResolvedValue({
        uniqueHolders: 1000,
        giniCoefficient: 0.3,
        holders: []
      });

      mockSolana.getTokenProgram.mockResolvedValue({
        isVerified: true,
        hasAudit: true,
        hasLockedUpgradeAuthority: true,
        programData: {
          lastDeployment: new Date().toISOString(),
          version: '1.0.0'
        }
      });

      mockSolana.getMarketBehavior.mockResolvedValue({
        priceVolatility: 0.1,
        abnormalTradingScore: 0.1,
        lastTradeTime: new Date().toISOString(),
        volume24h: 1000000,
        priceChange24h: 0.5
      });

      // Calculate risk score
      const result = await riskScoreService.calculateRiskScore('mock-token-address');

      // Verify result structure
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('tokenAddress');

      // Verify score range
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should use cache for repeated requests', async () => {
      // First request
      const result1 = await riskScoreService.calculateRiskScore('mock-token-address');
      
      // Mock services should have been called
      expect(mockSolana.getTokenLiquidity).toHaveBeenCalledTimes(1);
      expect(mockSolana.getTokenHolders).toHaveBeenCalledTimes(1);
      expect(mockSolana.getTokenProgram).toHaveBeenCalledTimes(1);
      expect(mockSolana.getMarketBehavior).toHaveBeenCalledTimes(1);

      // Second request
      const result2 = await riskScoreService.calculateRiskScore('mock-token-address');
      
      // Services should not have been called again
      expect(mockSolana.getTokenLiquidity).toHaveBeenCalledTimes(1);
      expect(mockSolana.getTokenHolders).toHaveBeenCalledTimes(1);
      expect(mockSolana.getTokenProgram).toHaveBeenCalledTimes(1);
      expect(mockSolana.getMarketBehavior).toHaveBeenCalledTimes(1);

      // Results should be identical
      expect(result2).toEqual(result1);
    });

    it('should handle errors gracefully', async () => {
      // Mock service error
      mockSolana.getTokenLiquidity.mockRejectedValue(new Error('RPC error'));

      // Attempt to calculate risk score
      await expect(
        riskScoreService.calculateRiskScore('mock-token-address')
      ).rejects.toThrow('Failed to calculate risk score');
    });
  });

  describe('getRiskLevel', () => {
    it('should return correct risk levels', () => {
      const service = new RiskScoreService(mockDatabase, mockSolana);
      
      expect(service['getRiskLevel'](100)).toBe('LOW');
      expect(service['getRiskLevel'](76)).toBe('LOW');
      expect(service['getRiskLevel'](75)).toBe('MEDIUM');
      expect(service['getRiskLevel'](50)).toBe('HIGH');
      expect(service['getRiskLevel'](25)).toBe('MEDIUM');
      expect(service['getRiskLevel'](0)).toBe('LOW');
    });
  });
});
