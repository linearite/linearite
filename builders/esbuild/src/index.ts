import { build, BuildOptions } from 'esbuild'
import {
  BuilderConfs, createUseBuilderMatrix,
  definePlugin,
  resolveBuilderOpts,
} from '@linearite/core'

declare module '@linearite/core' {
  // @ts-ignore
  interface BuilderConfs extends BuilderConfs {
    esbuild: {}
  }
}

const useMatrix = createUseBuilderMatrix<'esbuild'>(({
  conf,
  format,
  platform,
  workspace,
  filedResolver
}) => {
  if (format === 'umd')
    throw new Error('esbuild not support umd format')
  if (format === 'esm' && !workspace.meta.module)
    console.warn(`not found module field in package.json, will fallback to \`${conf.outdir}/index.mjs\``)
  if (format === 'cjs' && !workspace.meta.main)
    console.warn(`not found main field in package.json, will fallback to \`${conf.outdir}/index.js\``)

  return {
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
  } as BuildOptions;
})

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
      const confs = ctx.overrides.calc(workspace)
      await Promise.all(confs.map(async ({ builder }) => {
        const [, conf] = resolveBuilderOpts(builder)
        if (conf.type !== 'esbuild') return

        const matrixResolver = useMatrix(conf)
        ctx.logger.info(ctx.pluginName, 'build:item', workspace.meta.name, opts, conf)
        let continueCount = 0
        const watchOpts = {
          onRebuild(error) {
            if (error) {
              ctx.logger.error(ctx.pluginName, 'build failed', error)
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
        ctx.logger.info(
          ctx.pluginName,
          !opts.watch
            ? `build:item ${workspace.meta.name} success`
            : `build:item is watching ${workspace.meta.name}`
        )
      }))
    })
  }
})
