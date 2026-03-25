import type { A2FleetWorkbookOutput, PeriodizedStatement } from '../a2Fleet';
import type { PlatformCapacityOutput } from '../platformCapacity';
import type { EntityReturnsSummary } from '../returns';

export type ConvergenceIterationDiagnostics = {
  iteration: number;
  serviceFactor: number;
  platformSites: number;
  batteryPacks: number;
  replacementRate: number;
  maxDelta: number;
};

export type ConvergenceDiagnostics = {
  status: 'converged' | 'max_iterations' | 'manual_override';
  iterations: number;
  tolerance: number;
  maxDelta: number;
  history: ConvergenceIterationDiagnostics[];
  usedOverrides: string[];
};

export type PlatformOutput = {
  periods: string[];
  capacity: PlatformCapacityOutput;
  operations: PeriodizedStatement;
  incomeStatement: PeriodizedStatement;
  capexDepreciation: PeriodizedStatement;
  returnsSummary: EntityReturnsSummary;
  kpis: Array<{
    id: string;
    label: string;
    value: number;
    format: 'currencyM' | 'percent' | 'number' | 'multiple';
    description: string;
  }>;
};

export type EnergyOutput = {
  periods: string[];
  operations: PeriodizedStatement;
  incomeStatement: PeriodizedStatement;
  capexDepreciation: PeriodizedStatement;
  returnsSummary: EntityReturnsSummary;
  kpis: Array<{
    id: string;
    label: string;
    value: number;
    format: 'currencyM' | 'percent' | 'number' | 'multiple';
    description: string;
  }>;
};

export type IntercompanyFlowOutput = {
  periods: string[];
  statement: PeriodizedStatement;
  fleetToPlatformFees: number[];
  platformToEnergyLease: number[];
  platformToEnergyRevenueShare: number[];
};

export type ConsolidatedElimination = {
  id: string;
  source: 'fleet' | 'platform' | 'energy';
  target: 'fleet' | 'platform' | 'energy';
  label: string;
  periods: string[];
  amounts: number[];
  revenueLine: string;
  expenseLine: string;
};

export type ConsolidatedOutput = {
  periods: string[];
  eliminations: ConsolidatedElimination[];
  incomeStatement: PeriodizedStatement;
  cashFlow: PeriodizedStatement;
  balanceSheet: PeriodizedStatement;
  returnsSummary: EntityReturnsSummary;
  kpis: Array<{
    id: string;
    label: string;
    value: number;
    format: 'currencyM' | 'percent' | 'number' | 'multiple';
    description: string;
  }>;
};

export type IntegratedModelOutput = {
  fleet: A2FleetWorkbookOutput;
  platform: PlatformOutput;
  energy: EnergyOutput;
  intercompany: IntercompanyFlowOutput;
  convergence: ConvergenceDiagnostics;
  consolidated: ConsolidatedOutput;
};

export type IntegratedModelOptions = {
  manualOverrides?: Partial<{
    serviceFactor: number;
    replacementRate: number;
    maxIterations: number;
  }>;
  tolerance?: number;
  maxIterations?: number;
};
