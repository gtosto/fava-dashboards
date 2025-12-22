import {
  getCurrencyFormatter,
  fillMonthlyDataset,
  iterateMonths,
  iterateYears,
  anyFormatter,
  StatChart,
  countMonths,
  sumValue
} from '@dashboard/common/utils.ts'

import * as Colors from '@dashboard/common/skin.ts'


export const AvgIncomePerMonth = {
  title: "Avg. Income per Month 💰",
  width: "33%",
  height: "100px",
  link: "../../account/Income/?r=changes",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const result = await ledger.query(
      `SELECT year, month, CONVERT(SUM(position), '${variables.currency}') AS value
               WHERE account ~ '^Income:'
               GROUP BY year, month`,
    );
    const dataset = result.map((row) => ({
      date: `${row.year}-${row.month}`,
      value: -row.value[variables.currency],
    }));
    const avg = sumValue(dataset) / countMonths(ledger);
    return StatChart(dataset, Colors.TREND_POSITIVE, currencyFormatter(avg), Colors.COLOR_PROFIT);
  },
}

export const AvgExpensesPerMonth = {
  title: "Avg. Expenses per Month 💸",
  width: "33%",
  height: "100px",
  link: "../../account/Expenses/?r=changes",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const result = await ledger.query(
      `SELECT year, month, CONVERT(SUM(position), '${variables.currency}') AS value
               WHERE account ~ '^Expenses:'
               GROUP BY year, month`,
    );
    const dataset = result.map((row) => ({
      date: `${row.year}-${row.month}`,
      value: row.value[variables.currency],
    }));
    const avg = sumValue(dataset) / countMonths(ledger);
    return StatChart(dataset, Colors.TREND_NEGATIVE, currencyFormatter(avg), Colors.COLOR_LOSS);
  },
}

export const AvgSavingsPerMonth = {
  title: "Avg. Savings per Month ✨",
  width: "33%",
  height: "100px",
  link: "../../income_statement/",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {
    const currencyFormatter = getCurrencyFormatter(variables.currency);
    const percentFormatter = new Intl.NumberFormat(undefined, {
      style: "percent",
      maximumFractionDigits: 0,
    }).format;

    const income = await ledger.query(
      `SELECT year, month, CONVERT(SUM(position), '${variables.currency}') AS value
               WHERE account ~ '^Income:'
               GROUP BY year, month`,
    );
    const incomeDataset = income.map((row) => ({
      date: `${row.year}-${row.month}`,
      value: -row.value[variables.currency],
    }));
    const avgIncome = sumValue(incomeDataset) / countMonths(ledger);

    const expenses = await ledger.query(
      `SELECT year, month, CONVERT(SUM(position), '${variables.currency}') AS value
               WHERE account ~ '^Expenses:'
               GROUP BY year, month`,
    );
    const expensesDataset = expenses.map((row) => ({
      date: `${row.year}-${row.month}`,
      value: row.value[variables.currency],
    }));
    const avgExpenses = sumValue(expensesDataset) / countMonths(ledger);

    const avgSavingsRate = avgIncome - avgExpenses;
    const avgSavingsRatePercent = avgIncome === 0 ? 0 : 1 - avgExpenses / avgIncome;
    const trend_color = avgSavingsRate >= 0 ? Colors.TREND_POSITIVE : Colors.TREND_NEGATIVE;

    const incomeMap = new Map<string, number>(incomeDataset.map(({ date, value }) => [date, value]));
    const expensesMap = new Map<string, number>(expensesDataset.map(({ date, value }) => [date, value]));
    const allDates = new Set([...incomeMap.keys(), ...expensesMap.keys()]);
    const savingsSeries = Array.from(allDates, (date) => ({
      date,
      value: (incomeMap.get(date) ?? 0) - (expensesMap.get(date) ?? 0),
    }));

    const text = `${currencyFormatter(avgSavingsRate)} (${percentFormatter(avgSavingsRatePercent)})`;
    const textColor = avgSavingsRate >= 0 ? Colors.COLOR_PROFIT : Colors.COLOR_LOSS;
    return StatChart(savingsSeries, trend_color, text, textColor);
  },
}
