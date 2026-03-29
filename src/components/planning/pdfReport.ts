import {
  assumptionGroups,
  assumptionMetadata,
  formatAssumptionValue,
  type AssumptionValueMap,
} from '../../model/assumptions';
import { getDisplayUnit, type DisplayCurrency } from '../../model/displayCurrency';
import type { A2FleetWorkbookOutput, PeriodizedStatement } from '../../engine/a2Fleet';
import type { IntegratedModelOutput } from '../../engine/integrated';
import {
  formatDisplayValue,
  formatStatementValue,
  type DisplayFormat,
} from '../model/formatters';

type ExportMetric = {
  label: string;
  value: number;
  format: 'currencyM' | 'percent' | 'number' | 'multiple';
};

type ChartSeries = {
  label: string;
  values: number[];
  format: DisplayFormat;
  color: [number, number, number];
};

type PdfReportParams = {
  generatedAt: string;
  lastCalculatedAt: string;
  scenarioName: string;
  validationGate: string;
  validationVerdict: string;
  displayCurrency: DisplayCurrency;
  fxRate: number;
  assumptions: AssumptionValueMap;
  workbook: A2FleetWorkbookOutput;
  integrated: IntegratedModelOutput;
  results: ExportMetric[];
  platformKpis: ExportMetric[];
  energyKpis: ExportMetric[];
  consolidatedKpis: ExportMetric[];
};

const PAGE = {
  width: 842,
  height: 595,
  marginX: 34,
  marginTop: 34,
  marginBottom: 30,
} as const;

const COLORS = {
  text: [0.09, 0.16, 0.27] as [number, number, number],
  subtle: [0.39, 0.46, 0.56] as [number, number, number],
  accent: [0.13, 0.36, 0.69] as [number, number, number],
  success: [0.16, 0.55, 0.33] as [number, number, number],
  warning: [0.83, 0.49, 0.16] as [number, number, number],
  border: [0.82, 0.86, 0.91] as [number, number, number],
  panel: [0.95, 0.97, 0.99] as [number, number, number],
} as const;

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function bytesLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function colorFill(color: [number, number, number]) {
  return `${color[0]} ${color[1]} ${color[2]} rg`;
}

function colorStroke(color: [number, number, number]) {
  return `${color[0]} ${color[1]} ${color[2]} RG`;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function wrapText(text: string, width: number, fontSize: number) {
  const maxChars = Math.max(10, Math.floor(width / (fontSize * 0.53)));
  if (text.length <= maxChars) {
    return [text];
  }

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      return;
    }

    current = next;
  });

  if (current) {
    lines.push(current);
  }

  return lines;
}

function getStatementRow(statement: PeriodizedStatement, key: string) {
  return statement.rows.find((row) => row.key === key)?.values ?? [];
}

class PdfDocumentBuilder {
  private pages: string[][] = [[]];
  private pageIndex = 0;
  private currentY = PAGE.height - PAGE.marginTop;

  private get commands() {
    return this.pages[this.pageIndex] as string[];
  }

  private addCommand(command: string) {
    this.commands.push(command);
  }

  private addText(
    text: string,
    x: number,
    y: number,
    options: {
      font?: 'F1' | 'F2' | 'F3';
      size?: number;
      color?: [number, number, number];
    } = {},
  ) {
    this.addCommand('BT');
    this.addCommand(`/${options.font ?? 'F1'} ${options.size ?? 10} Tf`);
    this.addCommand(colorFill(options.color ?? COLORS.text));
    this.addCommand(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
    this.addCommand(`(${escapePdfText(text)}) Tj`);
    this.addCommand('ET');
  }

  private drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fill?: [number, number, number];
      stroke?: [number, number, number];
      lineWidth?: number;
    } = {},
  ) {
    if (options.fill) {
      this.addCommand(colorFill(options.fill));
      this.addCommand(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
    }

    if (options.stroke) {
      this.addCommand(colorStroke(options.stroke));
      this.addCommand(`${options.lineWidth ?? 0.8} w`);
      this.addCommand(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
    }
  }

  private drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: {
      color?: [number, number, number];
      lineWidth?: number;
    } = {},
  ) {
    this.addCommand(colorStroke(options.color ?? COLORS.border));
    this.addCommand(`${options.lineWidth ?? 0.8} w`);
    this.addCommand(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  private drawPolyline(
    points: Array<{ x: number; y: number }>,
    color: [number, number, number],
    lineWidth = 1.8,
  ) {
    if (points.length === 0) {
      return;
    }

    this.addCommand(colorStroke(color));
    this.addCommand(`${lineWidth} w`);
    const [firstPoint, ...rest] = points;
    this.addCommand(`${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)} m`);
    rest.forEach((point) => {
      this.addCommand(`${point.x.toFixed(2)} ${point.y.toFixed(2)} l`);
    });
    this.addCommand('S');
  }

  private drawCircle(
    x: number,
    y: number,
    radius: number,
    color: [number, number, number],
  ) {
    const handle = radius * 0.5522847498;

    this.addCommand(colorFill(color));
    this.addCommand(`${x.toFixed(2)} ${(y + radius).toFixed(2)} m`);
    this.addCommand(
      `${(x + handle).toFixed(2)} ${(y + radius).toFixed(2)} ${(x + radius).toFixed(2)} ${(y + handle).toFixed(2)} ${(x + radius).toFixed(2)} ${y.toFixed(2)} c`,
    );
    this.addCommand(
      `${(x + radius).toFixed(2)} ${(y - handle).toFixed(2)} ${(x + handle).toFixed(2)} ${(y - radius).toFixed(2)} ${x.toFixed(2)} ${(y - radius).toFixed(2)} c`,
    );
    this.addCommand(
      `${(x - handle).toFixed(2)} ${(y - radius).toFixed(2)} ${(x - radius).toFixed(2)} ${(y - handle).toFixed(2)} ${(x - radius).toFixed(2)} ${y.toFixed(2)} c`,
    );
    this.addCommand(
      `${(x - radius).toFixed(2)} ${(y + handle).toFixed(2)} ${(x - handle).toFixed(2)} ${(y + radius).toFixed(2)} ${x.toFixed(2)} ${(y + radius).toFixed(2)} c`,
    );
    this.addCommand('f');
  }

  private addPage() {
    this.pages.push([]);
    this.pageIndex += 1;
    this.currentY = PAGE.height - PAGE.marginTop;
  }

  private ensureSpace(height: number) {
    if (this.currentY - height < PAGE.marginBottom) {
      this.addPage();
    }
  }

  addParagraph(
    text: string,
    options: {
      x?: number;
      width?: number;
      size?: number;
      color?: [number, number, number];
      font?: 'F1' | 'F2' | 'F3';
      lineHeight?: number;
      marginBottom?: number;
    } = {},
  ) {
    const x = options.x ?? PAGE.marginX;
    const width = options.width ?? PAGE.width - PAGE.marginX * 2;
    const fontSize = options.size ?? 10;
    const lineHeight = options.lineHeight ?? fontSize + 3;
    const lines = wrapText(text, width, fontSize);

    this.ensureSpace(lines.length * lineHeight + (options.marginBottom ?? 4));

    lines.forEach((line) => {
      this.addText(line, x, this.currentY, {
        font: options.font,
        size: fontSize,
        color: options.color,
      });
      this.currentY -= lineHeight;
    });

    this.currentY -= options.marginBottom ?? 4;
  }

  addSectionTitle(title: string, description?: string) {
    this.ensureSpace(44);
    this.addText(title, PAGE.marginX, this.currentY, {
      font: 'F2',
      size: 18,
      color: COLORS.text,
    });
    this.currentY -= 22;

    if (description) {
      this.addParagraph(description, {
        color: COLORS.subtle,
        size: 10,
        marginBottom: 8,
      });
    } else {
      this.currentY -= 6;
    }
  }

  addMetricGrid(
    title: string,
    items: ExportMetric[],
    options: {
      displayCurrency: DisplayCurrency;
      fxRate: number;
    },
  ) {
    this.addSectionTitle(title);
    const availableWidth = PAGE.width - PAGE.marginX * 2;
    const columns = 2;
    const gap = 12;
    const cardWidth = (availableWidth - gap) / columns;
    const cardHeight = 62;

    for (let index = 0; index < items.length; index += columns) {
      const rowItems = items.slice(index, index + columns);
      this.ensureSpace(cardHeight + 14);
      const topY = this.currentY;

      rowItems.forEach((item, itemIndex) => {
        const x = PAGE.marginX + itemIndex * (cardWidth + gap);
        const y = topY - cardHeight;

        this.drawRect(x, y, cardWidth, cardHeight, {
          fill: COLORS.panel,
          stroke: COLORS.border,
        });
        this.addText(item.label, x + 12, topY - 18, {
          font: 'F2',
          size: 9,
          color: COLORS.subtle,
        });
        this.addText(
          formatDisplayValue(item.value, item.format, options),
          x + 12,
          topY - 40,
          {
            font: 'F2',
            size: 16,
            color: COLORS.text,
          },
        );
      });

      this.currentY -= cardHeight + 14;
    }
  }

  addTable(params: {
    title: string;
    description?: string;
    headers: string[];
    rows: string[][];
    columnWidths: number[];
    fontSize?: number;
  }) {
    const fontSize = params.fontSize ?? 8.2;
    const lineHeight = fontSize + 2;
    const cellPaddingX = 6;
    const cellPaddingY = 5;
    const tableX = PAGE.marginX;
    const renderTableHeader = (continued = false) => {
      this.ensureSpace(54);

      this.addText(continued ? `${params.title} (continued)` : params.title, tableX, this.currentY, {
        font: 'F2',
        size: 14,
        color: COLORS.text,
      });
      this.currentY -= 18;

      if (!continued && params.description) {
        this.addParagraph(params.description, {
          x: tableX,
          width: params.columnWidths.reduce((sum, width) => sum + width, 0),
          size: 9,
          color: COLORS.subtle,
          marginBottom: 6,
        });
      }

      const headerHeight = 22;
      const headerY = this.currentY - headerHeight;

      let currentX = tableX;
      params.headers.forEach((header, index) => {
        this.drawRect(currentX, headerY, params.columnWidths[index] ?? 0, headerHeight, {
          fill: COLORS.panel,
          stroke: COLORS.border,
        });
        this.addText(header, currentX + cellPaddingX, headerY + 7, {
          font: 'F2',
          size: 8,
          color: COLORS.subtle,
        });
        currentX += params.columnWidths[index] ?? 0;
      });

      this.currentY = headerY - 2;
    };

    renderTableHeader(false);

    params.rows.forEach((row) => {
      const wrappedCells = row.map((cell, index) =>
        wrapText(cell, (params.columnWidths[index] ?? 0) - cellPaddingX * 2, fontSize),
      );
      const rowLineCount = wrappedCells.reduce(
        (maximum, lines) => Math.max(maximum, lines.length),
        1,
      );
      const rowHeight = rowLineCount * lineHeight + cellPaddingY * 2;

      if (this.currentY - rowHeight < PAGE.marginBottom) {
        this.addPage();
        renderTableHeader(true);
      }

      const rowTop = this.currentY;
      const rowBottom = rowTop - rowHeight;
      let currentX = tableX;

      row.forEach((_, index) => {
        const width = params.columnWidths[index] ?? 0;
        this.drawRect(currentX, rowBottom, width, rowHeight, {
          stroke: COLORS.border,
        });

        wrappedCells[index]?.forEach((line, lineIndex) => {
          this.addText(line, currentX + cellPaddingX, rowTop - cellPaddingY - 2 - lineIndex * lineHeight, {
            font: index === 0 ? 'F1' : 'F3',
            size: fontSize,
            color: COLORS.text,
          });
        });

        currentX += width;
      });

      this.currentY = rowBottom;
    });

    this.currentY -= 12;
  }

  addLineChart(params: {
    title: string;
    description?: string;
    periods: string[];
    series: ChartSeries[];
    displayCurrency: DisplayCurrency;
    fxRate: number;
  }) {
    const chartHeight = 228;
    const chartWidth = PAGE.width - PAGE.marginX * 2;
    const plotX = PAGE.marginX + 56;
    const plotWidth = chartWidth - 92;
    const plotHeight = 128;

    this.ensureSpace(chartHeight);
    this.addText(params.title, PAGE.marginX, this.currentY, {
      font: 'F2',
      size: 14,
      color: COLORS.text,
    });
    this.currentY -= 18;

    if (params.description) {
      this.addParagraph(params.description, {
        x: PAGE.marginX,
        width: chartWidth,
        size: 9,
        color: COLORS.subtle,
        marginBottom: 6,
      });
    }

    const chartTop = this.currentY;
    const chartBottom = chartTop - chartHeight + 46;

    this.drawRect(PAGE.marginX, chartBottom, chartWidth, chartHeight - 46, {
      fill: COLORS.panel,
      stroke: COLORS.border,
    });

    const allValues = params.series.flatMap((item) => item.values);
    const minValue = Math.min(...allValues, 0);
    const maxValue = Math.max(...allValues, 1);
    const range = maxValue - minValue || 1;
    const ticks = [0, 0.5, 1].map((step) => minValue + range * step);

    ticks.forEach((tick) => {
      const normalized = (tick - minValue) / range;
      const y = chartBottom + 34 + normalized * plotHeight;
      this.drawLine(plotX, y, plotX + plotWidth, y, {
        color: COLORS.border,
        lineWidth: 0.7,
      });
      this.addText(
        formatDisplayValue(tick, params.series[0]?.format ?? 'number', {
          displayCurrency: params.displayCurrency,
          fxRate: params.fxRate,
        }),
        PAGE.marginX + 2,
        y - 3,
        {
          font: 'F1',
          size: 8,
          color: COLORS.subtle,
        },
      );
    });

    this.drawLine(plotX, chartBottom + 34, plotX, chartBottom + 34 + plotHeight, {
      color: COLORS.subtle,
      lineWidth: 0.9,
    });
    this.drawLine(
      plotX,
      chartBottom + 34,
      plotX + plotWidth,
      chartBottom + 34,
      {
        color: COLORS.subtle,
        lineWidth: 0.9,
      },
    );

    const periodStep =
      params.periods.length > 1 ? plotWidth / (params.periods.length - 1) : plotWidth;

    params.periods.forEach((period, index) => {
      if (
        params.periods.length > 7 &&
        index % 2 !== 0 &&
        index !== params.periods.length - 1
      ) {
        return;
      }

      const x = plotX + periodStep * index;
      this.drawLine(x, chartBottom + 34, x, chartBottom + 28, {
        color: COLORS.subtle,
        lineWidth: 0.8,
      });
      this.addText(period, x - 10, chartBottom + 14, {
        font: 'F1',
        size: 7.5,
        color: COLORS.subtle,
      });
    });

    params.series.forEach((series, seriesIndex) => {
      const points = series.values.map((value, index) => {
        const x = plotX + periodStep * index;
        const normalized = (value - minValue) / range;
        const y = chartBottom + 34 + normalized * plotHeight;
        return { x, y };
      });

      this.drawPolyline(points, series.color, 2);
      points.forEach((point) => this.drawCircle(point.x, point.y, 2.2, series.color));

      const legendX = PAGE.marginX + 14 + seriesIndex * 180;
      this.drawRect(legendX, chartTop - 12, 8, 8, {
        fill: series.color,
      });
      this.addText(series.label, legendX + 14, chartTop - 10, {
        font: 'F1',
        size: 8.5,
        color: COLORS.text,
      });
    });

    this.currentY = chartBottom - 14;
  }

  build() {
    const fontIds = {
      F1: 3 + this.pages.length * 2,
      F2: 4 + this.pages.length * 2,
      F3: 5 + this.pages.length * 2,
    };
    const objects: Array<{ id: number; body: string }> = [
      { id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
      {
        id: 2,
        body: `<< /Type /Pages /Count ${this.pages.length} /Kids [${this.pages
          .map((_, index) => `${3 + index * 2} 0 R`)
          .join(' ')}] >>`,
      },
    ];

    this.pages.forEach((pageCommands, index) => {
      const pageObjectId = 3 + index * 2;
      const contentObjectId = pageObjectId + 1;
      const content = pageCommands.join('\n');

      objects.push({
        id: pageObjectId,
        body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /Font << /F1 ${fontIds.F1} 0 R /F2 ${fontIds.F2} 0 R /F3 ${fontIds.F3} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      });
      objects.push({
        id: contentObjectId,
        body: `<< /Length ${bytesLength(content)} >>\nstream\n${content}\nendstream`,
      });
    });

    objects.push({
      id: fontIds.F1,
      body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    });
    objects.push({
      id: fontIds.F2,
      body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    });
    objects.push({
      id: fontIds.F3,
      body: '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
    });

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];

    objects.forEach((object) => {
      offsets[object.id] = bytesLength(pdf);
      pdf += `${object.id} 0 obj\n${object.body}\nendobj\n`;
    });

    const xrefOffset = bytesLength(pdf);
    const lastObjectId = fontIds.F3;

    pdf += `xref\n0 ${lastObjectId + 1}\n`;
    pdf += '0000000000 65535 f \n';

    for (let id = 1; id <= lastObjectId; id += 1) {
      const offset = offsets[id] ?? 0;
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${lastObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return pdf;
  }
}

function buildAssumptionRows(
  assumptions: AssumptionValueMap,
  options: {
    displayCurrency: DisplayCurrency;
    fxRate: number;
  },
) {
  const groupTitleById = Object.fromEntries(
    assumptionGroups.map((group) => [group.id, group.title]),
  ) as Record<string, string>;

  return assumptionMetadata
    .filter((item) => !item.hiddenInUi)
    .map((item) => [
      groupTitleById[item.groupId] ?? item.groupId,
      item.label,
      formatAssumptionValue(item, assumptions[item.key] ?? item.baseValue, options),
    ]);
}

function buildStatementRows(
  statement: PeriodizedStatement,
  options: {
    displayCurrency: DisplayCurrency;
    fxRate: number;
  },
) {
  return statement.rows.map((row) => [
    `${row.label} [${getDisplayUnit(row.unit, options.displayCurrency)}]`,
    ...row.values.map((value) =>
      formatStatementValue(value, row.unit, {
        displayCurrency: options.displayCurrency,
        fxRate: options.fxRate,
      }),
    ),
  ]);
}

function buildChartSeries(params: {
  label: string;
  values: number[];
  format: DisplayFormat;
  color: [number, number, number];
}) {
  return params;
}

function buildDetailedPdf(params: PdfReportParams) {
  const builder = new PdfDocumentBuilder();
  const assumptionRows = buildAssumptionRows(params.assumptions, {
    displayCurrency: params.displayCurrency,
    fxRate: params.fxRate,
  });

  builder.addSectionTitle('A2 Charging Platform Detailed Report');
  builder.addParagraph(`Scenario: ${params.scenarioName}`, {
    font: 'F2',
    size: 10,
    marginBottom: 2,
  });
  builder.addParagraph(`Generated at: ${params.generatedAt}`, {
    color: COLORS.subtle,
    size: 9,
    marginBottom: 1,
  });
  builder.addParagraph(`Last calculated at: ${params.lastCalculatedAt}`, {
    color: COLORS.subtle,
    size: 9,
    marginBottom: 1,
  });
  builder.addParagraph(`Validation gate: ${params.validationGate.toUpperCase()}`, {
    color: COLORS.subtle,
    size: 9,
    marginBottom: 8,
  });
  builder.addParagraph(params.validationVerdict, {
    size: 10,
    color: COLORS.text,
    marginBottom: 14,
  });
  builder.addMetricGrid('Fleet headline KPIs', params.results, params);
  builder.addMetricGrid('Platform KPIs', params.platformKpis.slice(0, 4), params);
  builder.addMetricGrid('Energy KPIs', params.energyKpis.slice(0, 4), params);
  builder.addMetricGrid('Consolidated KPIs', params.consolidatedKpis.slice(0, 4), params);

  builder.addSectionTitle(
    'Charts',
    'Trend views are drawn from the same workbook and integrated series used in the application dashboards.',
  );
  builder.addLineChart({
    title: 'Fleet revenue and EBITDA',
    periods: params.workbook.incomeStatement.periods,
    displayCurrency: params.displayCurrency,
    fxRate: params.fxRate,
    series: [
      buildChartSeries({
        label: 'Revenue',
        values: getStatementRow(params.workbook.incomeStatement, 'revenue').map(
          (value) => value / 1_000_000,
        ),
        format: 'currencyM',
        color: COLORS.accent,
      }),
      buildChartSeries({
        label: 'EBITDA',
        values: getStatementRow(params.workbook.incomeStatement, 'ebitda').map(
          (value) => value / 1_000_000,
        ),
        format: 'currencyM',
        color: COLORS.success,
      }),
    ],
  });
  builder.addLineChart({
    title: 'Fleet closing cash',
    periods: params.workbook.cashFlow.periods,
    displayCurrency: params.displayCurrency,
    fxRate: params.fxRate,
    series: [
      buildChartSeries({
        label: 'Closing cash',
        values: getStatementRow(params.workbook.cashFlow, 'closing_cash').map(
          (value) => value / 1_000_000,
        ),
        format: 'currencyM',
        color: COLORS.warning,
      }),
    ],
  });
  builder.addLineChart({
    title: 'Platform revenue and EBITDA',
    periods: params.integrated.platform.periods,
    displayCurrency: params.displayCurrency,
    fxRate: params.fxRate,
    series: [
      buildChartSeries({
        label: 'Total revenue',
        values: getStatementRow(
          params.integrated.platform.incomeStatement,
          'total_revenue',
        ).map((value) => value / 1_000_000),
        format: 'currencyM',
        color: COLORS.accent,
      }),
      buildChartSeries({
        label: 'EBITDA',
        values: getStatementRow(
          params.integrated.platform.incomeStatement,
          'ebitda',
        ).map((value) => value / 1_000_000),
        format: 'currencyM',
        color: COLORS.success,
      }),
    ],
  });
  builder.addLineChart({
    title: 'Energy revenue and EBITDA',
    periods: params.integrated.energy.periods,
    displayCurrency: params.displayCurrency,
    fxRate: params.fxRate,
    series: [
      buildChartSeries({
        label: 'Total revenue',
        values: getStatementRow(
          params.integrated.energy.incomeStatement,
          'total_revenue',
        ).map((value) => value / 1_000_000),
        format: 'currencyM',
        color: COLORS.accent,
      }),
      buildChartSeries({
        label: 'EBITDA',
        values: getStatementRow(
          params.integrated.energy.incomeStatement,
          'ebitda',
        ).map((value) => value / 1_000_000),
        format: 'currencyM',
        color: COLORS.success,
      }),
    ],
  });
  builder.addLineChart({
    title: 'Consolidated revenue and EBITDA',
    periods: params.integrated.consolidated.periods,
    displayCurrency: params.displayCurrency,
    fxRate: params.fxRate,
    series: [
      buildChartSeries({
        label: 'Consolidated revenue',
        values: getStatementRow(
          params.integrated.consolidated.incomeStatement,
          'consolidated_revenue',
        ).map((value) => value / 1_000_000),
        format: 'currencyM',
        color: COLORS.accent,
      }),
      buildChartSeries({
        label: 'EBITDA',
        values: getStatementRow(
          params.integrated.consolidated.incomeStatement,
          'ebitda',
        ).map((value) => value / 1_000_000),
        format: 'currencyM',
        color: COLORS.success,
      }),
    ],
  });

  builder.addSectionTitle(
    'Assumptions tables',
    'Detailed assumptions register using the current working values in the application.',
  );
  builder.addTable({
    title: 'Detailed assumptions register',
    headers: ['Group', 'Assumption', 'Current value'],
    rows: assumptionRows,
    columnWidths: [140, 400, 234],
    fontSize: 8.4,
  });

  builder.addSectionTitle(
    'Workbook financial tables',
    'Core workbook-backed statements used as the financial source of truth.',
  );
  builder.addTable({
    title: 'Workbook income statement',
    headers: ['Line item', ...params.workbook.incomeStatement.periods],
    rows: buildStatementRows(params.workbook.incomeStatement, params),
    columnWidths: [220, ...params.workbook.incomeStatement.periods.map(() => 49)],
    fontSize: 7.8,
  });
  builder.addTable({
    title: 'Workbook cash flow',
    headers: ['Line item', ...params.workbook.cashFlow.periods],
    rows: buildStatementRows(params.workbook.cashFlow, params),
    columnWidths: [220, ...params.workbook.cashFlow.periods.map(() => 49)],
    fontSize: 7.8,
  });
  builder.addTable({
    title: 'Workbook balance sheet',
    headers: ['Line item', ...params.workbook.balanceSheet.periods],
    rows: buildStatementRows(params.workbook.balanceSheet, params),
    columnWidths: [220, ...params.workbook.balanceSheet.periods.map(() => 49)],
    fontSize: 7.8,
  });
  builder.addTable({
    title: 'Workbook valuation summary',
    headers: ['Line item', ...params.workbook.valuationSummary.periods],
    rows: buildStatementRows(params.workbook.valuationSummary, params),
    columnWidths: [220, ...params.workbook.valuationSummary.periods.map(() => 87)],
    fontSize: 8.1,
  });

  builder.addSectionTitle(
    'Integrated financial tables',
    'Analytical Platform, Energy, and Consolidated views aligned to the current workbook run.',
  );
  builder.addTable({
    title: 'Platform income statement',
    headers: ['Line item', ...params.integrated.platform.incomeStatement.periods],
    rows: buildStatementRows(params.integrated.platform.incomeStatement, params),
    columnWidths: [220, ...params.integrated.platform.incomeStatement.periods.map(() => 49)],
    fontSize: 7.8,
  });
  builder.addTable({
    title: 'Energy income statement',
    headers: ['Line item', ...params.integrated.energy.incomeStatement.periods],
    rows: buildStatementRows(params.integrated.energy.incomeStatement, params),
    columnWidths: [220, ...params.integrated.energy.incomeStatement.periods.map(() => 49)],
    fontSize: 7.8,
  });
  builder.addTable({
    title: 'Consolidated income statement',
    headers: ['Line item', ...params.integrated.consolidated.incomeStatement.periods],
    rows: buildStatementRows(params.integrated.consolidated.incomeStatement, params),
    columnWidths: [220, ...params.integrated.consolidated.incomeStatement.periods.map(() => 49)],
    fontSize: 7.8,
  });
  builder.addTable({
    title: 'Consolidated cash flow',
    headers: ['Line item', ...params.integrated.consolidated.cashFlow.periods],
    rows: buildStatementRows(params.integrated.consolidated.cashFlow, params),
    columnWidths: [220, ...params.integrated.consolidated.cashFlow.periods.map(() => 49)],
    fontSize: 7.8,
  });
  builder.addTable({
    title: 'Consolidated balance sheet',
    headers: ['Line item', ...params.integrated.consolidated.balanceSheet.periods],
    rows: buildStatementRows(params.integrated.consolidated.balanceSheet, params),
    columnWidths: [220, ...params.integrated.consolidated.balanceSheet.periods.map(() => 49)],
    fontSize: 7.8,
  });

  return builder.build();
}

export function buildRunSummaryPdf(params: PdfReportParams) {
  return buildDetailedPdf(params);
}
