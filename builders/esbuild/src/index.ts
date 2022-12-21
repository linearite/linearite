import path from 'path'

import { build, BuildOptions } from 'esbuild'
import {
  Builder,
  BuilderConfs,
  definePlugin,
  Linearite, resolveBuilderOpts,
  useBuilderFieldResolver
} from '@linearite/core'

declare module '@linearite/core' {
  // @ts-ignore
  interface BuilderConfs extends BuilderConfs {
    esbuild: {}
  }
}

function resolveArray<T>(arr: T | T[]) {
  return Array.isArray(arr) ? arr : [arr]
}

function createMatrix(conf: Builder.Configuration<'builder-esbuild'>) {
  return [
    resolveArray(conf.platform),
    resolveArray(conf.format),
  ].reduce((acc, cur) => {
    return acc.flatMap((a) => cur.map((c) => [...a, c]))
  }, [[]] as ([Builder.Platform, Builder.Format] | [])[])
}

type MatrixResolver = (opts: BuildOptions, matrix: ReturnType<typeof createMatrix>) => void | Promise<void>

function useMatrix(conf: Builder.Configuration<'builder-esbuild'>) {
  return (workspace: Linearite.Workspace, resolver: MatrixResolver) => {
    function dir(...paths: string[]) {
      return path.join(workspace.path, ...paths)
    }

    const matrix = createMatrix(conf)

    return Promise.all(
      matrix.map(async ([platform, format]) => {
        if (format === 'umd')
          throw new Error('esbuild not support umd format')

        if (format === 'esm' && !workspace.meta.module) {
          console.warn(`not found module field in package.json, will fallback to \`${conf.outdir}/index.mjs\``)
        }
        if (format === 'cjs' && !workspace.meta.main) {
          console.warn(`not found main field in package.json, will fallback to \`${conf.outdir}/index.js\``)
        }

        const filedResolver = useBuilderFieldResolver(
          Object.assign({}, conf, {
            format, platform,
          }) as Builder.Opts,
          { dir, workspace },
        )

        await resolver({
          define: filedResolver('define'),
          outfile: filedResolver('outfile'),
          external: filedResolver('external'),
          entryPoints: filedResolver('input'),

          bundle: true,
          target: conf.target,
          minify: conf.minify,
          format,
          platform,
          sourcemap: conf.sourcemap,
        }, matrix)
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
  call: ctx => {
    const {
      corlorful,
    } = ctx
    ctx.on('build:item', async (workspace, opts) => {
      const confs = ctx.overides.calc(workspace)
      await Promise.all(confs.map(async ({ builder }) => {
        const [, conf] = resolveBuilderOpts(builder)
        const matrixResolver = useMatrix(conf)
        console.log('> build:item', workspace.meta.name, opts, conf)
        let continueCount = 0
        const watchOpts = {
          onRebuild(error) {
            if (error) {
              console.error(corlorful.red('build failed'), error)
              continueCount = 0
            } else
              // log success message and rewrite line
              process.stdout.write(corlorful.green(`\rbuild succeeded (X${++continueCount})`))
          }
        } as BuildOptions['watch']
        await matrixResolver(workspace, async buildOpts => {
          await build({
            ...buildOpts,
            watch: opts.watch ? watchOpts : undefined,
          })
        })
        console.log(
          !opts.watch
            ? corlorful.green(`build ${workspace.meta.name} success`)
            : corlorful.green(`watching ${workspace.meta.name}`)
        )
      }))
    })
  }
})
