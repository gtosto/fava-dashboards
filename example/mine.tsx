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

// const customDeps = async (path: string) => {
//   console.log("loading dependency at path: ${path}")
//   const mod = import(path)
// }


//const mod = await import("@mine/due.tsx");
//const b = mod

// // // importa il modulo esterno
import {MyHtmlPanel} from '@dashboard/panels/due.tsx'
const a = MyHtmlPanel
// //console.log(`panel a`, typeof(a))

// const InlinePanel1 = {
//   title: "inline panel 1",
//   kind: "html",
//   height: "50",
//   spec: () => {
//     return "<h1>Header 1</h1>"
//   }
// }

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
