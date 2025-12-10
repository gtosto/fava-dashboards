/*
*/
import {graphic} from "echarts";

import { Panel } from "fava-dashboards";
import * as Colors from '@dashboard/common/skin.ts'
import * as Utils from '@dashboard/common/utils.ts'

export const MyStats = {
  title: "Mystats",
  width: "50%",
  kind: "echarts",
  spec: async ({ ledger, variables }) => {

    const result = await ledger.query(`
      SELECT account, MAX(date) AS last_date
      where account ~ '^Assets:'
      GROUP BY account
      ORDER BY account DESC;
      `
    );

    // const dataset = result.map((row) => ({
    //   account: row.account,
    //   value: row.value[variables.currency],
    // }));

    const categories = result.map(d => d.account);

    // converto le date in millisecondi
    // const [minDate, maxDate] = {

    // }
    const timestamps = result.map(row => new Date(row.last_date).getTime());

    // calcolo automatico min e max
    const minDate = Math.min(...timestamps) - 1000;
    const maxDate = Math.max(...timestamps) + 1000;

    const scatterData = result.map(d => {
      const t = new Date(d.last_date).getTime();

      // trasparenza in base alla data: più recente = più opaco
      const alpha = Math.max(0.15, Math.min(1, (t - minDate) / (maxDate - minDate)));
      return {
        name: d.account,
        value: [d.last_date, d.account],
        itemStyle: {
          color: new graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 1, color: 'rgba(30,132,255,0)' },
              { offset: 0, color: `rgba(30,132,255, 0.85 )` }
            ])
        }
      };
    });

    return {
      title: {
        text: 'Ultime transazioni per account'
      },
      tooltip: {
        trigger: 'item',
        formatter: params =>
          params.value[1] + "<br/>" + "Data: " + params.value[0]
      },
      xAxis: {
        type: 'time',
        // min: '2020-01-01',
        // max: '2023-12-31',
        name: 'time',
        axisLine: { show: true},
        splitLine: {show: true },
        minInterval: 3600 * 24 * 15 * 1000,  // forzare intervallo minimo = ~1 mese
        axisLabel: {
          formatter: function (value) {
            const date = new Date(value);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return monthNames[date.getMonth()] + " " + date.getFullYear();
          }
        }
      },
      yAxis: {
        type: 'category',
        data: categories,
        name: 'Account'
      },
      series: [
        {
          type: 'bar',
          symbolSize: 12,
          data: scatterData
        }
      ]
    };
  },

  // const table: TableSpec<Row> = {
  //   columns: [
  //     { field: "date", minWidth: 100 },
  //     { field: "account", flex: 0.5 },
  //     {
  //       field: "position",
  //       minWidth: 200,
  //       valueGetter: (_value, row) => row.position.units.number,
  //       valueFormatter: (_value, row) => `${row.position.units.number} ${row.position.units.currency}`,
  //     },
  //   ],
  //   rows: rows.map((row, i) => ({ ...row, id: i })),
  // };
  // return table;

}

