import path from 'path'

import { build } from 'esbuild'
import { definePlugin } from '@linearite/core'

declare module '@linearite/core' {
  namespace Builder {
    // @ts-ignore
    interface Confs extends Builder.Confs {
      esbuild: {}
    }
  }
}

export default definePlugin({
  name: 'builder-esbuild',
  conf: {
    target: ['node12'],
    format: ['esm', 'cjs'],
  },
  call: (ctx, conf) => {
    ctx.on('build:item', async (workspace, opts) => {
      function dir(...paths: string[]) {
        return path.join(workspace.path, ...paths)
      }

      console.log('> build:item', workspace.meta.name, opts, conf)
      const format = Array.isArray(conf.format) ? conf.format : [conf.format]
      await Promise.all(format.map(async (format) => {
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
          platform: 'node',
          format,
          external: Object.keys(workspace.meta.dependencies || {}),
        })
      }))
    })
  }
})
