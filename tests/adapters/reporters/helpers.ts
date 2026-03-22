import { RiskLevel } from "../../../src/domain/types.js";
import { PRESETS } from "../../../src/domain/threshold.js";
import type {
  AnalysisResult,
  AnalysisSummary,
  CrapScore,
  FunctionIdentity,
  FunctionVerdict,
  RiskDistribution,
  ThresholdConfig,
} from "../../../src/domain/types.js";

export function makeIdentity(
  filePath: string,
  name: string,
  startLine = 1,
): FunctionIdentity {
  return {
    filePath,
    qualifiedName: name,
    span: { startLine, startColumn: 0, endLine: startLine + 9, endColumn: 0 },
  };
}

export function makeScore(value: number): CrapScore {
  let riskLevel: RiskLevel;
  if (value <= 5) riskLevel = RiskLevel.Low;
  else if (value <= 8) riskLevel = RiskLevel.Acceptable;
  else if (value <= 30) riskLevel = RiskLevel.Moderate;
  else riskLevel = RiskLevel.High;
  return { value, riskLevel };
}

export function makeVerdict(
  filePath: string,
  name: string,
  cc: number,
  covPct: number,
  crapValue: number,
  threshold: number,
  startLine = 1,
): FunctionVerdict {
  return {
    scored: {
      identity: makeIdentity(filePath, name, startLine),
      cyclomaticComplexity: cc,
      coveragePercent: covPct,
      crap: makeScore(crapValue),
      contributors: [],
    },
    threshold,
    exceeds: crapValue > threshold,
  };
}

export function makeDistribution(
  low = 0,
  acceptable = 0,
  moderate = 0,
  high = 0,
): RiskDistribution {
  return {
    [RiskLevel.Low]: low,
    [RiskLevel.Acceptable]: acceptable,
    [RiskLevel.Moderate]: moderate,
    [RiskLevel.High]: high,
  };
}

export function makeSummary(
  overrides: Partial<AnalysisSummary> = {},
): AnalysisSummary {
  return {
    totalFunctions: 0,
    totalFiles: 0,
    exceedingThreshold: 0,
    exceedingPercent: 0,
    averageCrap: 0,
    medianCrap: 0,
    maxCrap: makeScore(0),
    worstFunction: null,
    distribution: makeDistribution(),
    crapLoad: 0,
    ...overrides,
  };
}

export function makeResult(
  functions: FunctionVerdict[],
  summary: AnalysisSummary,
  passed: boolean,
  threshold = PRESETS.default,
  overrides: ThresholdConfig["overrides"] = [],
): AnalysisResult {
  return {
    functions,
    unmatched: [],
    warnings: [],
    summary,
    thresholdConfig: { defaultThreshold: threshold, overrides } satisfies ThresholdConfig,
    passed,
  };
}
