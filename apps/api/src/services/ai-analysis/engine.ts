import { Connection, PublicKey } from '@solana/web3.js';
import OpenAI from 'openai';
import { z } from 'zod';
import { featureFlags } from '../../config';

// Types for AI Analysis
export interface ContractAnalysisRequest {
  contractCode: string;
  contractAddress?: string;
  metadata?: {
    name?: string;
    symbol?: string;
    description?: string;
    githubUrl?: string;
  };
  analysisLevel: 'basic' | 'standard' | 'comprehensive';
}

export interface VulnerabilityFinding {
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
  confidence: number; // 0-1
}

export interface StaticAnalysisResult {
  vulnerabilities: VulnerabilityFinding[];
  codeQuality: {
    complexity: number;
    maintainability: number;
    testability: number;
  };
  bestPractices: {
    passed: number;
    failed: number;
    warnings: string[];
  };
}

export interface MLAnalysisResult {
  mlScore: number;
  gpt4Analysis: string;
  confidence: number;
  riskFactors: string[];
  similarContracts: Array<{
    address: string;
    similarity: number;
    riskScore: number;
  }>;
}

export interface ContractAnalysisResult {
  contractAddress?: string;
  analysisId: string;
  timestamp: string;
  analysisLevel: string;
  executionTime: number;
  overallScore: number;
  staticAnalysis: StaticAnalysisResult;
  mlAnalysis: MLAnalysisResult;
  recommendations: string[];
  certificationEligible: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class SolGuardAIEngine {
  // TODO: [PREMIUM] OpenAI integration - requires OPENAI_API_KEY
  // Uncomment when AI features are monetized
  private openai: OpenAI | null = null;
  private connection: Connection;
  private vulnerabilityPatterns: Map<string, any> = new Map();
  private aiEnabled: boolean = false;

  constructor() {
    // Initialize AI only if API key is available
    // TODO: [PREMIUM] This enables GPT-4 powered analysis when API key is set
    if (featureFlags.AI_ANALYSIS_ENABLED && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.aiEnabled = true;
      console.log('🧠 AI Analysis: GPT-4 enabled');
    } else {
      console.log('🧠 AI Analysis: Using pattern-based analysis (zero-budget mode)');
      console.log('   → To enable AI: Set OPENAI_API_KEY in environment');
    }

    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    this.initializeVulnerabilityPatterns();
  }

  // Check if AI features are available
  isAIEnabled(): boolean {
    return this.aiEnabled;
  }

  private initializeVulnerabilityPatterns(): void {
    // Initialize common Solana vulnerability patterns
    this.vulnerabilityPatterns.set('account_validation', {
      pattern: /AccountInfo.*is_signer.*false/i,
      severity: 'high',
      description: 'Missing signer validation'
    });
    
    this.vulnerabilityPatterns.set('pda_derivation', {
      pattern: /find_program_address.*bump/i,
      severity: 'medium',
      description: 'PDA derivation without proper validation'
    });
    
    this.vulnerabilityPatterns.set('overflow_protection', {
      pattern: /checked_add|checked_sub|checked_mul/i,
      severity: 'high',
      description: 'Arithmetic operations without overflow protection'
    });
    
    this.vulnerabilityPatterns.set('reentrancy_guard', {
      pattern: /invoke.*invoke_signed/i,
      severity: 'critical',
      description: 'Potential reentrancy vulnerability'
    });
  }

  async analyzeContract(request: ContractAnalysisRequest): Promise<ContractAnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();

    console.log(`🧠 Starting AI analysis for contract: ${request.contractAddress || 'unknown'}`);

    // Multi-layered analysis pipeline
    const [staticAnalysis, mlAnalysis] = await Promise.all([
      this.performStaticAnalysis(request.contractCode),
      this.performMLAnalysis(request.contractCode, request.metadata)
    ]);

    // Calculate overall security score
    const overallScore = this.calculateOverallScore(staticAnalysis, mlAnalysis);
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore, staticAnalysis, mlAnalysis);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(staticAnalysis, mlAnalysis);
    
    // Check certification eligibility
    const certificationEligible = this.assessCertificationEligibility(overallScore, staticAnalysis);

    const result: ContractAnalysisResult = {
      contractAddress: request.contractAddress,
      analysisId,
      timestamp: new Date().toISOString(),
      analysisLevel: request.analysisLevel,
      executionTime: Date.now() - startTime,
      overallScore,
      staticAnalysis,
      mlAnalysis,
      recommendations,
      certificationEligible,
      riskLevel
    };

    console.log(`✅ Analysis completed in ${result.executionTime}ms with score: ${overallScore}/100`);
    return result;
  }

  private async performStaticAnalysis(code: string): Promise<StaticAnalysisResult> {
    const vulnerabilities: VulnerabilityFinding[] = [];
    
    // Pattern-based vulnerability detection
    for (const [category, pattern] of this.vulnerabilityPatterns) {
      const matches = code.match(new RegExp(pattern.pattern, 'g'));
      if (matches) {
        vulnerabilities.push({
          id: this.generateVulnerabilityId(),
          severity: pattern.severity as any,
          category,
          title: this.getVulnerabilityTitle(category),
          description: pattern.description,
          recommendation: this.getVulnerabilityRecommendation(category),
          confidence: 0.8
        });
      }
    }

    // Code quality analysis
    const codeQuality = this.assessCodeQuality(code);
    
    // Best practices check
    const bestPractices = this.checkBestPractices(code);

    return {
      vulnerabilities,
      codeQuality,
      bestPractices
    };
  }

  private async performMLAnalysis(code: string, metadata?: any): Promise<MLAnalysisResult> {
    // ========================================================================
    // TODO: [PREMIUM] GPT-4 AI Analysis
    // This section uses OpenAI GPT-4 for advanced contract analysis.
    // Requires: OPENAI_API_KEY environment variable
    // Cost: ~$0.03-0.06 per 1K tokens
    // ========================================================================

    // Check if AI is enabled (zero-budget mode fallback)
    if (!this.aiEnabled || !this.openai) {
      console.log('🔄 Using pattern-based analysis (AI disabled)');
      return this.performPatternBasedAnalysis(code, metadata);
    }

    try {
      // GPT-4 analysis with custom prompt engineering
      const prompt = this.buildSolanaAnalysisPrompt(code, metadata);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert Solana smart contract security auditor with 10+ years of experience. Analyze the provided contract code for security vulnerabilities, best practices, and potential risks. Provide detailed findings with specific recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      const gpt4Analysis = completion.choices[0]?.message?.content || '';

      // Extract risk factors from GPT-4 analysis
      const riskFactors = this.extractRiskFactors(gpt4Analysis);

      // Calculate ML confidence score
      const confidence = this.calculateMLConfidence(gpt4Analysis, riskFactors);

      // Find similar contracts (placeholder for now)
      const similarContracts = await this.findSimilarContracts(code);

      return {
        mlScore: this.calculateMLScore(gpt4Analysis, riskFactors),
        gpt4Analysis,
        confidence,
        riskFactors,
        similarContracts
      };
    } catch (error) {
      console.error('ML Analysis error:', error);
      // Fallback to pattern-based analysis on error
      console.log('🔄 Falling back to pattern-based analysis');
      return this.performPatternBasedAnalysis(code, metadata);
    }
  }

  /**
   * Pattern-based analysis fallback (zero-budget mode)
   * This provides basic security analysis without requiring paid AI APIs
   * TODO: [PREMIUM] Upgrade to AI analysis for better accuracy
   */
  private async performPatternBasedAnalysis(code: string, metadata?: any): Promise<MLAnalysisResult> {
    const riskFactors: string[] = [];
    let baseScore = 75; // Start with moderate score

    // Enhanced pattern matching for Solana vulnerabilities
    const vulnerabilityChecks = [
      { pattern: /invoke_signed|invoke\s*\(/gi, risk: 'CPI calls detected - verify cross-program invocations', severity: 10 },
      { pattern: /unchecked|unsafe/gi, risk: 'Unchecked/unsafe operations detected', severity: 15 },
      { pattern: /authority|owner|admin/gi, risk: 'Authority patterns detected - verify access control', severity: 5 },
      { pattern: /transfer|withdraw|deposit/gi, risk: 'Token transfer operations - verify validation', severity: 8 },
      { pattern: /mint_to|burn/gi, risk: 'Token supply operations detected', severity: 10 },
      { pattern: /close_account/gi, risk: 'Account closing operations - verify fund destination', severity: 12 },
      { pattern: /set_authority/gi, risk: 'Authority change operations detected', severity: 15 },
      { pattern: /init_if_needed/gi, risk: 'init_if_needed can be risky without proper checks', severity: 8 },
      { pattern: /remaining_accounts/gi, risk: 'Dynamic accounts detected - verify validation', severity: 10 },
      { pattern: /try_borrow_mut|borrow_mut/gi, risk: 'Mutable borrows detected - check for double-borrow', severity: 5 },
    ];

    for (const check of vulnerabilityChecks) {
      if (check.pattern.test(code)) {
        riskFactors.push(check.risk);
        baseScore -= check.severity;
      }
    }

    // Positive patterns (increase score)
    const positiveChecks = [
      { pattern: /require!|constraint\s*=/gi, bonus: 5, reason: 'Input validation present' },
      { pattern: /checked_add|checked_sub|checked_mul/gi, bonus: 8, reason: 'Safe arithmetic operations' },
      { pattern: /#\[account\(.*constraint.*\)]/gi, bonus: 5, reason: 'Account constraints present' },
      { pattern: /has_one\s*=/gi, bonus: 5, reason: 'Ownership validation present' },
      { pattern: /signer/gi, bonus: 3, reason: 'Signer validation present' },
    ];

    for (const check of positiveChecks) {
      if (check.pattern.test(code)) {
        baseScore += check.bonus;
      }
    }

    // Clamp score between 0-100
    const mlScore = Math.max(0, Math.min(100, baseScore));

    // Generate analysis summary
    const analysisNotes = [
      '📋 Pattern-Based Security Analysis (Zero-Budget Mode)',
      '',
      `Risk factors identified: ${riskFactors.length}`,
      ...riskFactors.map(r => `  ⚠️ ${r}`),
      '',
      'Note: For more comprehensive AI-powered analysis, configure OPENAI_API_KEY',
      'This analysis uses rule-based pattern matching which may miss complex vulnerabilities.',
    ].join('\n');

    return {
      mlScore,
      gpt4Analysis: analysisNotes,
      confidence: 0.6, // Lower confidence for pattern-based analysis
      riskFactors,
      similarContracts: [] // Disabled without vector DB
    };
  }

  private buildSolanaAnalysisPrompt(code: string, metadata?: any): string {
    return `
Analyze this Solana smart contract for security vulnerabilities and best practices:

${metadata ? `Contract Metadata:
- Name: ${metadata.name || 'Unknown'}
- Symbol: ${metadata.symbol || 'Unknown'}
- Description: ${metadata.description || 'No description'}
- GitHub: ${metadata.githubUrl || 'Not provided'}
` : ''}

Contract Code:
\`\`\`rust
${code}
\`\`\`

Please provide:
1. Critical security vulnerabilities (if any)
2. High-risk issues
3. Medium-risk issues
4. Code quality concerns
5. Best practice violations
6. Specific recommendations for each finding
7. Overall security assessment (1-100 score)

Focus on Solana-specific vulnerabilities like:
- Account validation issues
- PDA derivation problems
- Signer verification
- Arithmetic overflow/underflow
- Reentrancy attacks
- Access control flaws
- Token handling issues
`;
  }

  private assessCodeQuality(code: string): { complexity: number; maintainability: number; testability: number } {
    const lines = code.split('\n').length;
    const functions = (code.match(/fn\s+\w+/g) || []).length;
    const comments = (code.match(/\/\/|\/\*|\*\//g) || []).length;
    
    // Simple complexity calculation
    const complexity = Math.min(100, (functions * 10) + (lines / 10));
    const maintainability = Math.max(0, 100 - complexity + (comments * 2));
    const testability = functions > 0 ? Math.min(100, (functions * 20)) : 0;

    return { complexity, maintainability, testability };
  }

  private checkBestPractices(code: string): { passed: number; failed: number; warnings: string[] } {
    const warnings: string[] = [];
    let passed = 0;
    let failed = 0;

    // Check for common best practices
    const checks = [
      { pattern: /use\s+solana_program/, name: 'Solana program imports', required: true },
      { pattern: /#\[derive\(Accounts\)\]/, name: 'Account validation', required: true },
      { pattern: /require!/, name: 'Input validation', required: true },
      { pattern: /checked_add|checked_sub/, name: 'Safe arithmetic', required: false },
      { pattern: /\/\/.*TODO|\/\/.*FIXME/, name: 'No TODO comments', required: false }
    ];

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

    return { passed, failed, warnings };
  }

  private extractRiskFactors(analysis: string): string[] {
    const riskKeywords = [
      'vulnerability', 'exploit', 'attack', 'risk', 'dangerous',
      'unsafe', 'critical', 'high risk', 'security issue'
    ];
    
    return riskKeywords.filter(keyword => 
      analysis.toLowerCase().includes(keyword)
    );
  }

  private calculateMLConfidence(analysis: string, riskFactors: string[]): number {
    const baseConfidence = 0.7;
    const riskBonus = Math.min(0.3, riskFactors.length * 0.1);
    const lengthBonus = Math.min(0.2, analysis.length / 10000);
    
    return Math.min(1, baseConfidence + riskBonus + lengthBonus);
  }

  private calculateMLScore(analysis: string, riskFactors: string[]): number {
    let score = 80; // Base score
    
    // Deduct points for risk factors
    score -= riskFactors.length * 10;
    
    // Deduct points for critical keywords
    const criticalKeywords = ['critical', 'exploit', 'vulnerability'];
    const criticalCount = criticalKeywords.filter(keyword => 
      analysis.toLowerCase().includes(keyword)
    ).length;
    
    score -= criticalCount * 15;
    
    return Math.max(0, Math.min(100, score));
  }

  private async findSimilarContracts(code: string): Promise<Array<{ address: string; similarity: number; riskScore: number }>> {
    // Placeholder for similar contract detection
    // In a real implementation, this would use vector similarity search
    return [
      { address: '11111111111111111111111111111111', similarity: 0.85, riskScore: 75 },
      { address: '22222222222222222222222222222222', similarity: 0.72, riskScore: 60 }
    ];
  }

  private calculateOverallScore(staticAnalysis: StaticAnalysisResult, mlAnalysis: MLAnalysisResult): number {
    const staticWeight = 0.6;
    const mlWeight = 0.4;
    
    // Calculate static analysis score
    const vulnerabilityPenalty = staticAnalysis.vulnerabilities.reduce((penalty, vuln) => {
      const severityMultiplier = { critical: 20, high: 15, medium: 10, low: 5, info: 2 };
      return penalty + (severityMultiplier[vuln.severity] * vuln.confidence);
    }, 0);
    
    const staticScore = Math.max(0, 100 - vulnerabilityPenalty);
    
    // Combine scores
    return Math.round((staticScore * staticWeight) + (mlAnalysis.mlScore * mlWeight));
  }

  private determineRiskLevel(score: number, staticAnalysis: StaticAnalysisResult, mlAnalysis: MLAnalysisResult): 'low' | 'medium' | 'high' | 'critical' {
    const criticalVulns = staticAnalysis.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = staticAnalysis.vulnerabilities.filter(v => v.severity === 'high').length;
    
    if (criticalVulns > 0 || score < 30) return 'critical';
    if (highVulns > 2 || score < 50) return 'high';
    if (score < 70) return 'medium';
    return 'low';
  }

  private generateRecommendations(staticAnalysis: StaticAnalysisResult, mlAnalysis: MLAnalysisResult): string[] {
    const recommendations: string[] = [];
    
    // Static analysis recommendations
    for (const vuln of staticAnalysis.vulnerabilities) {
      if (vuln.severity === 'critical' || vuln.severity === 'high') {
        recommendations.push(`🔴 ${vuln.title}: ${vuln.recommendation}`);
      }
    }
    
    // ML analysis recommendations
    if (mlAnalysis.riskFactors.length > 0) {
      recommendations.push(`🤖 AI detected risk factors: ${mlAnalysis.riskFactors.join(', ')}`);
    }
    
    // General recommendations
    if (staticAnalysis.codeQuality.complexity > 80) {
      recommendations.push('📊 Consider reducing code complexity for better maintainability');
    }
    
    if (staticAnalysis.bestPractices.failed > 0) {
      recommendations.push('✅ Implement missing best practices for improved security');
    }
    
    return recommendations;
  }

  private assessCertificationEligibility(score: number, staticAnalysis: StaticAnalysisResult): boolean {
    const criticalVulns = staticAnalysis.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = staticAnalysis.vulnerabilities.filter(v => v.severity === 'high').length;
    
    return score >= 80 && criticalVulns === 0 && highVulns <= 1;
  }

  private getVulnerabilityTitle(category: string): string {
    const titles: Record<string, string> = {
      'account_validation': 'Missing Account Validation',
      'pda_derivation': 'Insecure PDA Derivation',
      'overflow_protection': 'Arithmetic Overflow Risk',
      'reentrancy_guard': 'Potential Reentrancy Attack'
    };
    return titles[category] || 'Security Issue';
  }

  private getVulnerabilityRecommendation(category: string): string {
    const recommendations: Record<string, string> = {
      'account_validation': 'Add proper signer validation using is_signer checks',
      'pda_derivation': 'Validate PDA derivation with proper seeds and program ID',
      'overflow_protection': 'Use checked arithmetic operations (checked_add, checked_sub, etc.)',
      'reentrancy_guard': 'Implement reentrancy guards or use checks-effects-interactions pattern'
    };
    return recommendations[category] || 'Review and fix the identified security issue';
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVulnerabilityId(): string {
    return `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiEngine = new SolGuardAIEngine();
