// todo checkout https://github.com/alexjoverm/typescript-library-starter/blob/master/package.json

import typescript from 'rollup-plugin-typescript2'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import {terser} from "rollup-plugin-terser"

import pkg from './package.json'

export default {
  input: `src/index.ts`,
  watch: {
    include: 'src/**',
  },
  plugins: [
    typescript(),
    peerDepsExternal({
      packageJsonPath: './package.json'
    }),
    terser(),
  ],
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    // {
    //   file: pkg.module,
    //   format: 'es' // the preferred format
    // },
    {
      file: pkg.browser,
      format: 'iife',
      name: 'PLD' // the global which can be used in a browser
    }
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ]
}