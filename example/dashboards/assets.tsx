// import * as Colors from '@dashboard/common/skin.ts'
// import * as Utils from '@dashboard/common/utils.ts'

import {
  getCurrencyFormatter,
  fillMonthlyDataset,
  iterateMonths,
  iterateYears,
  anyFormatter
} from '@dashboard/common/utils.ts'

import * as Skin from '@dashboard/common/skin.ts'


import {currencyVariable, SunburstNode} from "@dashboard/common/vars.ts"


const Assets = {
  title: "Assets 🏦",
  width: "50%",
  height: "400px",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const result = await ledger.query(
      `SELECT currency, CONVERT(SUM(position), '${variables.currency}') as market_value
               WHERE account_sortkey(account) ~ '^[01]'
               GROUP BY currency
               ORDER BY market_value`,
    );

    const data = result
      .filter((row) => row.market_value[variables.currency])
      .map((row) => ({ name: row.currency, value: row.market_value[variables.currency] }));

    return {
      tooltip: {
        formatter: (params: any) =>
          `${params.marker} ${ledger.commodities[params.name]?.meta.name ?? params.name
          } <span style="padding-left: 15px; font-weight: bold;">${currencyFormatter(
            params.value,
          )}</span> (${params.percent.toFixed(0)}%)`,
      },
      series: [
        {
          type: "pie",
          data,
        },
      ],
    };
  },
}

//
const PortfolioPanel = {
  title: "Portfolio 📈",
  width: "50%",
  height: "400px",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const result = await ledger.query(
      `SELECT year, month,
               CONVERT(LAST(balance),       '${variables.currency}', DATE_TRUNC('month', FIRST(date)) + INTERVAL('1 month') - INTERVAL('1 day')) AS market_value,
               CONVERT(COST(LAST(balance)), '${variables.currency}', DATE_TRUNC('month', FIRST(date)) + INTERVAL('1 month') - INTERVAL('1 day')) AS book_value
               WHERE account ~ '^Assets:' AND currency != '${variables.currency}'
               GROUP BY year, month`,
    );
    const dataset = result.map((row) => ({
      date: `${row.year}-${row.month}`,
      market_value: row.market_value[variables.currency],
      book_value: row.book_value[variables.currency],
    }));
    return {
      tooltip: {
        trigger: "axis",
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
      dataset: {
        source: dataset,
      },
      series: [
        {
          type: "line",
          name: "Market Value",
          smooth: true,
          encode: { x: "date", y: "market_value" },
        },
        {
          type: "line",
          name: "Book Value",
          smooth: true,
          encode: { x: "date", y: "book_value" },
        },
      ],
      onClick: (event) => {
        const [year, month] = (event.data as { date: string }).date.split("-");
        const link = "../../balance_sheet/?time={time}".replace("{time}", `${year}-${month.padStart(2, "0")}`);
        window.open(ledger.urlFor(link));
      },
    };
  },
}

const NetWorthPanel = {
  title: "Net Worth 💰",
  width: "50%",
  height: "400px",
  link: "../../income_statement/",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const result = await ledger.query(
      `SELECT year, month,
               CONVERT(LAST(balance), '${variables.currency}', DATE_TRUNC('month', FIRST(date)) + INTERVAL('1 month') - INTERVAL('1 day')) AS value
               WHERE account_sortkey(account) ~ '^[01]'
               GROUP BY year, month`,
    );
    const dataset = result.map((row) => ({
      date: `${row.year}-${row.month}`,
      value: row.value[variables.currency],
    }));
    return {
      magic: 1,
      tooltip: {
        trigger: "axis",
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
          smooth: true,
          color: Skin.TREND_POSITIVE(),
          areaStyle: {
            origin: "start",
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: Skin.TREND_POSITIVE(0.4) },
                { offset: 1, color: Skin.TREND_POSITIVE(0) },
              ],
            },
          },
          encode: { x: "date", y: "value" },
        },
      ],
      onClick: (event) => {
        const [year, month] = (event.data as { date: string }).date.split("-");
        const link = "../../balance_sheet/?time={time}".replace("{time}", `${year}-${month.padStart(2, "0")}`);
        window.open(ledger.urlFor(link));
      },
    };
  },
}

const PortfolioGainsPanel = {
  title: "Portfolio Gains ✨",
  width: "50%",
  height: "400px",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const result = await ledger.query(
      `SELECT year, month,
               CONVERT(LAST(balance),       '${variables.currency}', DATE_TRUNC('month', FIRST(date)) + INTERVAL('1 month') - INTERVAL('1 day')) AS market_value,
               CONVERT(COST(LAST(balance)), '${variables.currency}', DATE_TRUNC('month', FIRST(date)) + INTERVAL('1 month') - INTERVAL('1 day')) AS book_value
               WHERE account ~ '^Assets:' AND currency != '${variables.currency}'
               GROUP BY year, month`,
    );
    const dataset = result.map((row) => ({
      date: `${row.year}-${row.month}`,
      value: row.market_value[variables.currency] - row.book_value[variables.currency],
    }));

    return {
      tooltip: {
        trigger: "axis",
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
          smooth: true,
        },
      ],
    };
  },
}

const AssetsClassesYearOverYearPanel = {
  title: "Asset Classes Year-over-Year 🏦",
  width: "100%",
  height: "400px",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const years = iterateYears(ledger.dateFirst, ledger.dateLast);

    // This chart requires the balances grouped by year and currency.
    // Unfortunately the `balance` column does not support GROUP BY
    // (see https://groups.google.com/g/beancount/c/TfZJswxuIDA/m/psc2BkrBAAAJ)
    // therefore we need to run a separate query per year.
    const queries = await Promise.all(
      years.map((year) =>
        ledger.query(`SELECT currency,
                              CONVERT(SUM(position), '${variables.currency}', ${year}-12-31) as market_value
                              FROM CLOSE ON ${year + 1}-01-01
                              WHERE account_sortkey(account) ~ '^[01]'
                              GROUP BY currency`),
      ),
    );

    const amounts: Record<string, Record<string, number>> = {};
    const balances: Record<string, number> = {};
    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      const query = queries[i];

      amounts[year] = {};
      for (const row of query) {
        if (!row.market_value[variables.currency]) {
          continue;
        }

        const value = row.market_value[variables.currency];
        const assetClass = ledger.commodities[row.currency]?.meta.asset_class ?? "unknown";
        amounts[year][assetClass] = (amounts[year][assetClass] ?? 0) + value;
        balances[assetClass] = (balances[assetClass] ?? 0) + value;
      }
    }

    const assetClasses = Object.entries(balances)
      .sort(([, a], [, b]) => b - a)
      .map(([name]) => name);

    return {
      tooltip: {
        formatter: (params: any) => {
          const sum = Object.values(amounts[params.name]).reduce((prev, cur) => prev + cur, 0);
          return `${params.marker} ${params.seriesName} <span style="padding-left: 15px; font-weight: bold;">${currencyFormatter(
            params.value,
          )}</span> (${((params.value / sum) * 100).toFixed(0)}%)`;
        },
      },
      legend: {
        top: "bottom",
      },
      xAxis: {
        data: years,
      },
      yAxis: {
        axisLabel: {
          formatter: currencyFormatter,
        },
      },
      series: assetClasses.map((assetClass) => ({
        type: "bar",
        name: assetClass,
        stack: "assets",
        data: years.map((year) => amounts[year][assetClass] ?? 0),
      })),
    };
  },
}

const AssetsClassesPanel = {
  title: "Asset Classes 🏦",
  width: "50%",
  height: "400px",
  kind: "echarts",
  variables: [
    {
      name: "categories",
      display: "toggle",
      options: () => ["All assets", "Only investments"],
    },
  ],
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const filter = variables.categories == "Only investments" ? `AND currency != '${variables.currency}'` : "";
    const result = await ledger.query(
      `SELECT currency, CONVERT(SUM(position), '${variables.currency}') as market_value
               WHERE account_sortkey(account) ~ '^[01]' ${filter}
               GROUP BY currency
               ORDER BY market_value`,
    );

    let totalValue = 0;
    const assetClasses: Record<string, { name: string; children: { name: string; value: number }[] }> = {};
    for (const row of result) {
      if (!row.market_value[variables.currency]) {
        continue;
      }

      const ccy = row.currency;
      const value = row.market_value[variables.currency];
      const assetName = (ledger.commodities[ccy]?.meta.name ?? ccy) as string;
      const assetClass = (ledger.commodities[ccy]?.meta.asset_class ?? "unknown") as string;
      if (!(assetClass in assetClasses)) {
        assetClasses[assetClass] = { name: assetClass, children: [] };
      }
      assetClasses[assetClass].children.push({ name: assetName, value });
      totalValue += value;
    }

    return {
      tooltip: {
        formatter: (params: any) =>
          `${params.marker} ${params.name} <span style="padding-left: 15px; font-weight: bold;">${currencyFormatter(
            params.value,
          )}</span> (${((params.value / totalValue) * 100).toFixed(0)}%)`,
      },
      series: [
        {
          type: "sunburst",
          radius: "100%",
          label: {
            minAngle: 3,
            width: 170,
            overflow: "truncate",
          },
          labelLayout: {
            hideOverlap: true,
          },
          data: Object.values(assetClasses),
        },
      ],
    };
  },
}

const AssetsAllocation = {
  title: "Assets Allocation 🏦",
  width: "50%",
  height: "400px",
  kind: "echarts",
  variables: [
    {
      name: "categories",
      display: "toggle",
      options: () => ["All assets", "Only investments"],
    },
  ],
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const filter = variables.categories == "Only investments" ? `AND currency != '${variables.currency}'` : "";
    const result = await ledger.query(
      `SELECT currency, CONVERT(SUM(position), '${variables.currency}') as market_value
               WHERE account_sortkey(account) ~ '^[01]' ${filter}
               GROUP BY currency
               ORDER BY market_value`,
    );

    let totalValue = 0;
    const root: SunburstNode = { children: [] };
    for (const row of result) {
      if (!row.market_value[variables.currency]) {
        continue;
      }

      const allocations = Object.entries(ledger.commodities[row.currency]?.meta ?? {}).filter(([k, _v]) =>
        k.startsWith("asset_allocation_"),
      ) as [string, number][];
      if (allocations.length === 0) {
        allocations.push(["asset_allocation_Unknown", 100]);
      }

      for (const [allocation, percentage] of allocations) {
        const parts = allocation.substring("asset_allocation_".length).split("_");
        let node = root;
        for (const part of parts) {
          let child = node.children.find((c) => c.name == part);
          if (!child) {
            child = { name: part, children: [] };
            node.children.push(child);
          }
          node = child;
        }

        const value = (percentage / 100) * row.market_value[variables.currency];
        node.value = (node.value ?? 0) + value;
        totalValue += value;
      }
    }

    return {
      tooltip: {
        formatter: (params: any) =>
          `${params.marker} ${params.name} <span style="padding-left: 15px; font-weight: bold;">${currencyFormatter(
            params.value,
          )}</span> (${((params.value / totalValue) * 100).toFixed(0)}%)`,
      },
      series: [
        {
          type: "sunburst",
          radius: "100%",
          label: {
            rotate: "tangential",
            minAngle: 20,
          },
          labelLayout: {
            hideOverlap: true,
          },
          data: root.children,
        },
      ],
    };
  },
}


export const AssetsDashboard = {
  name: "Assets",
  variables: [currencyVariable],
  panels: [
    Assets, PortfolioPanel,
    NetWorthPanel, PortfolioGainsPanel

  ]
}
