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


// // // importa il modulo esterno
import {MyHtmlPanel} from '@dashboard/panels/due.tsx'


export default defineConfig({
  dashboards: [
    {
      name: "Uno",
      panels: [
        MyHtmlPanel,
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
