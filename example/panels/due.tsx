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

export const MyHtmlPanel = {
  title: "My HTML Panel",
  kind: "html",
  height: "50",
  spec: () => {
    return "<h1>HHHHHHHHHHH</h1>"
  }
} as Panel


