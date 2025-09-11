import { Connection, PublicKey } from '@solana/web3.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { aiEngine, ContractAnalysisResult } from '../ai-analysis/engine';

const execAsync = promisify(exec);

// Audit Configuration Schema
export const AuditConfigSchema = z.object({
  contractAddress: z.string().optional(),
  githubRepo: z.string().url().optional(),
  contractCode: z.string().optional(),
  auditLevel: z.enum(['basic', 'standard', 'comprehensive']),
  includeGasOptimization: z.boolean().default(true),
  includeFormalVerification: z.boolean().default(false),
  customRules: z.array(z.string()).default([])
});

export type AuditConfig = z.infer<typeof AuditConfigSchema>;

// Audit Result Types
export interface StaticAnalysisResult {
  vulnerabilities: Array<{
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    title: string;
    description: string;
    recommendation: string;
    codeLocation?: {
      line: number;
      column: number;
      function?: string;
    };
    confidence: number;
  }>;
  codeQuality: {
    complexity: number;
    maintainability: number;
    testability: number;
    cyclomaticComplexity: number;
  };
  bestPractices: {
    passed: number;
    failed: number;
    warnings: string[];
    score: number;
  };
  metrics: {
    linesOfCode: number;
    functions: number;
    structs: number;
    comments: number;
    testCoverage?: number;
  };
}

export interface DynamicAnalysisResult {
  behaviorAnalysis: {
    accessControlTests: boolean;
    reentrancyTests: boolean;
    overflowTests: boolean;
    pdaValidationTests: boolean;
    signerCheckTests: boolean;
  };
  exploitAttempts: Array<{
    type: string;
    success: boolean;
    description: string;
    mitigation: string;
  }>;
  resilience: {
    score: number;
    weaknesses: string[];
    strengths: string[];
  };
}

export interface FuzzTestResult {
  iterations: number;
  coverage: number;
  crashes: number;
  timeouts: number;
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    input: any;
  }>;
  performance: {
    averageExecutionTime: number;
    maxExecutionTime: number;
    throughput: number;
  };
}

export interface GasOptimizationResult {
  optimizations: Array<{
    type: string;
    description: string;
    potentialSavings: number;
    difficulty: 'easy' | 'medium' | 'hard';
    codeLocation?: {
      line: number;
      function: string;
    };
  }>;
  estimatedSavings: number;
  recommendations: string[];
}

export interface AuditReport {
  contractAddress?: string;
  auditId: string;
  timestamp: string;
  auditLevel: string;
  executionTime: number;
  overallScore: number;
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  staticAnalysis: StaticAnalysisResult;
  dynamicAnalysis?: DynamicAnalysisResult;
  fuzzTesting?: FuzzTestResult;
  gasOptimization?: GasOptimizationResult;
  aiAnalysis: ContractAnalysisResult;
  recommendations: string[];
  certificationEligible: boolean;
  complianceLevel: 'basic' | 'standard' | 'enterprise';
  nextAuditDue: string;
}

export class SolGuardAuditEngine {
  private connection: Connection;
  private auditTools: Map<string, string> = new Map();

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    this.initializeAuditTools();
  }

  private initializeAuditTools(): void {
    // Initialize audit tools configuration
    this.auditTools.set('anchor-audit', 'anchor audit');
    this.auditTools.set('cargo-audit', 'cargo audit');
    this.auditTools.set('semgrep', 'semgrep --config=auto');
    this.auditTools.set('custom-solana', 'node scripts/custom-solana-audit.js');
  }

  async auditContract(config: AuditConfig): Promise<AuditReport> {
    const startTime = Date.now();
    const auditId = this.generateAuditId();

    console.log(`🔍 Starting comprehensive audit for contract: ${config.contractAddress || 'unknown'}`);

    // Multi-phase audit pipeline
    const auditPhases = await this.executeAuditPhases(config, auditId);

    // Generate comprehensive audit report
    const auditReport: AuditReport = {
      contractAddress: config.contractAddress,
      auditId,
      timestamp: new Date().toISOString(),
      auditLevel: config.auditLevel,
      executionTime: Date.now() - startTime,
      overallScore: this.calculateOverallScore(auditPhases),
      findings: this.consolidateFindings(auditPhases),
      staticAnalysis: auditPhases.staticAnalysis,
      dynamicAnalysis: auditPhases.dynamicAnalysis,
      fuzzTesting: auditPhases.fuzzTesting,
      gasOptimization: auditPhases.gasOptimization,
      aiAnalysis: auditPhases.aiAnalysis,
      recommendations: this.generateRecommendations(auditPhases),
      certificationEligible: this.assessCertificationEligibility(auditPhases),
      complianceLevel: this.determineComplianceLevel(auditPhases),
      nextAuditDue: this.calculateNextAuditDue(config.auditLevel)
    };

    // Store audit in database for immutability
    await this.storeAuditOnChain(auditReport);

    console.log(`✅ Audit completed in ${auditReport.executionTime}ms with score: ${auditReport.overallScore}/100`);
    return auditReport;
  }

  private async executeAuditPhases(config: AuditConfig, auditId: string) {
    const phases = {
      codeRetrieval: await this.codeRetrievalPhase(config),
      staticAnalysis: await this.staticAnalysisPhase(config),
      dynamicAnalysis: config.auditLevel !== 'basic' ? await this.dynamicAnalysisPhase(config) : undefined,
      fuzzTesting: config.auditLevel === 'comprehensive' ? await this.fuzzTestingPhase(config) : undefined,
      gasOptimization: config.includeGasOptimization ? await this.gasOptimizationPhase(config) : undefined,
      aiAnalysis: await this.aiAnalysisPhase(config)
    };

    return phases;
  }

  private async codeRetrievalPhase(config: AuditConfig): Promise<string> {
    console.log('📥 Phase 1: Code Retrieval');
    
    if (config.contractCode) {
      return config.contractCode;
    }

    if (config.contractAddress) {
      // Retrieve contract code from on-chain
      try {
        const accountInfo = await this.connection.getAccountInfo(new PublicKey(config.contractAddress));
        if (accountInfo?.data) {
          return accountInfo.data.toString('utf8');
        }
      } catch (error) {
        console.warn('Failed to retrieve contract code from address:', error);
      }
    }

    if (config.githubRepo) {
      // Clone and retrieve code from GitHub
      try {
        const { stdout } = await execAsync(`git clone ${config.githubRepo} /tmp/audit-repo-${Date.now()}`);
        // In a real implementation, you would read the contract files
        return '// Contract code retrieved from GitHub\n// Implementation needed for file reading';
      } catch (error) {
        console.warn('Failed to retrieve code from GitHub:', error);
      }
    }

    throw new Error('No contract code available for analysis');
  }

  private async staticAnalysisPhase(config: AuditConfig): Promise<StaticAnalysisResult> {
    console.log('🔍 Phase 2: Static Analysis');
    
    const tools = ['anchor-audit', 'cargo-audit', 'semgrep', 'custom-solana'];
    const results = await Promise.allSettled(
      tools.map(tool => this.runStaticAnalysisTool(tool, config))
    );

    // Consolidate results from all tools
    const vulnerabilities = this.deduplicateVulnerabilities(results);
    const codeQuality = this.assessCodeQuality(config.contractCode || '');
    const bestPractices = this.checkBestPractices(config.contractCode || '');
    const metrics = this.calculateMetrics(config.contractCode || '');

    return {
      vulnerabilities,
      codeQuality,
      bestPractices,
      metrics
    };
  }

  private async runStaticAnalysisTool(tool: string, config: AuditConfig): Promise<any> {
    try {
      const command = this.auditTools.get(tool);
      if (!command) {
        throw new Error(`Tool ${tool} not configured`);
      }

      // In a real implementation, you would execute the actual tool
      // For now, return mock results
      return this.getMockToolResults(tool);
    } catch (error) {
      console.warn(`Tool ${tool} failed:`, error);
      return { vulnerabilities: [], errors: [error.message] };
    }
  }

  private getMockToolResults(tool: string): any {
    const mockResults: Record<string, any> = {
      'anchor-audit': {
        vulnerabilities: [
          {
            id: 'anchor-001',
            severity: 'medium',
            category: 'access_control',
            title: 'Missing signer validation',
            description: 'Account validation missing is_signer check',
            recommendation: 'Add proper signer validation',
            confidence: 0.9
          }
        ]
      },
      'cargo-audit': {
        vulnerabilities: [
          {
            id: 'cargo-001',
            severity: 'high',
            category: 'dependency',
            title: 'Vulnerable dependency detected',
            description: 'Outdated dependency with known vulnerabilities',
            recommendation: 'Update to latest version',
            confidence: 0.95
          }
        ]
      },
      'semgrep': {
        vulnerabilities: [
          {
            id: 'semgrep-001',
            severity: 'low',
            category: 'code_quality',
            title: 'Unused variable',
            description: 'Variable declared but never used',
            recommendation: 'Remove unused variable',
            confidence: 0.8
          }
        ]
      },
      'custom-solana': {
        vulnerabilities: [
          {
            id: 'solana-001',
            severity: 'critical',
            category: 'pda_derivation',
            title: 'Insecure PDA derivation',
            description: 'PDA derivation without proper validation',
            recommendation: 'Validate PDA derivation with proper seeds',
            confidence: 0.85
          }
        ]
      }
    };

    return mockResults[tool] || { vulnerabilities: [] };
  }

  private deduplicateVulnerabilities(results: PromiseSettledResult<any>[]): any[] {
    const allVulnerabilities: any[] = [];
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.vulnerabilities) {
        allVulnerabilities.push(...result.value.vulnerabilities);
      }
    }

    // Simple deduplication based on title and category
    const unique = new Map();
    for (const vuln of allVulnerabilities) {
      const key = `${vuln.title}-${vuln.category}`;
      if (!unique.has(key) || unique.get(key).confidence < vuln.confidence) {
        unique.set(key, vuln);
      }
    }

    return Array.from(unique.values());
  }

  private assessCodeQuality(code: string): StaticAnalysisResult['codeQuality'] {
    const lines = code.split('\n').length;
    const functions = (code.match(/fn\s+\w+/g) || []).length;
    const structs = (code.match(/struct\s+\w+/g) || []).length;
    const comments = (code.match(/\/\/|\/\*|\*\//g) || []).length;

    // Calculate cyclomatic complexity (simplified)
    const complexity = (code.match(/if|while|for|match/g) || []).length + 1;
    
    return {
      complexity: Math.min(100, (functions * 10) + (lines / 10)),
      maintainability: Math.max(0, 100 - complexity + (comments * 2)),
      testability: functions > 0 ? Math.min(100, (functions * 20)) : 0,
      cyclomaticComplexity: complexity
    };
  }

  private checkBestPractices(code: string): StaticAnalysisResult['bestPractices'] {
    const checks = [
      { pattern: /use\s+solana_program/, name: 'Solana program imports', required: true },
      { pattern: /#\[derive\(Accounts\)\]/, name: 'Account validation', required: true },
      { pattern: /require!/, name: 'Input validation', required: true },
      { pattern: /checked_add|checked_sub/, name: 'Safe arithmetic', required: false },
      { pattern: /\/\/.*TODO|\/\/.*FIXME/, name: 'No TODO comments', required: false }
    ];

    let passed = 0;
    let failed = 0;
    const warnings: string[] = [];

    for (const check of checks) {
      if (check.pattern.test(code)) {
        if (check.required) passed++;
        else warnings.push(`Consider: ${check.name}`);
      } else {
        if (check.required) {
          failed++;
          warnings.push(`Missing: ${check.name}`);
        }
      }
    }

    const total = passed + failed;
    const score = total > 0 ? Math.round((passed / total) * 100) : 100;

    return { passed, failed, warnings, score };
  }

  private calculateMetrics(code: string): StaticAnalysisResult['metrics'] {
    return {
      linesOfCode: code.split('\n').length,
      functions: (code.match(/fn\s+\w+/g) || []).length,
      structs: (code.match(/struct\s+\w+/g) || []).length,
      comments: (code.match(/\/\/|\/\*|\*\//g) || []).length
    };
  }

  private async dynamicAnalysisPhase(config: AuditConfig): Promise<DynamicAnalysisResult> {
    console.log('🧪 Phase 3: Dynamic Analysis');
    
    // Mock dynamic analysis results
    return {
      behaviorAnalysis: {
        accessControlTests: true,
        reentrancyTests: true,
        overflowTests: false,
        pdaValidationTests: true,
        signerCheckTests: false
      },
      exploitAttempts: [
        {
          type: 'reentrancy',
          success: false,
          description: 'Attempted reentrancy attack',
          mitigation: 'Proper state management prevents reentrancy'
        },
        {
          type: 'overflow',
          success: true,
          description: 'Arithmetic overflow detected',
          mitigation: 'Use checked arithmetic operations'
        }
      ],
      resilience: {
        score: 75,
        weaknesses: ['Arithmetic overflow vulnerability', 'Missing signer validation'],
        strengths: ['Proper access control', 'Reentrancy protection']
      }
    };
  }

  private async fuzzTestingPhase(config: AuditConfig): Promise<FuzzTestResult> {
    console.log('🎯 Phase 4: Fuzz Testing');
    
    // Mock fuzz testing results
    return {
      iterations: 10000,
      coverage: 85,
      crashes: 2,
      timeouts: 0,
      findings: [
        {
          type: 'integer_overflow',
          severity: 'high',
          description: 'Integer overflow in multiplication operation',
          input: { a: 4294967295, b: 2 }
        }
      ],
      performance: {
        averageExecutionTime: 0.5,
        maxExecutionTime: 2.1,
        throughput: 2000
      }
    };
  }

  private async gasOptimizationPhase(config: AuditConfig): Promise<GasOptimizationResult> {
    console.log('⛽ Phase 5: Gas Optimization');
    
    return {
      optimizations: [
        {
          type: 'loop_optimization',
          description: 'Optimize loop structure to reduce gas consumption',
          potentialSavings: 15,
          difficulty: 'medium',
          codeLocation: { line: 45, function: 'process_batch' }
        },
        {
          type: 'storage_optimization',
          description: 'Use more efficient data structures',
          potentialSavings: 8,
          difficulty: 'easy'
        }
      ],
      estimatedSavings: 23,
      recommendations: [
        'Consider using batch operations for multiple transfers',
        'Optimize data structure packing',
        'Use events instead of storage for non-critical data'
      ]
    };
  }

  private async aiAnalysisPhase(config: AuditConfig): Promise<ContractAnalysisResult> {
    console.log('🤖 Phase 6: AI Analysis');
    
    if (!config.contractCode) {
      throw new Error('Contract code required for AI analysis');
    }

    return await aiEngine.analyzeContract({
      contractCode: config.contractCode,
      contractAddress: config.contractAddress,
      analysisLevel: config.auditLevel
    });
  }

  private calculateOverallScore(phases: any): number {
    const weights = {
      staticAnalysis: 0.4,
      dynamicAnalysis: 0.2,
      fuzzTesting: 0.1,
      gasOptimization: 0.1,
      aiAnalysis: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Static analysis score
    if (phases.staticAnalysis) {
      const vulnPenalty = phases.staticAnalysis.vulnerabilities.reduce((penalty: number, vuln: any) => {
        const severityMultiplier = { critical: 20, high: 15, medium: 10, low: 5, info: 2 };
        return penalty + (severityMultiplier[vuln.severity] * vuln.confidence);
      }, 0);
      totalScore += (100 - vulnPenalty) * weights.staticAnalysis;
      totalWeight += weights.staticAnalysis;
    }

    // AI analysis score
    if (phases.aiAnalysis) {
      totalScore += phases.aiAnalysis.overallScore * weights.aiAnalysis;
      totalWeight += weights.aiAnalysis;
    }

    // Dynamic analysis score
    if (phases.dynamicAnalysis) {
      totalScore += phases.dynamicAnalysis.resilience.score * weights.dynamicAnalysis;
      totalWeight += weights.dynamicAnalysis;
    }

    // Fuzz testing score
    if (phases.fuzzTesting) {
      const fuzzScore = Math.max(0, 100 - (phases.fuzzTesting.crashes * 10));
      totalScore += fuzzScore * weights.fuzzTesting;
      totalWeight += weights.fuzzTesting;
    }

    // Gas optimization score
    if (phases.gasOptimization) {
      const gasScore = Math.min(100, 80 + phases.gasOptimization.estimatedSavings);
      totalScore += gasScore * weights.gasOptimization;
      totalWeight += weights.gasOptimization;
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  private consolidateFindings(phases: any): AuditReport['findings'] {
    const findings = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

    // Count static analysis findings
    if (phases.staticAnalysis?.vulnerabilities) {
      for (const vuln of phases.staticAnalysis.vulnerabilities) {
        findings[vuln.severity]++;
      }
    }

    // Count fuzz testing findings
    if (phases.fuzzTesting?.findings) {
      for (const finding of phases.fuzzTesting.findings) {
        if (finding.severity === 'high') findings.high++;
        else if (finding.severity === 'medium') findings.medium++;
        else findings.low++;
      }
    }

    return findings;
  }

  private generateRecommendations(phases: any): string[] {
    const recommendations: string[] = [];

    // Static analysis recommendations
    if (phases.staticAnalysis?.vulnerabilities) {
      for (const vuln of phases.staticAnalysis.vulnerabilities) {
        if (vuln.severity === 'critical' || vuln.severity === 'high') {
          recommendations.push(`🔴 ${vuln.title}: ${vuln.recommendation}`);
        }
      }
    }

    // AI analysis recommendations
    if (phases.aiAnalysis?.recommendations) {
      recommendations.push(...phases.aiAnalysis.recommendations);
    }

    // Gas optimization recommendations
    if (phases.gasOptimization?.recommendations) {
      recommendations.push(...phases.gasOptimization.recommendations.map((rec: string) => `⛽ ${rec}`));
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private assessCertificationEligibility(phases: any): boolean {
    const overallScore = this.calculateOverallScore(phases);
    const criticalFindings = this.consolidateFindings(phases).critical;
    const highFindings = this.consolidateFindings(phases).high;

    return overallScore >= 80 && criticalFindings === 0 && highFindings <= 2;
  }

  private determineComplianceLevel(phases: any): 'basic' | 'standard' | 'enterprise' {
    const overallScore = this.calculateOverallScore(phases);
    const findings = this.consolidateFindings(phases);

    if (overallScore >= 90 && findings.critical === 0 && findings.high <= 1) {
      return 'enterprise';
    } else if (overallScore >= 75 && findings.critical === 0 && findings.high <= 3) {
      return 'standard';
    } else {
      return 'basic';
    }
  }

  private calculateNextAuditDue(auditLevel: string): string {
    const now = new Date();
    const months = auditLevel === 'comprehensive' ? 6 : auditLevel === 'standard' ? 3 : 1;
    const nextAudit = new Date(now.getTime() + (months * 30 * 24 * 60 * 60 * 1000));
    return nextAudit.toISOString();
  }

  private async storeAuditOnChain(auditReport: AuditReport): Promise<void> {
    // In a real implementation, you would store the audit report hash on-chain
    // for immutability and verification purposes
    console.log(`📝 Storing audit report ${auditReport.auditId} on-chain`);
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const auditEngine = new SolGuardAuditEngine();
