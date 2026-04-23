// lib/types.ts
// Shared TypeScript interfaces for FairSight

export interface BiasMetrics {
  demographic_parity: number
  equalized_odds: number
  calibration_gap: number
  individual_fairness: number
  group_accuracy?: Record<string, number>
  overall_accuracy?: number
  max_group_disparity?: number
  approval_rates?: Record<string, number>
  is_biased?: boolean
}

export interface Mitigation {
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  expected_improvement: string
}

export interface FlipTestPair {
  protected_attribute: string
  profile_a: { label: string; value: string; approval_rate: number }
  profile_b: { label: string; value: string; approval_rate: number }
  outcome_a: 'APPROVED' | 'REJECTED'
  outcome_b: 'APPROVED' | 'REJECTED'
  disparity: number
  approval_rate_a: number
  approval_rate_b: number
}

export interface FlipTest {
  flip_detected: boolean
  flip_count: number
  total_tests: number
  pairs: FlipTestPair[]
  interpretation: string
}

export interface FeatureImportance {
  top_features: { feature: string; importance: number }[]
  proxy_features: string[]
  root_cause: string
}

export interface AnalysisResult {
  dataset_hash: string
  metrics: {
    by_attribute: Record<string, BiasMetrics>
    fairness_score: number
    overall_verdict: 'GUILTY' | 'BORDERLINE' | 'CLEAR'
    bias_severity: 'HIGH' | 'MEDIUM' | 'LOW'
  }
  flip_test: FlipTest
  feature_importance: FeatureImportance
  row_count: number
  protected_attributes: string[]
  filename: string
}

export interface GeminiVerdict {
  summary: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  guilty_counts: { count: string; violation: string; description: string }[]
  root_cause: string
  affected_groups: string[]
  mitigations: Mitigation[]
  board_summary: string
}

export interface AuditRecord {
  id: string
  uid?: string
  error?: string
  filename: string
  verdict: 'GUILTY' | 'BORDERLINE' | 'CLEAR'
  fairnessScore: number
  aiVerdict: string
  rootCause: string
  synthesizedRootCause?: string
  boardSummary?: string
  severity?: string
  affectedGroups?: string[]
  proxyFeatures?: string[]
  mitigations?: Mitigation[]
  flipTest?: FlipTest | Record<string, any>
  byAttribute?: Record<string, any>
  protectedAttributes?: string[]
  protectedColumns?: string[]
  targetColumn?: string
  metrics?: {
    demographic_parity: number
    equalized_odds: number
    calibration_gap: number
    individual_fairness: number
  }
  datasetHash?: string
  rowCount?: number
  createdAt: number
  guiltyCounts?: { count: string; violation: string; description: string }[]
  aiVerdicts?: {
    gemini?: GeminiVerdict | null
    groq?: GeminiVerdict | null
    ollama?: GeminiVerdict | null
    huggingface?: GeminiVerdict | null
    mistral?: GeminiVerdict | null
  }
  aiLatencies?: {
    gemini: number
    groq: number
    ollama?: number
    huggingface?: number
    mistral?: number
  }
  consensusLevel?: 'strong' | 'partial' | 'split'
}

export interface LiveDecision {
  id: string
  model: string
  group: string
  outcome: 'APPROVED' | 'REJECTED'
  status: 'PASSED' | 'FLAGGED' | 'REVIEW'
  reason: string
  timestamp: number
  latency_ms: number
}
