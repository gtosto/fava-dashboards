import { ECElementEvent } from "echarts";

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

import {
  getCurrencyFormatter,
  fillMonthlyDataset,
  iterateMonths,
  iterateYears,
  anyFormatter,
  StatChart,
  countMonths,
  sumValue,
  YearOverYear,
  buildAccountTree,
} from '@dashboard/common/utils.ts'

import * as Colors from '@dashboard/common/skin.ts'

export const ExpensesCategories =         {
          title: "Expenses Categories (per month) 💸",
          width: "50%",
          height: "400px",
          link: "../../account/Expenses/?r=changes",
          kind: "echarts",
          spec: async ({ ledger, variables }) => {
            const result = await ledger.query(
              `SELECT root(account, 3) AS account, CONVERT(SUM(position), '${variables.currency}') AS value
               WHERE account ~ '^Expenses:'
               GROUP BY account`,
            );

            const currencyFormatter = getCurrencyFormatter(variables.currency);
            const months = countMonths(ledger);
            const accountTree = buildAccountTree(
              result,
              (row) => (row.value[variables.currency] ?? 0) / months,
              (parts, i) => parts[i],
            );
            // use click event on desktop, dblclick on mobile
            const clickEvt = window.screen.width < 800 ? "onDblClick" : "onClick";

            return {
              tooltip: {
                valueFormatter: anyFormatter(currencyFormatter),
              },
              series: [
                {
                  type: "sunburst",
                  radius: "100%",
                  label: {
                    minAngle: 20,
                  },
                  nodeClick: false,
                  data: accountTree.children[0]?.children ?? [],
                },
              ],
              [clickEvt]: (event: ECElementEvent) => {
                const account = "Expenses" + event.treePathInfo.map((i: any) => i.name).join(":");
                const link = "../../account/{account}/?r=changes".replace("{account}", account);
                window.open(ledger.urlFor(link));
              },
            };
          },
        }

export const ExpensesByKind =         {
          title: "Recurring, Regular and Irregular Expenses 🔁",
          width: "50%",
          height: "400px",
          link: "../../income_statement/",

          kind: "echarts",
          spec: async ({ ledger, variables }) => {
            const currencyFormatter = getCurrencyFormatter(variables.currency);
            const queries = [
              {
                bql: `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
WHERE account ~ '^Expenses:' AND 'recurring' IN tags
GROUP BY year, month`,
                name: "Recurring",
                link: "../../account/Expenses/?filter=#recurring&time={time}",
              },
              {
                bql: `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
WHERE account ~ '^Expenses:' AND NOT 'recurring' IN tags AND NOT 'irregular' IN tags
GROUP BY year, month`,
                name: "Regular",
                link: "../../account/Expenses/?filter=-#recurring -#irregular&time={time}",
              },
              {
                bql: `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
WHERE account ~ '^Expenses:' AND 'irregular' IN tags
GROUP BY year, month`,
                name: "Irregular",
                link: "../../account/Expenses/?filter=#irregular&time={time}",
              },
            ];

            const results = await Promise.all(
              queries.map(async (query) => ({
                name: query.name,
                dataset: fillMonthlyDataset(
                  (await ledger.query(query.bql)).map((row) => ({
                    date: `${row.year}-${row.month}`,
                    value: row.value[variables.currency],
                  })),
                  "date",
                  iterateMonths(ledger.dateFirst, ledger.dateLast).map((m) => `${m.year}-${m.month}`),
                  { value: 0 },
                ),
              })),
            );

            return {
              tooltip: {
                valueFormatter: anyFormatter(currencyFormatter),
              },
              legend: {
                top: "bottom",
              },
              xAxis: {
                type: "time",
              },
              yAxis: {
                axisLabel: {
                  formatter: currencyFormatter,
                },
              },
              dataset: results.map((r) => ({ source: r.dataset })),
              series: queries.map((query, i) => ({
                type: "bar",
                name: query.name,
                stack: "expenses",
                datasetIndex: i,
                encode: { x: "date", y: "value" },
              })),
              onClick: (event) => {
                const query = queries.find((q) => q.name === event.seriesName);
                if (query) {
                  const [year, month] = (event.data as { date: string }).date.split("-");
                  const link = query.link.replace("{time}", `${year}-${month.padStart(2, "0")}`);
                  window.open(ledger.urlFor(link));
                }
              },
            };
          },
        }

export const FoodExpenses =         {
          title: "Food Expenses 🥐",
          width: "50%",
          height: "400px",
          link: "../../account/Expenses:Food/",

          kind: "echarts",
          spec: async ({ ledger, variables }) => {
            const currencyFormatter = getCurrencyFormatter(variables.currency);
            const result = await ledger.query(
              `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
               WHERE account ~ '^Expenses:Food:'
               GROUP BY year, month`,
            );
            const dataset = result.map((row) => ({
              date: `${row.year}-${row.month}`,
              value: row.value[variables.currency],
            }));

            return {
              tooltip: {
                valueFormatter: anyFormatter(currencyFormatter),
              },
              xAxis: {
                type: "time",
              },
              yAxis: {
                axisLabel: {
                  formatter: currencyFormatter,
                },
              },
              dataset: {
                source: dataset,
              },
              series: [
                {
                  type: "line",
                  name: "Expenses",
                  smooth: true,
                  encode: { x: "date", y: "value" },
                },
              ],
              onClick: (event) => {
                const [year, month] = (event.data as { date: string }).date.split("-");
                const link = "../../account/Expenses:Food/?time={time}".replace(
                  "{time}",
                  `${year}-${month.padStart(2, "0")}`,
                );
                window.open(ledger.urlFor(link));
              },
            };
          },
        }

export const ExpensesYoY =         {
          title: "Expenses Year-Over-Year 💸",
          width: "50%",
          height: "700px",

          kind: "echarts",
          spec: async ({ ledger, variables }) => {
            return YearOverYear(
              ledger,
              variables.currency,
              `SELECT year, root(account, 2) AS account, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
               WHERE account ~ '^Expenses:'
               GROUP BY account, year`,
            );
          },
        }


export const Top10Expenses : Panel =         {
          title: "Top 10 biggest expenses",
          width: "100%",
          height: "400px",
          kind: "table",
          spec: async ({ ledger }) => {
            type Row = {
              date: string;
              payee: string | null;
              narration: string;
              position: Position;
            };
            const rows = await ledger.query<Row>(
              'SELECT date, payee, narration, position WHERE account ~ "^Expenses:" ORDER BY position DESC LIMIT 10',
            );

            const table: TableSpec<Row> = {
              columns: [
                { field: "date", minWidth: 100 },
                { field: "payee", flex: 0.5 },
                { field: "narration", flex: 1 },
                {
                  field: "position",
                  minWidth: 200,
                  valueGetter: (_value, row) => row.position.units.number,
                  valueFormatter: (_value, row) => `${row.position.units.number} ${row.position.units.currency}`,
                },
              ],
              rows: rows.map((row, i) => ({ ...row, id: i })),
            };
            return table;
          },
        }


export const IncomeYoY =               {
          title: "Income Year-Over-Year 💰",
          width: "50%",
          height: "700px",

          kind: "echarts",
          spec: async ({ ledger, variables }) => {
            return YearOverYear(
              ledger,
              variables.currency,
              `SELECT year, root(account, 3) AS account, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
               WHERE account ~ '^Income:'
               GROUP BY account, year`,
            );
          },
        }

export const IncomeCategories =         {
          title: "Income Categories (per month) 💰",
          width: "50%",
          height: "400px",
          link: "../../account/Income/?r=changes",
          kind: "echarts",
          spec: async ({ ledger, variables }) => {
            const currencyFormatter = getCurrencyFormatter(variables.currency);
            const result = await ledger.query(
              `SELECT root(account, 4) AS account, CONVERT(SUM(position), '${variables.currency}') AS value
               WHERE account ~ '^Income:'
               GROUP BY account`,
            );

            const months = countMonths(ledger);
            const accountTree = buildAccountTree(
              result,
              (row) => -(row.value[variables.currency] ?? 0) / months,
              (parts, i) => parts[i],
            );
            // use click event on desktop, dblclick on mobile
            const clickEvt = window.screen.width < 800 ? "onDblClick" : "onClick";

            return {
              tooltip: {
                valueFormatter: anyFormatter(currencyFormatter),
              },
              series: [
                {
                  type: "sunburst",
                  radius: "100%",
                  label: {
                    minAngle: 20,
                  },
                  nodeClick: false,
                  data: accountTree.children[0]?.children ?? [],
                },
              ],
              [clickEvt]: (event: ECElementEvent) => {
                const account = "Income" + event.treePathInfo.map((i: any) => i.name).join(":");
                const link = "../../account/{account}/?r=changes".replace("{account}", account);
                window.open(ledger.urlFor(link));
              },
            };
          },
        }
