import { workbookConstantCells, type WorkbookFormulaMap, type WorkbookSheetName } from './reference';
import { calculateIrr } from '../returns';

export type WorkbookSheetValues = Partial<Record<WorkbookSheetName, Record<string, number>>>;

type FormulaValue = number | number[];

type RefToken = {
  kind: 'ref';
  sheet: WorkbookSheetName;
  cell: string;
};

type NumberToken = {
  kind: 'number';
  value: number;
};

type FunctionToken = {
  kind: 'function';
  name: string;
};

type OperatorToken = {
  kind: 'operator';
  value: '+' | '-' | '*' | '/' | ':' | ',' | '(' | ')';
};

type Token = RefToken | NumberToken | FunctionToken | OperatorToken;

type WorkbookGetter = (sheet: WorkbookSheetName, cell: string) => number;

const SHEET_ALIASES: Record<string, WorkbookSheetName> = {
  ASSUMPTIONS_DATA: 'ASSUMPTIONS_DATA',
  'REVENUE PROJECTION': 'REVENUE PROJECTION',
  'CAPEX & DEPRECIATION': 'CAPEX & DEPRECIATION',
  'SOURCE_USE OF FUNDS': 'SOURCE_USE OF FUNDS',
  'INCOME STATEMENT': 'INCOME STATEMENT ',
  'INCOME STATEMENT ': 'INCOME STATEMENT ',
  'CASH FLOW': 'CASH FLOW',
  'BALANCE SHEET': 'BALANCE SHEET',
  'VALUATION SUMMARY': 'VALUATION SUMMARY',
  'KEY METRICS': 'KEY METRICS',
};

function normalizeSheetName(value: string): WorkbookSheetName {
  const normalized = SHEET_ALIASES[value];
  if (!normalized) {
    throw new Error(`Unknown workbook sheet reference: ${value}`);
  }

  return normalized;
}

function normalizeCell(value: string) {
  return value.replace(/\$/g, '');
}

function tokenizeFormula(
  formula: string,
  currentSheet: WorkbookSheetName,
): Token[] {
  const source = formula.startsWith('=') ? formula.slice(1) : formula;
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if ('+-*/:(),'.includes(char)) {
      tokens.push({
        kind: 'operator',
        value: char as OperatorToken['value'],
      });
      index += 1;
      continue;
    }

    if (char === "'") {
      const closingQuote = source.indexOf("'", index + 1);
      if (closingQuote === -1 || source[closingQuote + 1] !== '!') {
        throw new Error(`Unterminated sheet reference in formula: ${formula}`);
      }

      const sheet = normalizeSheetName(source.slice(index + 1, closingQuote));
      const refMatch = source.slice(closingQuote + 2).match(/^\$?[A-Z]+\$?\d+/);
      if (!refMatch) {
        throw new Error(`Expected cell after sheet reference in formula: ${formula}`);
      }

      tokens.push({
        kind: 'ref',
        sheet,
        cell: normalizeCell(refMatch[0]),
      });
      index = closingQuote + 2 + refMatch[0].length;
      continue;
    }

    const numberMatch = source.slice(index).match(/^\d+(?:\.\d+)?/);
    if (numberMatch) {
      tokens.push({
        kind: 'number',
        value: Number(numberMatch[0]),
      });
      index += numberMatch[0].length;
      continue;
    }

    const cellMatch = source.slice(index).match(/^\$?[A-Z]+\$?\d+/);
    if (cellMatch) {
      tokens.push({
        kind: 'ref',
        sheet: currentSheet,
        cell: normalizeCell(cellMatch[0]),
      });
      index += cellMatch[0].length;
      continue;
    }

    const functionMatch = source.slice(index).match(/^[A-Z_]+/);
    if (functionMatch) {
      tokens.push({
        kind: 'function',
        name: functionMatch[0],
      });
      index += functionMatch[0].length;
      continue;
    }

    throw new Error(`Unsupported token in formula "${formula}" at index ${index}`);
  }

  return tokens;
}

function toNumber(value: FormulaValue) {
  if (Array.isArray(value)) {
    throw new Error('Range values cannot be used directly in arithmetic expressions.');
  }

  return value;
}

function sumArgs(args: FormulaValue[]) {
  return args.reduce<number>((total, value) => {
    if (Array.isArray(value)) {
      return total + value.reduce((rangeTotal, item) => rangeTotal + item, 0);
    }

    return total + value;
  }, 0);
}

class FormulaParser {
  private cursor = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly getter: WorkbookGetter,
  ) {}

  parseExpression(): FormulaValue {
    let value = this.parseTerm();

    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = this.previousOperator();
      const right = this.parseTerm();
      value =
        operator === '+'
          ? toNumber(value) + toNumber(right)
          : toNumber(value) - toNumber(right);
    }

    return value;
  }

  private parseTerm(): FormulaValue {
    let value = this.parseFactor();

    while (this.matchOperator('*') || this.matchOperator('/')) {
      const operator = this.previousOperator();
      const right = this.parseFactor();
      value =
        operator === '*'
          ? toNumber(value) * toNumber(right)
          : toNumber(value) / toNumber(right);
    }

    return value;
  }

  private parseFactor(): FormulaValue {
    if (this.matchOperator('+')) {
      return this.parseFactor();
    }

    if (this.matchOperator('-')) {
      return -toNumber(this.parseFactor());
    }

    if (this.matchOperator('(')) {
      const value = this.parseExpression();
      this.consumeOperator(')');
      return value;
    }

    const token = this.peek();
    if (!token) {
      throw new Error('Unexpected end of formula.');
    }

    if (token.kind === 'number') {
      this.cursor += 1;
      return token.value;
    }

    if (token.kind === 'ref') {
      this.cursor += 1;
      if (this.matchOperator(':')) {
        const endToken = this.consumeRef();
        return expandRange(token, endToken).map((rangeRef) =>
          this.getter(rangeRef.sheet, rangeRef.cell),
        );
      }

      return this.getter(token.sheet, token.cell);
    }

    if (token.kind === 'function') {
      return this.parseFunction();
    }

    throw new Error(`Unexpected token while parsing formula: ${JSON.stringify(token)}`);
  }

  private parseFunction() {
    const token = this.tokens[this.cursor];
    if (!token || token.kind !== 'function') {
      throw new Error('Expected function token.');
    }

    this.cursor += 1;
    this.consumeOperator('(');

    const args: FormulaValue[] = [];
    if (!this.checkOperator(')')) {
      do {
        args.push(this.parseExpression());
      } while (this.matchOperator(','));
    }
    this.consumeOperator(')');

    switch (token.name) {
      case 'SUM':
        return sumArgs(args);
      case 'IRR': {
        const [cashflowsArg, guessArg] = args;
        const cashflows = Array.isArray(cashflowsArg)
          ? cashflowsArg
          : [toNumber(cashflowsArg)];
        return (
          calculateIrr(
          cashflows,
          guessArg === undefined ? 0.1 : toNumber(guessArg),
          ) ?? 0
        );
      }
      default:
        throw new Error(`Unsupported Excel function: ${token.name}`);
    }
  }

  private consumeRef() {
    const token = this.tokens[this.cursor];
    if (!token || token.kind !== 'ref') {
      throw new Error('Expected cell reference in range expression.');
    }

    this.cursor += 1;
    return token;
  }

  private consumeOperator(expected: OperatorToken['value']) {
    const token = this.tokens[this.cursor];
    if (!token || token.kind !== 'operator' || token.value !== expected) {
      throw new Error(`Expected "${expected}" in formula.`);
    }

    this.cursor += 1;
  }

  private checkOperator(expected: OperatorToken['value']) {
    const token = this.tokens[this.cursor];
    return token?.kind === 'operator' && token.value === expected;
  }

  private matchOperator(expected: OperatorToken['value']) {
    if (this.checkOperator(expected)) {
      this.cursor += 1;
      return true;
    }

    return false;
  }

  private previousOperator() {
    const token = this.tokens[this.cursor - 1];
    if (!token || token.kind !== 'operator') {
      throw new Error('Expected previous token to be an operator.');
    }

    return token.value;
  }

  private peek() {
    return this.tokens[this.cursor];
  }
}

function columnNameToNumber(column: string) {
  return column.split('').reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0);
}

function columnNumberToName(columnNumber: number) {
  let value = columnNumber;
  let column = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    value = Math.floor((value - 1) / 26);
  }

  return column;
}

function splitCell(cell: string) {
  const match = cell.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cell}`);
  }

  return {
    column: match[1],
    row: Number(match[2]),
  };
}

function expandRange(start: RefToken, end: RefToken) {
  if (start.sheet !== end.sheet) {
    throw new Error('Cross-sheet ranges are not supported by this workbook evaluator.');
  }

  const startRef = splitCell(start.cell);
  const endRef = splitCell(end.cell);
  const columnStart = Math.min(
    columnNameToNumber(startRef.column),
    columnNameToNumber(endRef.column),
  );
  const columnEnd = Math.max(
    columnNameToNumber(startRef.column),
    columnNameToNumber(endRef.column),
  );
  const rowStart = Math.min(startRef.row, endRef.row);
  const rowEnd = Math.max(startRef.row, endRef.row);

  const refs: RefToken[] = [];
  for (let row = rowStart; row <= rowEnd; row += 1) {
    for (let column = columnStart; column <= columnEnd; column += 1) {
      refs.push({
        kind: 'ref',
        sheet: start.sheet,
        cell: `${columnNumberToName(column)}${row}`,
      });
    }
  }

  return refs;
}

export function evaluateFormula(
  formula: string,
  currentSheet: WorkbookSheetName,
  getter: WorkbookGetter,
) {
  const parser = new FormulaParser(tokenizeFormula(formula, currentSheet), getter);
  return toNumber(parser.parseExpression());
}

export function createWorkbookCellGetter(
  formulaMap: WorkbookFormulaMap,
  seedValues: WorkbookSheetValues = {},
) {
  const cache: WorkbookSheetValues = Object.fromEntries(
    Object.entries(seedValues).map(([sheet, values]) => [sheet, { ...values }]),
  ) as WorkbookSheetValues;
  const inProgress = new Set<string>();

  const getter: WorkbookGetter = (sheet, cell) => {
    const normalizedCell = normalizeCell(cell);
    const key = `${sheet}!${normalizedCell}`;
    const cachedValue = cache[sheet]?.[normalizedCell];
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    if (workbookConstantCells[key] !== undefined) {
      cache[sheet] ??= {};
      cache[sheet][normalizedCell] = workbookConstantCells[key];
      return workbookConstantCells[key];
    }

    const formulaSpec = formulaMap[sheet]?.[normalizedCell];
    if (!formulaSpec) {
      cache[sheet] ??= {};
      cache[sheet][normalizedCell] = 0;
      return 0;
    }

    if (inProgress.has(key)) {
      throw new Error(`Circular workbook reference detected at ${key}`);
    }

    inProgress.add(key);
    const value = evaluateFormula(formulaSpec.formula, sheet, getter);
    inProgress.delete(key);

    cache[sheet] ??= {};
    cache[sheet][normalizedCell] = value;
    return value;
  };

  return {
    getCellValue: getter,
    getSheetSnapshot(sheet: WorkbookSheetName) {
      return { ...(cache[sheet] ?? {}) };
    },
    getWorkbookSnapshot() {
      return Object.fromEntries(
        Object.entries(cache).map(([sheet, values]) => [sheet, { ...values }]),
      ) as WorkbookSheetValues;
    },
  };
}
