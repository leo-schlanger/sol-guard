import React from 'react'
import { cn } from '../utils/cn'
import { Progress } from './Progress'
import { Badge } from './Badge'
import { type RiskLevel } from '@sol-guard/types'

interface RiskScoreProps {
  score: number
  level: RiskLevel
  showBreakdown?: boolean
  breakdown?: {
    staticAnalysis: number
    dynamicAnalysis: number
    onChainAnalysis: number
  }
  className?: string
}

const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case 'low':
      return 'bg-risk-low'
    case 'medium':
      return 'bg-risk-medium'
    case 'high':
      return 'bg-risk-high'
    case 'critical':
      return 'bg-risk-critical'
    default:
      return 'bg-gray-500'
  }
}

const getRiskLabel = (level: RiskLevel) => {
  switch (level) {
    case 'low':
      return 'Low Risk'
    case 'medium':
      return 'Medium Risk'
    case 'high':
      return 'High Risk'
    case 'critical':
      return 'Critical Risk'
    default:
      return 'Unknown'
  }
}

export const RiskScore: React.FC<RiskScoreProps> = ({
  score,
  level,
  showBreakdown = false,
  breakdown,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Score Display */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-gray-200 flex items-center justify-center">
            <span className="text-2xl font-bold">{score}</span>
          </div>
          <div
            className={cn(
              'absolute inset-0 rounded-full border-4 opacity-20',
              getRiskColor(level)
            )}
          />
        </div>
        <div>
          <Badge variant={level} className="mb-2">
            {getRiskLabel(level)}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Risk Score: {score}/100
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={score} className="h-2" />

      {/* Breakdown */}
      {showBreakdown && breakdown && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Score Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Static Analysis</span>
              <span>{breakdown.staticAnalysis}/100</span>
            </div>
            <Progress value={breakdown.staticAnalysis} className="h-1" />
            
            <div className="flex justify-between text-sm">
              <span>Dynamic Analysis</span>
              <span>{breakdown.dynamicAnalysis}/100</span>
            </div>
            <Progress value={breakdown.dynamicAnalysis} className="h-1" />
            
            <div className="flex justify-between text-sm">
              <span>On-Chain Analysis</span>
              <span>{breakdown.onChainAnalysis}/100</span>
            </div>
            <Progress value={breakdown.onChainAnalysis} className="h-1" />
          </div>
        </div>
      )}
    </div>
  )
}
