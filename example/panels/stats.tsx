/*
*/

import { Panel } from "fava-dashboards";
import * as Colors from '@dashboard/common/skin.ts'
import * as Utils from '@dashboard/common/utils.ts'

export const MyStats = {
  title: "Mystats",
  kind: "echarts",
  spec: async({ledger, variables}) => {

    const result = await ledger.query(`
      SELECT account, MAX(date) AS last_txn
      where account ~ '^Assets:'
      GROUP BY account
      ORDER BY last_txn DESC;
      `
    );

    const dataset = result.map((row) => ({
      account: row.account,
      value: row.value[variables.currency],
    }));

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
}
