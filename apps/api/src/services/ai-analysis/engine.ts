import { Connection, PublicKey } from '@solana/web3.js';
import OpenAI from 'openai';
import { z } from 'zod';

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
  private openai: OpenAI;
  private connection: Connection;
  private vulnerabilityPatterns: Map<string, any> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    this.initializeVulnerabilityPatterns();
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
      return {
        mlScore: 0,
        gpt4Analysis: 'Analysis failed due to API error',
        confidence: 0,
        riskFactors: ['API Error'],
        similarContracts: []
      };
    }
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
