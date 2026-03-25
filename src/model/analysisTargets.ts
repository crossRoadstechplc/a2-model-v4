import type { A2FleetWorkbookOutput, PeriodizedStatement } from '../engine/a2Fleet';
import { runA2FleetWorkbook } from '../engine/a2Fleet';
import type { IntegratedModelOutput } from '../engine/integrated';
import { runIntegratedModel } from '../engine/integrated';
import type { AssumptionValueMap } from './assumptions';
import type { DisplayFormat } from '../components/model/formatters';

export type KpiTargetDefinition = {
  id: string;
  label: string;
  format: DisplayFormat;
  module: 'fleet' | 'platform' | 'energy' | 'consolidated';
  description: string;
  trace: string[];
};

export type EvaluatedModelSet = {
  workbook: A2FleetWorkbookOutput;
  integrated: IntegratedModelOutput;
};

function getLastStatementValue(statement: PeriodizedStatement, key: string) {
  const row = statement.rows.find((item) => item.key === key);
  return row?.values[statement.periods.length - 1] ?? 0;
}

function getIntegratedKpi(output: IntegratedModelOutput, moduleKey: 'platform' | 'energy' | 'consolidated', id: string) {
  return output[moduleKey].kpis.find((item) => item.id === id)?.value ?? 0;
}

export const kpiTargetDefinitions: KpiTargetDefinition[] = [
  {
    id: 'fleet_revenue',
    label: 'Fleet Revenue',
    format: 'currencyM',
    module: 'fleet',
    description: 'A2 Fleet income statement revenue in the terminal period.',
    trace: ['Chargeable tonnes', 'Freight rate', 'Fleet revenue'],
  },
  {
    id: 'fleet_ebitda',
    label: 'Fleet EBITDA',
    format: 'currencyM',
    module: 'fleet',
    description: 'A2 Fleet EBITDA in the terminal period.',
    trace: ['Fleet revenue', 'Battery charge', 'Operating costs', 'Fleet EBITDA'],
  },
  {
    id: 'fleet_closing_cash',
    label: 'Fleet Closing Cash',
    format: 'currencyM',
    module: 'fleet',
    description: 'Fleet closing cash in the terminal period.',
    trace: ['Opening cash', 'Operating cash', 'Capex and financing', 'Closing cash'],
  },
  {
    id: 'investor_25_stake_value',
    label: 'Investor 25% Stake Value',
    format: 'currencyM',
    module: 'fleet',
    description: 'Fleet valuation summary stake value for a 25% investor.',
    trace: ['EBITDA / net income trajectory', 'Valuation summary', 'Investor stake value'],
  },
  {
    id: 'platform_revenue',
    label: 'Platform Revenue',
    format: 'currencyM',
    module: 'platform',
    description: 'Platform total revenue in the terminal period.',
    trace: ['Fleet throughput demand', 'Swap fees + subscriptions', 'External revenue share', 'Platform revenue'],
  },
  {
    id: 'platform_sites',
    label: 'Platform Sites',
    format: 'integer',
    module: 'platform',
    description: 'Required platform site count in the terminal period.',
    trace: ['Swap demand', 'Site capacity', 'Utilization target', 'Required sites'],
  },
  {
    id: 'energy_revenue',
    label: 'Energy Revenue',
    format: 'currencyM',
    module: 'energy',
    description: 'Energy revenue in the terminal period.',
    trace: ['Battery packs required', 'Lease income', 'Platform revenue share', 'Energy revenue'],
  },
  {
    id: 'energy_service_factor',
    label: 'Energy Service Factor',
    format: 'percent',
    module: 'energy',
    description: 'Converged energy service factor in the terminal period.',
    trace: ['Provision coverage', 'Replacement burden', 'Network uptime', 'Energy service factor'],
  },
  {
    id: 'consolidated_revenue',
    label: 'Consolidated Revenue',
    format: 'currencyM',
    module: 'consolidated',
    description: 'Consolidated scaffold revenue after eliminations.',
    trace: ['Fleet + Platform + Energy revenue', 'Internal flow eliminations', 'Consolidated revenue'],
  },
  {
    id: 'consolidated_ebitda_margin',
    label: 'Consolidated EBITDA Margin',
    format: 'percent',
    module: 'consolidated',
    description: 'Consolidated scaffold EBITDA margin in the terminal period.',
    trace: ['Consolidated revenue', 'Consolidated operating costs', 'EBITDA margin'],
  },
];

export const kpiTargetMap = new Map(
  kpiTargetDefinitions.map((item) => [item.id, item]),
);

export function evaluateModelSet(assumptions: AssumptionValueMap): EvaluatedModelSet {
  const workbook = runA2FleetWorkbook(assumptions);
  const integrated = runIntegratedModel(assumptions, workbook);

  return {
    workbook,
    integrated,
  };
}

export function getKpiTargetValue(
  id: string,
  outputs: EvaluatedModelSet,
) {
  switch (id) {
    case 'fleet_revenue':
      return getLastStatementValue(outputs.workbook.incomeStatement, 'revenue') / 1_000_000;
    case 'fleet_ebitda':
      return getLastStatementValue(outputs.workbook.incomeStatement, 'ebitda') / 1_000_000;
    case 'fleet_closing_cash':
      return getLastStatementValue(outputs.workbook.cashFlow, 'closing_cash') / 1_000_000;
    case 'investor_25_stake_value':
      return (
        getLastStatementValue(outputs.workbook.valuationSummary, 'investor_25_stake_value') /
        1_000_000
      );
    case 'platform_revenue':
      return getIntegratedKpi(outputs.integrated, 'platform', 'platform_revenue');
    case 'platform_sites':
      return getIntegratedKpi(outputs.integrated, 'platform', 'platform_sites');
    case 'energy_revenue':
      return getIntegratedKpi(outputs.integrated, 'energy', 'energy_revenue');
    case 'energy_service_factor':
      return getIntegratedKpi(outputs.integrated, 'energy', 'energy_service_factor');
    case 'consolidated_revenue':
      return getIntegratedKpi(outputs.integrated, 'consolidated', 'consolidated_revenue');
    case 'consolidated_ebitda_margin':
      return getIntegratedKpi(outputs.integrated, 'consolidated', 'consolidated_ebitda_margin');
    default:
      return 0;
  }
}
