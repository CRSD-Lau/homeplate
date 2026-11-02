"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */

const implementation = require("minimatch-v11");
const callable = implementation.minimatch;

Object.assign(callable, implementation);

module.exports = callable;
