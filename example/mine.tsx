/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="./fava-dashboards.d.ts" />
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
  YearOverYear
} from "fava-dashboards";

import React, { useState } from 'react';

import * as Colors from '@dashboard/common/skin.ts'
import * as Utils from '@dashboard/common/utils.ts'

// Importa alcuni Panel definiti in altri moduli
import {MyHtmlPanel} from '@dashboard/panels/due.tsx'

import {
  AssetsPanel,
  LiabilitiesPanel,
  IncomeAndExpensesPanel
 } from '@dashboard/dashboards/overview.tsx'

import {MyStats} from '@dashboard/panels/stats.tsx'

// Import a whole dashboard
import { AssetsDashboard } from "@dashboard/dashboards/assets.tsx";

// export const currencyVariable: VariableDefinition = {
//   name: "currency",
//   label: "Currency",
//   options: async ({ ledger }) => {
//     return ledger.operatingCurrencies;
//   },
// };

import {currencyVariable} from "@dashboard/common/vars.ts"

import {
  AvgIncomePerMonth,
  AvgExpensesPerMonth,
  AvgSavingsPerMonth
} from "@dashboard/dashboards/income_expenses/averages.tsx"

import {
  SavingsHeatmap,
  ExpenseCaldendarHeatmap,
} from "@dashboard/dashboards/income_expenses/heatmaps.tsx"

import {
  ExpensesCategories, IncomeCategories,
  ExpensesYoY, IncomeYoY,
  ExpensesByKind, FoodExpenses,
  Top10Expenses,
} from "@dashboard/dashboards/income_expenses/expenses.tsx"

export default defineConfig({
  dashboards: [
    {
      name: "Uno",
      variables: [currencyVariable],
      panels: [
        MyHtmlPanel,
        AssetsPanel,
        MyStats,
        //InlinePanel1,
        {
          title: "React Test Panel",
          height: "80px",
          kind: "react",
          spec: () => {
            //const [counter, setCounter] = React.useState(0);
            //return <a>Click me</a>;
            return <div>?????????????</div>;
          },
        },
      ]
    },
    {
      name: "Overview",
      variables: [currencyVariable],
      panels: [
        AssetsPanel,
        LiabilitiesPanel,
        IncomeAndExpensesPanel
      ]
    },

    AssetsDashboard,

    // Income & Expenses Dashboard
    {
       name: "Income and Expenses",
       variables: [currencyVariable],
       panels: [
        AvgIncomePerMonth, AvgExpensesPerMonth, AvgSavingsPerMonth,
        SavingsHeatmap,
        ExpenseCaldendarHeatmap,

  ExpensesCategories, IncomeCategories,
  ExpensesYoY, IncomeYoY,
  ExpensesByKind, FoodExpenses,
  Top10Expenses,

       ]
    }
  ],
});
