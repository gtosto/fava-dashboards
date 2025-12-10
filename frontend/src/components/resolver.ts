
import { parse } from "@babel/parser";
import { transform } from "@babel/standalone";
import { log } from "console";


//import { loadTSX, runAsyncFunction } from "./utils";
//import fs from "fs";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runFunction<T>(src: string, args: Record<string, any> = {}): Promise<T> {
  const paramNames = Object.keys(args);
  const paramValues = Object.values(args);

  const fn = new Function(...paramNames, src);
  //console.log(`returing function: ${fn.name} from ${fn.toString()}`)
  return fn(...paramValues);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runAsyncFunction<T>(src: string, args: Record<string, any> = {}): Promise<T> {
  const paramNames = Object.keys(args);
  const paramValues = Object.values(args);

  const AsyncFunction = async function () {}.constructor;
  const fn = AsyncFunction(...paramNames, src);
  return fn(...paramValues);
}


const FETCH_BASE = "/beancount/extension/FavaDashboards/myimport"

//const moduleCache = Object.create(null);
const moduleCache: Record<string, any> = Object.create(null);

async function fetch_moduleSource(name: string): Promise<string> {
  console.debug(`fetching module ${name} ...`)

  const BASE_DIR = "/workspaces/fava-dashboards/example"

  if ( name.startsWith('@dashboard/') ) {
    // carica il modulo da remoto, risolvendo ...
    const path = name.split("@dashboard/")[1];
    const source = await fetch(FETCH_BASE + "?name=" +path)
    // const source = await fs.readFile(BASE_DIR + path, "utf8");
    return source.text()
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

async function load(name: string) {
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
  for (const d of imports) {
    await load(d)
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


const source =
`
import React from "react";
import { Panel } from "fava-dashboards";

import {aaa} from "@dashboard/panel/due"
`;

import * as echart from "echarts"
import * as api from "../index";
import React from "react";
moduleCache["fava-dashboards"] = {
  status: "done",
  exports: api
}

moduleCache["echarts"] = {
  status: "done",
  exports: echart
}

moduleCache["react"] = {
  status: "done",
  exports: React
}

export async function loadDashboard(js: string) {
  console.debug("Loading dashboard config",js)
  const result = await load("@dashboard/mine.tsx")
  return result
}

// GOAL
// const dynamicConfig = loadTSX(config.configJs, dependencies);


// console.log("aaaaa2")
// //const static_imports = collect_imports(source)
// const result = await load("@dashboard/mine.tsx")
// console.log("done")

