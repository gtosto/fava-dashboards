import { Panel, panel } from "fava-dashboards";
import "fava-dashboards";

const AAA_Panel = {
  title : "AAA",
  kind : "react",
  spec : () =>  {
      return <div>
        <h1>titolo: from panel/aaa</h1>
        <p>paragrafo2</p>
      </div>;
  }
} as Panel


export default AAA_Panel
        // export default Panel({

        //   title: "BBB",
        //   kind: "echarts",
        //   spec: async ({ ledger, variables }) => {

        //     return {
        //       xAxis: {
        //           type: 'category',
        //           data: ['Matcha Latte', 'Milk Tea', 'Cheese Cocoa', 'Walnut Brownie']
        //         },
        //         yAxis: {},
        //         series: [
        //           {
        //             name: '2015',
        //             type: 'bar',
        //             data: [89.3, 92.1, 94.4, 85.4]
        //           },
        //           {
        //             name: '2016',
        //             type: 'bar',
        //             data: [95.8, 89.4, 91.2, 76.9]
        //           }
        //         ]
        //     };
        //   }
        // });
