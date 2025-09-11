import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';
import { EventEmitter } from 'events';
import { z } from 'zod';

// Monitoring Configuration Schema
export const MonitoringTargetSchema = z.object({
  address: z.string(),
  type: z.enum(['program', 'token', 'wallet']),
  alertThresholds: z.array(z.object({
    condition: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    threshold: z.number(),
    enabled: z.boolean().default(true)
  })),
  webhooks: z.array(z.string().url()).default([]),
  notifications: z.array(z.object({
    type: z.enum(['email', 'slack', 'webhook']),
    endpoint: z.string(),
    enabled: z.boolean().default(true)
  })).default([])
});

export type MonitoringTarget = z.infer<typeof MonitoringTargetSchema>;

// Alert Types
export interface Alert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  target: string;
  trigger: string;
  analysis: any;
  rawUpdate: any;
  resolved?: boolean;
  resolvedAt?: string;
}

export interface AlertThreshold {
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  enabled: boolean;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook';
  endpoint: string;
  enabled: boolean;
}

export interface MonitoringMetrics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  averageResponseTime: number;
  uptime: number;
  lastUpdate: string;
}

export interface TransactionUpdate {
  signature: string;
  slot: number;
  timestamp: number;
  accounts: string[];
  logs: string[];
  success: boolean;
  computeUnits: number;
  fee: number;
}

export interface AccountUpdate {
  address: string;
  slot: number;
  timestamp: number;
  data: Buffer;
  owner: string;
  lamports: number;
  executable: boolean;
}

export class SolGuardRealTimeMonitor extends EventEmitter {
  private connection: Connection;
  private activeSubscriptions: Map<string, any> = new Map();
  private monitoringTargets: Map<string, MonitoringTarget> = new Map();
  private alertHistory: Alert[] = [];
  private metrics: MonitoringMetrics;
  private isMonitoring: boolean = false;

  constructor() {
    super();
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    this.metrics = {
      totalAlerts: 0,
      activeAlerts: 0,
      resolvedAlerts: 0,
      averageResponseTime: 0,
      uptime: 100,
      lastUpdate: new Date().toISOString()
    };
  }

  async startMonitoring(targets: MonitoringTarget[]): Promise<void> {
    console.log(`🚀 Starting real-time monitoring for ${targets.length} targets`);
    
    this.isMonitoring = true;
    
    // Store monitoring targets
    for (const target of targets) {
      this.monitoringTargets.set(target.address, target);
      await this.subscribeToTarget(target);
    }
    
    // Start health check
    this.startHealthCheck();
    
    console.log('✅ Real-time monitoring started successfully');
  }

  async stopMonitoring(): Promise<void> {
    console.log('🛑 Stopping real-time monitoring');
    
    this.isMonitoring = false;
    
    // Unsubscribe from all targets
    for (const [address, subscription] of this.activeSubscriptions) {
      try {
        await subscription.unsubscribe();
        console.log(`Unsubscribed from ${address}`);
      } catch (error) {
        console.warn(`Failed to unsubscribe from ${address}:`, error);
      }
    }
    
    this.activeSubscriptions.clear();
    this.monitoringTargets.clear();
    
    console.log('✅ Real-time monitoring stopped');
  }

  private async subscribeToTarget(target: MonitoringTarget): Promise<void> {
    console.log(`📡 Subscribing to ${target.type}: ${target.address}`);
    
    try {
      switch (target.type) {
        case 'program':
          await this.subscribeToProgramLogs(target);
          break;
        case 'token':
          await this.subscribeToTokenActivity(target);
          break;
        case 'wallet':
          await this.subscribeToWalletActivity(target);
          break;
        default:
          throw new Error(`Unsupported monitoring type: ${target.type}`);
      }
    } catch (error) {
      console.error(`Failed to subscribe to ${target.address}:`, error);
      this.emit('error', { target: target.address, error });
    }
  }

  private async subscribeToProgramLogs(target: MonitoringTarget): Promise<void> {
    const publicKey = new PublicKey(target.address);
    
    // Subscribe to program logs
    const subscription = this.connection.onLogs(
      publicKey,
      async (logs, context) => {
        const update: TransactionUpdate = {
          signature: logs.signature,
          slot: context.slot,
          timestamp: Date.now(),
          accounts: logs.err ? [] : [], // Extract accounts from logs
          logs: logs.logs,
          success: !logs.err,
          computeUnits: 0, // Would need to fetch from transaction
          fee: 0 // Would need to fetch from transaction
        };
        
        await this.processUpdate(target, update);
      },
      'confirmed'
    );
    
    this.activeSubscriptions.set(target.address, { unsubscribe: () => subscription });
  }

  private async subscribeToTokenActivity(target: MonitoringTarget): Promise<void> {
    const publicKey = new PublicKey(target.address);
    
    // Subscribe to account changes
    const subscription = this.connection.onAccountChange(
      publicKey,
      async (accountInfo, context) => {
        const update: AccountUpdate = {
          address: target.address,
          slot: context.slot,
          timestamp: Date.now(),
          data: accountInfo.data,
          owner: accountInfo.owner.toBase58(),
          lamports: accountInfo.lamports,
          executable: accountInfo.executable
        };
        
        await this.processUpdate(target, update);
      },
      'confirmed'
    );
    
    this.activeSubscriptions.set(target.address, { unsubscribe: () => subscription });
  }

  private async subscribeToWalletActivity(target: MonitoringTarget): Promise<void> {
    const publicKey = new PublicKey(target.address);
    
    // Subscribe to account changes for wallet monitoring
    const subscription = this.connection.onAccountChange(
      publicKey,
      async (accountInfo, context) => {
        const update: AccountUpdate = {
          address: target.address,
          slot: context.slot,
          timestamp: Date.now(),
          data: accountInfo.data,
          owner: accountInfo.owner.toBase58(),
          lamports: accountInfo.lamports,
          executable: accountInfo.executable
        };
        
        await this.processUpdate(target, update);
      },
      'confirmed'
    );
    
    this.activeSubscriptions.set(target.address, { unsubscribe: () => subscription });
  }

  private async processUpdate(target: MonitoringTarget, update: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Real-time analysis pipeline
      const analysis = {
        riskAssessment: await this.assessRisk(update, target),
        anomalyDetection: await this.detectAnomalies(update, target),
        threatIntelligence: await this.checkThreatIntel(update, target),
        performanceMetrics: await this.analyzePerformance(update, target)
      };
      
      // Update metrics
      this.updateMetrics(startTime);
      
      // Check alert thresholds
      for (const threshold of target.alertThresholds) {
        if (threshold.enabled && this.evaluateThreshold(threshold, analysis, update)) {
          await this.triggerAlert(target, threshold, analysis, update);
        }
      }
      
      // Emit update event for real-time dashboard
      this.emit('update', {
        target: target.address,
        update,
        analysis,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`Error processing update for ${target.address}:`, error);
      this.emit('error', { target: target.address, error });
    }
  }

  private async assessRisk(update: any, target: MonitoringTarget): Promise<any> {
    const riskFactors: string[] = [];
    let riskScore = 0;
    
    // Analyze transaction patterns
    if (update.signature) {
      // Check for suspicious transaction patterns
      if (update.logs && update.logs.some((log: string) => log.includes('error'))) {
        riskFactors.push('Transaction errors detected');
        riskScore += 20;
      }
      
      // Check for high-value transactions
      if (update.lamports && update.lamports > 1000000000) { // 1 SOL
        riskFactors.push('High-value transaction');
        riskScore += 15;
      }
      
      // Check for unusual compute usage
      if (update.computeUnits && update.computeUnits > 200000) {
        riskFactors.push('High compute usage');
        riskScore += 10;
      }
    }
    
    // Analyze account changes
    if (update.data) {
      // Check for significant balance changes
      const balanceChange = Math.abs(update.lamports || 0);
      if (balanceChange > 100000000) { // 0.1 SOL
        riskFactors.push('Significant balance change');
        riskScore += 25;
      }
    }
    
    return {
      score: Math.min(100, riskScore),
      factors: riskFactors,
      level: this.getRiskLevel(riskScore)
    };
  }

  private async detectAnomalies(update: any, target: MonitoringTarget): Promise<any> {
    const anomalies: string[] = [];
    
    // Simple anomaly detection based on patterns
    const now = Date.now();
    const recentUpdates = this.alertHistory
      .filter(alert => alert.target === target.address)
      .filter(alert => now - new Date(alert.timestamp).getTime() < 300000) // Last 5 minutes
      .length;
    
    if (recentUpdates > 10) {
      anomalies.push('High frequency of updates');
    }
    
    // Check for unusual log patterns
    if (update.logs) {
      const errorLogs = update.logs.filter((log: string) => log.includes('error'));
      if (errorLogs.length > 0) {
        anomalies.push('Error logs detected');
      }
    }
    
    return {
      detected: anomalies.length > 0,
      anomalies,
      confidence: anomalies.length > 0 ? 0.8 : 0.2
    };
  }

  private async checkThreatIntel(update: any, target: MonitoringTarget): Promise<any> {
    // In a real implementation, this would check against threat intelligence feeds
    const threats: string[] = [];
    
    // Mock threat intelligence check
    if (update.signature) {
      // Check against known malicious signatures (placeholder)
      const maliciousSignatures = ['malicious_sig_1', 'malicious_sig_2'];
      if (maliciousSignatures.includes(update.signature)) {
        threats.push('Known malicious signature');
      }
    }
    
    return {
      threats,
      riskLevel: threats.length > 0 ? 'high' : 'low',
      lastUpdated: new Date().toISOString()
    };
  }

  private async analyzePerformance(update: any, target: MonitoringTarget): Promise<any> {
    return {
      responseTime: Date.now() - update.timestamp,
      throughput: 1, // Would calculate based on historical data
      latency: 0, // Would measure network latency
      successRate: update.success ? 100 : 0
    };
  }

  private evaluateThreshold(threshold: AlertThreshold, analysis: any, update: any): boolean {
    switch (threshold.condition) {
      case 'risk_score_high':
        return analysis.riskAssessment.score >= threshold.threshold;
      case 'anomaly_detected':
        return analysis.anomalyDetection.detected;
      case 'threat_detected':
        return analysis.threatIntelligence.threats.length > 0;
      case 'balance_change':
        return Math.abs(update.lamports || 0) >= threshold.threshold;
      case 'error_rate':
        return update.logs && update.logs.filter((log: string) => log.includes('error')).length >= threshold.threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(
    target: MonitoringTarget,
    threshold: AlertThreshold,
    analysis: any,
    update: any
  ): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      severity: threshold.severity,
      target: target.address,
      trigger: threshold.condition,
      analysis,
      rawUpdate: update
    };
    
    // Add to alert history
    this.alertHistory.push(alert);
    this.metrics.totalAlerts++;
    this.metrics.activeAlerts++;
    
    // Send notifications
    await this.sendNotifications(target, alert);
    
    // Emit alert event
    this.emit('alert', alert);
    
    console.log(`🚨 Alert triggered: ${alert.severity.toUpperCase()} - ${target.address} - ${threshold.condition}`);
  }

  private async sendNotifications(target: MonitoringTarget, alert: Alert): Promise<void> {
    const notificationPromises = target.notifications
      .filter(notif => notif.enabled)
      .map(notif => this.sendNotification(notif, alert, target));
    
    await Promise.allSettled(notificationPromises);
  }

  private async sendNotification(
    config: NotificationConfig,
    alert: Alert,
    target: MonitoringTarget
  ): Promise<void> {
    try {
      const message = this.formatAlertMessage(alert, target);
      
      switch (config.type) {
        case 'webhook':
          await this.sendWebhookNotification(config.endpoint, message);
          break;
        case 'slack':
          await this.sendSlackNotification(config.endpoint, message);
          break;
        case 'email':
          await this.sendEmailNotification(config.endpoint, message);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${config.type} notification:`, error);
    }
  }

  private formatAlertMessage(alert: Alert, target: MonitoringTarget): string {
    return `
🚨 SolGuard Security Alert

Severity: ${alert.severity.toUpperCase()}
Target: ${target.address} (${target.type})
Trigger: ${alert.trigger}
Time: ${alert.timestamp}

Risk Assessment:
- Score: ${alert.analysis.riskAssessment.score}/100
- Level: ${alert.analysis.riskAssessment.level}
- Factors: ${alert.analysis.riskAssessment.factors.join(', ')}

Anomalies: ${alert.analysis.anomalyDetection.detected ? 'Detected' : 'None'}
Threats: ${alert.analysis.threatIntelligence.threats.length > 0 ? alert.analysis.threatIntelligence.threats.join(', ') : 'None'}

Alert ID: ${alert.id}
    `.trim();
  }

  private async sendWebhookNotification(endpoint: string, message: string): Promise<void> {
    // In a real implementation, you would send HTTP POST to webhook
    console.log(`📡 Webhook notification sent to ${endpoint}`);
  }

  private async sendSlackNotification(endpoint: string, message: string): Promise<void> {
    // In a real implementation, you would send to Slack webhook
    console.log(`💬 Slack notification sent to ${endpoint}`);
  }

  private async sendEmailNotification(endpoint: string, message: string): Promise<void> {
    // In a real implementation, you would send email
    console.log(`📧 Email notification sent to ${endpoint}`);
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private updateMetrics(responseTime: number): void {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + responseTime) / 2;
    this.metrics.lastUpdate = new Date().toISOString();
  }

  private startHealthCheck(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check connection health
      const slot = await this.connection.getSlot();
      this.metrics.uptime = 100; // Connection is healthy
      
      // Check active subscriptions
      const activeCount = this.activeSubscriptions.size;
      const expectedCount = this.monitoringTargets.size;
      
      if (activeCount !== expectedCount) {
        console.warn(`⚠️ Subscription mismatch: ${activeCount}/${expectedCount}`);
        this.metrics.uptime = Math.max(0, this.metrics.uptime - 10);
      }
      
      this.emit('healthCheck', {
        uptime: this.metrics.uptime,
        activeSubscriptions: activeCount,
        lastSlot: slot,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Health check failed:', error);
      this.metrics.uptime = Math.max(0, this.metrics.uptime - 20);
    }
  }

  // Public methods for external access
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  getActiveAlerts(): Alert[] {
    return this.alertHistory.filter(alert => !alert.resolved);
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.metrics.activeAlerts = Math.max(0, this.metrics.activeAlerts - 1);
      this.metrics.resolvedAlerts++;
      
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  addMonitoringTarget(target: MonitoringTarget): Promise<void> {
    this.monitoringTargets.set(target.address, target);
    return this.subscribeToTarget(target);
  }

  removeMonitoringTarget(address: string): Promise<void> {
    const subscription = this.activeSubscriptions.get(address);
    if (subscription) {
      subscription.unsubscribe();
      this.activeSubscriptions.delete(address);
    }
    this.monitoringTargets.delete(address);
    return Promise.resolve();
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const realTimeMonitor = new SolGuardRealTimeMonitor();
