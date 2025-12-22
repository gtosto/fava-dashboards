/// <reference types="../fava-dashboards.d.ts" />
import {
  D3SankeyLink,
  D3SankeyNode,
  defineConfig,
  EChartsSpec,
  Ledger,
  Position,
  TableSpec,
  VariableDefinition,
} from "fava-dashboards";


export function getCurrencyFormatter(currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format;
}

export function anyFormatter(formatter: (value: number) => string) {
  return (value: any) => (typeof value === "number" ? formatter(value) : "");
}

export function iterateMonths(dateFirst: string, dateLast: string) {
  const months = [];
  let [year, month] = dateFirst.split("-").map((x) => parseInt(x));
  const [lastYear, lastMonth] = dateLast.split("-").map((x) => parseInt(x));

  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    months.push({ year, month });
    if (month == 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
  }
  return months;
}

export function iterateYears(dateFirst: string, dateLast: string) {
  const years = [];
  let year = parseInt(dateFirst.split("-")[0]);
  const lastYear = parseInt(dateLast.split("-")[0]);

  for (; year <= lastYear; year++) {
    years.push(year);
  }
  return years;
}

export function countMonths(ledger: Ledger): number {
  const ms = new Date(ledger.dateLast).getTime() - new Date(ledger.dateFirst).getTime();
  const days = ms / (1000 * 60 * 60 * 24) + 1;
  const months = days / (365 / 12);
  return months;
}

export type Dataset = DatasetRow[];
export type DatasetRow = Record<string, number | string>;

export function fillMonthlyDataset(dataset: Dataset, column: string, values: string[], undef: DatasetRow): Dataset {
  const dsByColumn: Record<string, DatasetRow> = {};
  for (const row of dataset) {
    dsByColumn[row[column]] = row;
  }
  return values.map((v) => dsByColumn[v] ?? { ...undef, [column]: v });
}

export function sumValue(dataset: { value: number }[]): number {
  return dataset.reduce((prev, cur) => prev + cur.value, 0);
}

export type SunburstNode = {
  name?: string;
  value?: number;
  children: SunburstNode[];
};

export function buildAccountTree(rows: any[], valueFn: (row: any) => number, nameFn?: (parts: string[], i: number) => string) {
  nameFn = nameFn ?? ((parts, i) => parts.slice(0, i + 1).join(":"));

  const accountTree: SunburstNode = { children: [] };
  for (const row of rows) {
    const accountParts = row.account.split(":");
    let node = accountTree;
    for (let i = 0; i < accountParts.length; i++) {
      const account = nameFn(accountParts, i);
      let child = node.children.find((c) => c.name == account);
      if (!child) {
        child = { name: account, children: [], value: 0 };
        node.children.push(child);
      }

      child.value! += valueFn(row);
      node = child;
    }
  }
  return accountTree;
}

export function StatChart(
  dataset: { date: string; value: number }[],
  lineColor: (opacity?: number) => string,
  text: string,
  textColor: string,
): EChartsSpec {
  return {
    grid: {
      top: 30,
      bottom: 0,
      left: 0,
      right: 0,
    },
    xAxis: {
      type: "time",
      show: false,
    },
    yAxis: {
      show: false,
    },
    dataset: {
      source: dataset,
    },
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        color: lineColor(),
        areaStyle: {
          origin: "start",
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: lineColor(0.2) },
              { offset: 1, color: lineColor(0) },
            ],
          },
        },
        encode: { x: "date", y: "value" },
      },
    ],
    graphic: [
      {
        type: "text",
        top: 0,
        right: 0,
        style: {
          text,
          fontWeight: "bold",
          fontSize: 24,
          fill: textColor,
        },
      },
    ],
  };
}

export async function YearOverYear(ledger: Ledger, currency: string, query: string): Promise<EChartsSpec> {
  const currencyFormatter = getCurrencyFormatter(currency);
  const result = await ledger.query(query);
  const years = iterateYears(ledger.dateFirst, ledger.dateLast);
  const maxAccounts = 7; // number of accounts to show, sorted by sum

  const accountSums: Record<string, number> = {};
  const amounts: Record<string, number> = {};
  for (const row of result) {
    if (!(row.account in accountSums)) {
      accountSums[row.account] = 0;
    }
    const value = row.account.startsWith("Income:") ? -row.value[currency] : row.value[currency];
    amounts[`${row.year}/${row.account}`] = value;
    accountSums[row.account] += value;
  }

  const accounts = Object.entries(accountSums)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name)
    .slice(0, maxAccounts)
    .reverse();
  return {
    legend: {
      top: "bottom",
    },
    tooltip: {
      formatter: "{a}",
    },
    xAxis: {
      axisLabel: {
        formatter: currencyFormatter,
      },
    },
    yAxis: {
      data: accounts.map((account) => account.split(":").slice(1).join(":")),
    },
    grid: {
      containLabel: true,
      left: 0,
    },
    series: years.map((year) => ({
      type: "bar",
      name: year,
      data: accounts.map((account) => amounts[`${year}/${account}`] ?? 0),
      label: {
        show: true,
        position: "right",
        formatter: (params: any) => currencyFormatter(params.value),
      },
    })),
    onClick: (event) => {
      const link = "../../account/{account}/?time={time}"
        .replace("{account}", accounts[event.dataIndex])
        .replace("{time}", event.seriesName ?? "");
      window.open(ledger.urlFor(link));
    },
  };
}

// export const Utils = {
//   getCurrencyFormatter,
//   iterateMonths,
//   iterateYears,
//   countMonths,
//   fillMonthlyDataset,
//   sumValue,
//   buildAccountTree,
//   StatChart,

// }

// export type {
//   Dataset, DatasetRow,
//   SunburstNode
// }
