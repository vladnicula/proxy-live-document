import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

import pkg from "./package.json";

export default {
  input: `src/index.ts`,
  watch: {
    include: "src/**",
  },
  plugins: [typescript(), terser()],
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    {
      file: pkg.module,
      format: "es", // the preferred format
    },
    {
      file: pkg.browser,
      format: "iife",
      name: "PLD",
    },
  ],
};
