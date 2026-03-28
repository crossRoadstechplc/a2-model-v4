# IRR Refactor Plan

This note captures the current IRR entry points before the refactor starts.

## Existing IRR entry points

1. `src/engine/returns.ts`
   - Shared numerical solver in `calculateIrr`.
   - Shared returns summary builders in `buildComputedReturnsSummary` and `buildPendingReturnsSummary`.

2. `src/engine/a2Fleet/formula.ts`
   - Workbook formula evaluator supports Excel-style `IRR(...)`.
   - Current workbook replication can therefore compute literal workbook IRR cells.

3. `src/engine/a2Fleet/stages.ts`
   - Fleet returns surface is assembled in `buildFleetReturnsSummary`.
   - Current logic mixes workbook-adjacent equity IRR with app-modeled project IRR.

4. `src/engine/integrated/platform.ts`
   - Platform returns are currently built from a first-pass modeled cash flow basis.

5. `src/engine/integrated/energy.ts`
   - Energy returns are currently built from a first-pass modeled cash flow basis.

6. `src/engine/integrated/index.ts`
   - Consolidated returns are currently built from a first-pass modeled consolidated cash flow basis.

7. `src/components/model/ReturnsMetricGrid.tsx`
   - UI surface for all returns metrics cards and pending states.

8. Validation and tests
   - `src/model/validation.ts` validates workbook baseline outputs, but not full IRR parity yet.
   - `src/engine/__tests__/returns.test.ts`
   - `src/engine/a2Fleet/__tests__/stages.test.ts`
   - `src/components/model/__tests__/A2FleetDashboard.test.tsx`
   - `src/components/model/__tests__/IntegratedDashboard.test.tsx`
   - `src/components/model/__tests__/ReturnsMetricGrid.test.tsx`

## Refactor direction

1. Keep the solver and harden it with explicit edge-case tests.
2. Split workbook-faithful Fleet equity IRR from generalized modeled IRRs.
3. Define explicit project and equity cash flow builders per entity.
4. Require consolidated returns to use elimination-aware cash flow series.
5. Keep IRR out of statement rows and only in returns metrics surfaces.
