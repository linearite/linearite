import path from 'path'

import { build } from 'esbuild'
import { Builder, BuilderConfs, definePlugin } from '@linearite/core'

declare module '@linearite/core' {
  // @ts-ignore
  interface BuilderConfs extends BuilderConfs {
    esbuild: {}
  }
}

export default definePlugin({
  name: 'builder-esbuild',
  conf: {
    target: ['node12'],
    format: ['esm', 'cjs'],
    platform: ['neutral'],
  },
  call: (ctx, conf) => {
    ctx.on('build:item', async (workspace, opts) => {
      function dir(...paths: string[]) {
        return path.join(workspace.path, ...paths)
      }

      console.log('> build:item', workspace.meta.name, opts, conf)
      const format = Array.isArray(conf.format) ? conf.format : [conf.format]
      const platform = Array.isArray(conf.platform) ? conf.platform : [conf.platform]
      const matrix = [format, platform].reduce((acc, cur) => {
        return acc.flatMap((a) => cur.map((c) => [...a, c]))
      }, [] as [Builder.Platform, Builder.Format][])
      await Promise.all(matrix.map(async ([format, platform]) => {
        if (format === 'umd')
          throw new Error('esbuild not support umd format')

        if (format === 'esm' && !workspace.meta.module) {
          console.warn(`not found module field in package.json, will fallback to \`${conf.outdir}/index.mjs\``)
        }
        if (format === 'cjs' && !workspace.meta.main) {
          console.warn(`not found main field in package.json, will fallback to \`${conf.outdir}/index.js\``)
        }
        await build({
          entryPoints: [dir('src/index.ts')],
          outfile: {
            esm: dir(workspace.meta.module
              ?? `${conf.outdir}/index.mjs`),
            cjs: dir(workspace.meta.main
              ?? `${conf.outdir}/index.cjs`),
            iife: dir(workspace.meta.main?.replace(/\.js$/, '.iife.js')
              ?? `${conf.outdir}/index.iife.js`),
          }[format],
          bundle: true,
          target: conf.target,
          platform,
          format,
          external: Object.keys(workspace.meta.dependencies || {}),
        })
      }))
    })
  }
})
