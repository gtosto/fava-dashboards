import { transform } from "@babel/standalone";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runFunction<T>(src: string, args: Record<string, any> = {}): Promise<T> {
  const paramNames = Object.keys(args);
  const paramValues = Object.values(args);

  const fn = new Function(...paramNames, src);
  console.log(`returing function: ${fn.name} from ${fn.toString()}`)
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

import React, { useState, useEffect } from "react";

async function fetchData() {
  const res = await fetch("/beancount/extension/FavaDashboards/myimport");
  const text = await res.json();

  console.log(text)
}


export function loadTSX(code: string, dependencies: Record<string, unknown>): Record<string, unknown> {

  console.log("TSX loader — received deps:", dependencies);


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

  // const dynamicLoader = async (path: string) => {
  //   console.log(`loading mod from path ${path}`)
  //   const url = "/beancount/extension/FavaDashboards/myimport"

  //   import(url)
  //     .then ( (mod) => {
  //       console.log(`module loaded:`)
  //       console.dir(mod)
  //     })
  //     .catch( (err) => console.error("error loading module",err))
  // }

  // Custom require function to load dependencies
  const require = (name: string): unknown => {
    const dependency = dependencies[name];
    console.log(`require called for: ${name}`, dependencies)
    if (!dependency) {
      /*
        if (name.startsWith("@mine")) {
          console.log(`fetching ${name} ...`)
          fetch("/beancount/extension/FavaDashboards/myimport")
            .then( rep => rep.text() )
            .then( data => {


              const transformedCode = transform(data, {
                sourceType: "module",
                filename: "aaaa.tsx",
                presets: ["react", "typescript"],
                plugins: ["transform-modules-commonjs"],
              });

              //console.log("transformed is ", transformedCode.code)
              const module = { exports: { default: {} as Record<string, unknown> | undefined } };
              runFunction(transformedCode.code, { require, module, exports: module.exports });

              return module.exports.default ?? {};

              dependencies[name] = {};
            })
            .catch( (err) => { console.error("error", err)})
        }
        // console.log(`resolving module ${name}`)
        // import("/beancount/extension/FavaDashboards/myimport")
        //   .then( (mod) => {
        //     console.log(`loaded mod ${mod}`)
        //     console.log(mod.namedExport);
        //     return mod.default()
        //   })
        //   .catch( (err) => console.error("error importig mod",err))
      */
      throw new Error(`Unsupported import: ${name}`);
      //throw new Error(`Unsupported mod: ${mod} at path: ${name}`);

    }
    return dependency;
  };

  // Evaluate JS using the custom require() function
  const module = { exports: { default: {} as Record<string, unknown> | undefined } };
  console.log(transformedCode.code)
  runFunction(transformedCode.code, { require, module, exports: module.exports });

  return module.exports.default ?? {};
}

// // cache dei moduli precaricati
// const moduleCache = Object.create(null);

// // require sincrono
// export function requireSync(name: string) {
//   if (!(name in moduleCache)) {
//     throw new Error("Module not preloaded: " + name);
//   }
//   return moduleCache[name];
// }

// // preload asincrono dei moduli dal server
// export async function preloadModule(name: string, url:string) {
//   const response = await fetch("/beancount/extension/FavaDashboards/myimport");
//   if (!response.ok) throw new Error("Failed to fetch " + url);
//   const code = await response.text();

//   // opzionale: trasformare con Babel se è TSX/JSX
//   const compiled = transform(code, {
//     presets: ["react", "typescript"],
//     plugins: ["transform-modules-commonjs"],
//   }).code;

//   // esecuzione in sandbox
//   const module = { exports: {} };
//   const func = new Function("require", "module", "exports", compiled);
//   func(requireSync, module, module.exports);

//   // salva in cache
//   moduleCache[name] = module.exports;
// }
