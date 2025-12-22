import { Panel } from "fava-dashboards";
// import "fava-dashboards";

// export const MyReactPanel = {
//   title : "AAA",
//   kind : "react",
//   spec : () =>  {
//       return <div>
//         <h1>imported from panels/due.tsx</h1>
//         <p>paragrafo2</p>
//       </div>;
//   }
// } as Panel

import * as Colors from '@dashboard/common/skin.ts'
import * as Utils from '@dashboard/common/utils.ts'
import {
  getCurrencyFormatter,
  fillMonthlyDataset,
  iterateMonths,
  anyFormatter
} from '@dashboard/common/utils.ts'



export const AssetsPanel = {

  title: "Assets 💰",
  width: "50%",
  height: "80px",
  link: "../../balance_sheet/",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = Utils.getCurrencyFormatter(variables.currency);
    const result = await ledger.query(
      `SELECT year, month, CONVERT(SUM(position), '${variables.currency}') AS value
        WHERE account ~ '^Assets:'
        GROUP BY year, month`,
    );
    let cumValue = 0;
    const dataset = result.map((row) => ({
      date: `${row.year}-${row.month}`,
      value: (cumValue += row.value[variables.currency]),
    }));
    const lastValue = dataset.length > 0 ? dataset[dataset.length - 1].value : 0;
    return Utils.StatChart(dataset, Colors.TREND_POSITIVE, currencyFormatter(lastValue), Colors.COLOR_PROFIT);
  },
} as Panel

export const LiabilitiesPanel = {
  title: "Liabilities 💳",
  width: "50%",
  height: "80px",
  link: "../../balance_sheet/",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = Utils.getCurrencyFormatter(variables.currency);
    const result = await ledger.query(
      `SELECT year, month, CONVERT(SUM(position), '${variables.currency}') AS value
               WHERE account ~ '^Liabilities:'
               GROUP BY year, month`,
    );
    let cumValue = 0;
    const dataset = result.map((row) => ({
      date: `${row.year}-${row.month}`,
      value: (cumValue += -row.value[variables.currency]),
    }));
    const lastValue = dataset.length > 0 ? dataset[dataset.length - 1].value : 0;
    return Utils.StatChart(dataset, Colors.TREND_NEGATIVE, currencyFormatter(lastValue), Colors.COLOR_LOSS);
  },
} as Panel

export const IncomeAndExpensesPanel = {
  title: "Income/Expenses 💸",
  width: "100%",
  height: "520px",
  link: "../../income_statement/",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const queries = [
      {
        bql: `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
                      WHERE account ~ '^Income:'
                      GROUP BY year, month`,
        name: "Income",
        stack: "income",
        link: "../../account/Income/?time={time}",
      },
      {
        bql: `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
                      WHERE account ~ '^Expenses:Housing:' AND NOT 'travel' IN tags
                      GROUP BY year, month`,
        name: "Housing",
        stack: "expenses",
        link: "../../account/Expenses:Housing/?filter=-#travel&time={time}",
      },
      {
        bql: `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
                      WHERE account ~ '^Expenses:Food:' AND NOT 'travel' IN tags
                      GROUP BY year, month`,
        name: "Food",
        stack: "expenses",
        link: "../../account/Expenses:Food/?filter=-#travel&time={time}",
      },
      {
        bql: `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
                      WHERE account ~ '^Expenses:Shopping:' AND NOT 'travel' IN tags
                      GROUP BY year, month`,
        name: "Shopping",
        stack: "expenses",
        link: "../../account/Expenses:Shopping/?filter=-#travel&time={time}",
      },
      {
        bql: `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
                      WHERE account ~ '^Expenses:' AND 'travel' IN tags
                      GROUP BY year, month`,
        name: "Travel",
        stack: "expenses",
        link: "../../account/Expenses/?filter=#travel&time={time}",
      },
      {
        bql: `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
                      WHERE account ~ '^Expenses:' AND NOT account ~ '^Expenses:(Housing|Food|Shopping):' AND NOT 'travel' IN tags
                      GROUP BY year, month`,
        name: "Other",
        stack: "expenses",
        link: '../../account/Expenses/?filter=all(-account:"^Expenses:(Housing|Food|Shopping)") -#travel&time={time}',
      },
    ];

    const results = await Promise.all(
      queries.map(async (query) => ({
        name: query.name,
        stack: query.stack,
        // stacked barcharts show empty bars if the dataset contains "holes", therefore use fillMonthlyDataset() here
        dataset: fillMonthlyDataset(
          (await ledger.query(query.bql)).map((row) => ({
            date: `${row.year}-${row.month}`,
            value: query.stack === "income" ? -row.value[variables.currency] : row.value[variables.currency],
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
      series: results.map((query, i) => ({
        type: "bar",
        name: query.name,
        stack: query.stack,
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


