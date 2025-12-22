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

export const SavingsHeatmap =         {
          title: "Savings Heatmap 💰",
          width: "100%",
          height: "400px",
          link: "../../income_statement/",

          kind: "echarts",
          spec: async ({ ledger, variables }) => {
            const currencyFormatter = getCurrencyFormatter(variables.currency);
            const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" }).format;
            const years = iterateYears(ledger.dateFirst, ledger.dateLast);

            const result = await ledger.query(
              `SELECT year, month, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
               WHERE account ~ '^(Income|Expenses):'
               GROUP BY year, month`,
            );

            // the beancount query only returns months where there was at least one matching transaction, therefore we group by month
            const monthly: Record<string, number> = {};
            const yearly: Record<number, number> = {};
            for (const row of result) {
              const savings = -row.value[variables.currency];
              monthly[`${row.year}-${row.month}`] = savings;
              yearly[row.year] = (yearly[row.year] ?? 0) + savings;
            }

            const data: [string, number][] = [];
            for (const year of years) {
              data.push([`${year}`, yearly[year] ?? 0]);
              for (let month = 1; month <= 12; month++) {
                data.push([`${year}-${month}`, monthly[`${year}-${month}`] ?? 0]);
              }
            }
            const max = Math.max(...data.map(([label, val]) => (label.includes("-") ? Math.abs(val) : 0)));
            const maxRounded = Math.round(max * 100) / 100;

            return {
              tooltip: {
                position: "top",
                valueFormatter: anyFormatter(currencyFormatter),
              },
              grid: {
                top: 30,
                height: Math.min(50 * years.length, 280),
                bottom: 100, // space for visualMap
              },
              xAxis: {
                type: "category",
              },
              yAxis: {
                type: "category",
              },
              visualMap: {
                min: -maxRounded,
                max: maxRounded,
                calculable: true, // show handles
                orient: "horizontal",
                left: "center",
                bottom: 0, // place visualMap at bottom of chart
                itemHeight: 400, // width
                inRange: {
                  color: ["#af3d3d", "#fff", "#3daf46"],
                },
                formatter: anyFormatter(currencyFormatter),
              },
              series: [
                {
                  type: "heatmap",
                  data: data.map(([label, value]) => {
                    if (!label.includes("-")) {
                      return ["Entire Year", label, value];
                    }

                    const [year, month] = label.split("-");
                    const monthLocale = monthFormatter(new Date(parseInt(year), parseInt(month) - 1, 1));
                    return [monthLocale, year, value];
                  }),
                  label: {
                    show: true,
                    formatter: (params: any) => currencyFormatter(params.data[2]),
                  },
                  emphasis: {
                    itemStyle: {
                      shadowBlur: 10,
                      shadowColor: "rgba(0, 0, 0, 0.5)",
                    },
                  },
                },
              ],
              onClick: (event) => {
                let time = data[event.dataIndex][0];
                if (time.includes("-")) {
                  const [year, month] = time.split("-");
                  time = `${year}-${month.padStart(2, "0")}`;
                }
                const link = "../../income_statement/?time={time}".replace("{time}", time);
                window.open(ledger.urlFor(link));
              },
            };
          },
        }

export const ExpenseCaldendarHeatmap =         {
          title: "Expenses Calendar Heatmap 📅",
          width: "100%",
          height: "450px",

          kind: "echarts",
          spec: async ({ ledger, variables }) => {
            const result = await ledger.query(
              `SELECT date, root(account, 2) AS account, CONVERT(SUM(position), '${variables.currency}', LAST(date)) AS value
              WHERE account ~ '^Expenses:'
              GROUP BY account, date`,
            );

            // dirty hack for dark mode fix for the calendar heatmap
            const storedThemeSetting = document.documentElement.style.colorScheme;
            const isDarkMode =
              storedThemeSetting == "dark" ||
              (window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches &&
                storedThemeSetting != "light");
            const outerLineStyleColor = isDarkMode ? "lightgray" : "black";

            const amounts: Record<string, number> = {};
            const counts: Record<number, number> = {};

            let maxAmount = 0;
            for (const row of result) {
              if (isNaN(row.value[variables.currency])) {
                continue;
              }
              if (!amounts[row.date]) {
                amounts[row.date] = row.value[variables.currency];
              } else {
                amounts[row.date] += row.value[variables.currency];
              }
              maxAmount = Math.max(maxAmount, amounts[row.date]);

              const year = row.date.substring(0, 4);
              if (!counts[year]) {
                counts[year] = 1;
              } else {
                counts[year] += 1;
              }
            }
            const allValues = Object.values(amounts).sort((a, b) => a - b);
            const percentileValue = allValues[Math.floor(allValues.length * 0.95)];

            const maxScaleValue = percentileValue;

            let mostMentionedYearCounts = -1;
            for (const [_year, count] of Object.entries(counts)) {
              if (count > mostMentionedYearCounts) {
                mostMentionedYearCounts = count;
              }
            }

            let allYears = Object.keys(counts);
            allYears = allYears.slice(0, 3);
            const calendars = allYears.map((year, ind) => ({
              left: 80,
              right: 100,
              top: ind * 150,
              cellSize: [10, 15],
              range: year,
              splitLine: {
                lineStyle: {
                  color: outerLineStyleColor,
                },
              },
              itemStyle: {
                borderWidth: 0.5,
              },
              dayLabel: {
                firstDay: 1,
              },
              yearLabel: {
                show: true,
                margin: 40,
              },
            }));
            const seriesData = allYears.map((year, ind) => ({
              type: "heatmap" as const,
              coordinateSystem: "calendar" as const,
              calendarIndex: ind,
              data: Object.entries(amounts),
            }));

            return {
              tooltip: {
                position: "top",
                formatter: function (params: any) {
                  return (
                    params.data[0] +
                    ":<br/>" +
                    "<b style='font-weight: 700'>" +
                    params.data[1] +
                    ` ${variables.currency}` +
                    "</b>"
                  );
                },
              },
              visualMap: [
                {
                  min: 0,
                  max: maxScaleValue,
                  calculable: true,
                  orient: "vertical",
                  top: "middle",
                  right: 10,
                  itemHeight: 300,
                },
              ],
              calendar: calendars,
              series: seriesData,
              onClick: (event) => {
                const link = "../../journal/?time={time}"
                  .replace("{time}", (event.data as string[])[0])
                  .replace("{account}", "");
                window.open(ledger.urlFor(link));
              },
            };
          },
        }
