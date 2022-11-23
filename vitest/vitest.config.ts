import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    // read all the aliases from tsconfig (so @app, @portal etc will work)
    tsconfigPaths(),
  ],
  test: {
    // ...
    coverage: {
      provider: 'c8', // or 'istanbul'
    },
  },
})
