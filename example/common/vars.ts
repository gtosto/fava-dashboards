import {
  VariableDefinition,
} from "fava-dashboards";


export type SunburstNode = {
  name?: string;
  value?: number;
  children: SunburstNode[];
};


export const currencyVariable: VariableDefinition = {
  name: "currency",
  label: "Currency",
  options: async ({ ledger }) => {
    return ledger.operatingCurrencies;
  },
};
