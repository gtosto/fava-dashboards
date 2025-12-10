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

export const AssetsPanel = {

  title: "Assets 💰",
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


