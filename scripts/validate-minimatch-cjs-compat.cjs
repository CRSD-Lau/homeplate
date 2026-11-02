"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */

const { createRequire } = require("node:module");

const eslintRequire = createRequire(require.resolve("eslint"));
const minimatch = eslintRequire("minimatch");

if (
  typeof minimatch !== "function" ||
  !minimatch("homeplate", "*") ||
  typeof minimatch.Minimatch !== "function" ||
  minimatch.minimatch !== minimatch
) {
  throw new Error("Minimatch CJS compatibility contract failed");
}

console.log("Minimatch CJS compatibility contract passed.");
