
import { parse } from "@babel/parser";
import { transform } from "@babel/standalone";
import { log } from "console";
import { fetchJSON } from "../api/api";

import { runFunction } from "./utils";


const moduleCache: Record<string, any> = {
  "fava-dashboards" : {status: "done", exports: api},
  "react"           : {status: "done", exports: React},
  "echarts"         : {status: "done", exports: echart}
};


//const FETCH_BASE = "/beancount/extension/FavaDashboards/myload"
const FETCH_BASE = "myload"


async function fetch_moduleSource(name: string): Promise<string> {
  console.debug(`fetching module ${name} ...`)

  const BASE_DIR = "/workspaces/fava-dashboards/example"

  if ( name.startsWith('@dashboard/') ) {
    // carica il modulo da remoto, risolvendo ...
    const path = name.split("@dashboard/")[1];
    // const source = await fetch(FETCH_BASE + "?name=" +path)
    // return source.text()

    const p = fetch(`${FETCH_BASE}?name=${path}`)
      .then(rep => rep.json())
//      .catch( reason => {throw new Error("reason is " + reason)})
      .then(j => {
        if (j.success) {
          return j.data
        }
        else throw new Error(`cannot load module ${name}, reason: ${j.error}`)
      })

    const source = await p
    return source
  }

  //return ""
  //console.error(`Ignoring unsupported fetch: ${name}`)
  throw new Error(`Unsupported fetch: ${name}`);

}


function collect_imports(source: string) {

  const ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  const imports = ast.program.body
    .filter((node) => node.type === "ImportDeclaration")
    .map((node) => node.source.value);

  console.log(imports);

  return imports
}


const require = (name: string): unknown => {
  const hit = moduleCache[name];
  if (!hit) {
    throw new Error(`Module not found: ${name}`);
  }

  // If the module is still loading, return its exports placeholder to support circular dependencies.
  console.debug(`require '${name}' hit cache ${JSON.stringify(hit)}`)
  return hit.exports;
}

async  function resolve(name: string, dependencies: Record<string, unknown>) {
  const hit = moduleCache[name]
  if (hit) {
    console.debug(`module ${name} hit cache ${JSON.stringify(hit)}`)
    return moduleCache[name].exports.default; // già caricato
  }

  // carica i sorgenti
  // ed analizza le dipendenze
  const code = await fetch_moduleSource(name)

  //console.debug(code)
  const imports = collect_imports(code);

  moduleCache[name] = {
    status: "loading",
    exports: null,
    imports: imports
  }

  // Carica ricorsivamente gli altri moduli
  for (const m of imports) {
    await resolve(m, dependencies)
  }

  // Transform TSX into CommonJS using @babel/standalone
  const transformedCode = transform(code, {
    sourceType: "module",
    filename: name,
    presets: ["react", "typescript"],
    plugins: ["transform-modules-commonjs"],
  });

  if (!transformedCode.code) {
    throw new Error("Error transforming TSX to JavaScript");
  }

  console.debug(`module ${name} TRANSPILED CODE`, transformedCode.code)
  // evaluate JS module
  // Evaluate JS using the custom require() function
  const module = { exports: { default: {} as Record<string, unknown> | undefined } };
  //console.log(transformedCode.code)
  runFunction(transformedCode.code, { require, module, exports: module.exports });


  moduleCache[name].exports = module.exports
  moduleCache[name].status = "done"
  return module.exports.default ?? {};
}

import * as echart from "echarts"
import * as api from "../index";
import React from "react";



// export async function loadDashboard(js: string) {
//   console.debug("Loading dashboard config",js)
//   const result = await load("@dashboard/mine.tsx")
//   return result
// }
// ---------------------------------------------------------------------------

export async function loadTSX(code: string, dependencies: Record<string, unknown>): Promise<Record<string, any>> {
  console.log("Loading TSX dashboards ...")
  const imports = collect_imports(code);
  // Carica ricorsivamente gli altri moduli
  for (const m of imports) {
    await resolve(m, dependencies)
  }

  moduleCache["@dashboard"] = {
    status: "loading",
    exports: null,
    imports: imports
  }

  // Transform TSX into CommonJS using @babel/standalone
  const transformedCode = transform(code, {
    sourceType: "module",
    filename: "dashboard.tsx",
    presets: ["react", "typescript"],
    plugins: ["transform-modules-commonjs"],
  });
  if (!transformedCode.code) {
    throw new Error("Error transforming TSX to JavaScript");
  }

  // Evaluate JS using the custom require() function
  const module = { exports: { default: {} as Record<string, unknown> | undefined } };
  runFunction(transformedCode.code, { require, module, exports: module.exports });
  return module.exports.default ?? {};
}

