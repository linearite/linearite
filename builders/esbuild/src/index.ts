import path from 'path'

import { build, BuildOptions } from 'esbuild'
import { Builder, BuilderConfs, BuilderPluginConf, definePlugin, Linearite } from '@linearite/core'

declare module '@linearite/core' {
  // @ts-ignore
  interface BuilderConfs extends BuilderConfs {
    esbuild: {}
  }
}

function resolveArray<T>(arr: T | T[]) {
  return Array.isArray(arr) ? arr : [arr]
}

function createMatrix(conf: BuilderPluginConf<'builder-esbuild'>) {
  return [
    resolveArray(conf.platform),
    resolveArray(conf.format),
  ].reduce((acc, cur) => {
    return acc.flatMap((a) => cur.map((c) => [...a, c]))
  }, [[]] as ([Builder.Platform, Builder.Format] | [])[])
}

type MatrixResolver = (opts: BuildOptions) => void | Promise<void>

function useMatrix(conf: BuilderPluginConf<'builder-esbuild'>) {
  return (workspace: Linearite.Workspace, resolver: MatrixResolver) => {
    function dir(...paths: string[]) {
      return path.join(workspace.path, ...paths)
    }

    return Promise.all(createMatrix(conf)
      .map(async ([platform, format]) => {
        if (format === 'umd')
          throw new Error('esbuild not support umd format')

        if (format === 'esm' && !workspace.meta.module) {
          console.warn(`not found module field in package.json, will fallback to \`${conf.outdir}/index.mjs\``)
        }
        if (format === 'cjs' && !workspace.meta.main) {
          console.warn(`not found main field in package.json, will fallback to \`${conf.outdir}/index.js\``)
        }
        await resolver({
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
          format,
          platform,
          external: Object.keys(workspace.meta.dependencies || {}),
        })
      }))
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
    const workspaceResolver = useMatrix(conf)

    ctx.on('build:item', async (workspace, opts) => {
      console.log('> build:item', workspace.meta.name, opts, conf)
      await workspaceResolver(workspace, async buildOpts => {
        await build(buildOpts)
      })
      // log build success message
      console.log(`> build ${workspace.meta.name} success`)
    })
  }
})
