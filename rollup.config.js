import typescript from "rollup-plugin-typescript2";
import terser from "@rollup/plugin-terser";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

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
      format: "es",
    },
  ],
};
