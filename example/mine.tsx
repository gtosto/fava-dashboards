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
} from "fava-dashboards";

import React, { useState } from 'react';

import * as Colors from '@dashboard/common/skin.ts'
import * as Utils from '@dashboard/common/utils.ts'

// Importa alcuni Panel definiti in altri moduli
import {MyHtmlPanel} from '@dashboard/panels/due.tsx'
import {AssetsPanel} from '@dashboard/panels/assets.tsx'
import {MyStats} from '@dashboard/panels/stats.tsx'

const currencyVariable: VariableDefinition = {
  name: "currency",
  label: "Currency",
  options: async ({ ledger }) => {
    return ledger.operatingCurrencies;
  },
};


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
  ],
});
