import { Plugin } from './context'
import { L2T } from './type'
import Linearite, { compileMacroSyntax } from './index'
import { resolveArray } from './utils'


/**
 * declare module '@linearite/core' {
 *   // ignore recusive type error, because it is work
 *   // @ts-ignore
 *   export interface BuilderConfs extends BuilderConfs {
 *     name: SpecialConf
 *   }
 * }
 */
export interface BuilderConfs {}

export namespace Builder {
  export type Platform = 'browser' | 'node' | 'neutral'
  export type Format =
    // for js
    | 'cjs' | 'esm' | 'iife' | 'umd'
    // for dts
    // all dts will be output to one file
    | 'single-dts'
    // all dts will be output to multiple files
    | 'multiple-dts'
  export type Types = keyof BuilderConfs
  export type InferName<N extends Plugin.Names> = N extends `builder-${infer B extends Types}`
    ? B : never
  export interface ExternalDef {
    /**
     * @param dep       - @see {Linearite.Workspace['meta']['dependencies']}
     * @param optDep    - @see {Linearite.Workspace['meta']['optionalDependencies']}
     * @param devDep    - @see {Linearite.Workspace['meta']['devDependencies']}
     * @param workspace - @see {Linearite.Workspace}
     */
    (
      dep: string[],
      optDep: string[],
      devDep: string[],
      workspace: Linearite.Workspace
    ): string[]
  }
  export interface Opts {
    type: Types
    target: string | string[]
    format: Format | Format[]
    platform: Platform | Platform[]
    /**
     * entry points
     * @default 'src/index.ts'
     *
     * TODO support glob
     */
    input?: string | string[]
    /**
     * @default 'dist'
     */
    outdir?: string
    /**
     * output filename, only support one entry point
     *
     * @default will fallback as follows:
     *
     * * esm: `workspace.meta.module`
     *
     * * cjs: `workspace.meta.main`
     *
     * if workspace package.json not define module or main field, will fallback to:
     *
     * '[outdir]/index.[format]'
     *
     * TODO support multi entry points
     * TODO support package.json [exports field](https://nodejs.org/api/packages.html#packages_subpath_exports)
     */
    outfile?: string | ((outdir: string, format: Format, workspace: Linearite.Workspace) => string)
    /**
     * @see https://esbuild.github.io/api/#define
     *
     * support {@link Linearite.MacroSytax} variables
     */
    define?: Record<string, string>
    minify?: boolean
    /**
     * @default workspace dependencies
     */
    external?: string[] | ExternalDef
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both'
  }
  export type Configuration<N extends Plugin.Names> =
    & Opts
    & BuilderConfs[InferName<N>]
}

type Dir = (...paths: string[]) => string

interface ResolverMap {
  input: string[]
  define: Record<string, string>
  outfile: string
  external: string[]
}

function isWhatBuilderOptsField<K extends keyof ResolverMap>(
  field: Builder.Opts[keyof ResolverMap], k: keyof ResolverMap, tK: K
): field is Builder.Opts[typeof tK] {
  return (
    [
      'input',
      'define',
      'outfile',
      'external',
    ] as L2T<keyof ResolverMap>
  ).includes(k) && k === tK
}

export function useBuilderFieldResolver<T extends Builder.Opts>(
  conf: T, {
    dir, workspace
  }: {
    dir: Dir
    workspace: Linearite.Workspace
  }
) {
  return <K extends keyof ResolverMap>(key: K): ResolverMap[K] => {
    const def = conf[key]
    if (isWhatBuilderOptsField(def, key, 'input')) {
      return (
        Array.isArray(def)
          ? def.map(i => dir(i))
          : [dir(def)]
      ) as ResolverMap['input'] as ResolverMap[K]
    }
    if (isWhatBuilderOptsField(def, key, 'outfile')) {
      let result: string
      if (typeof def === 'function') {
        result = def(
          dir(conf.outdir),
          conf.format as Builder.Format,
          workspace
        )
      }
      if (typeof def === 'string') {
        result = def
      }
      if (def === undefined) {
        // TODO resolve [exports](https://nodejs.org/docs/latest-v16.x/api/packages.html#exports)
        let dtsDir: string | undefined
        if (conf.format === 'multiple-dts') {
          dtsDir = workspace.meta.types?.replace(/[^\/]+\.d\.ts$/, '')
        }
        result = {
          esm: () => dir(workspace.meta.module
            ?? `${conf.outdir}/index.mjs`),
          cjs: () => dir(workspace.meta.main
            ?? `${conf.outdir}/index.cjs`),
          iife: () => dir(workspace.meta.main?.replace(/\.js$/, '.iife.js')
            ?? `${conf.outdir}/index.iife.js`),
          'multiple-dts': () => dtsDir
            ? dir(dtsDir)
            : `${conf.outdir}`,
          'single-dts': () => workspace.meta.types
            ? dir(workspace.meta.types)
            : `${conf.outdir}/index.d.ts`,
        }[conf.format as Builder.Format]()
      }

      return result as ResolverMap['outfile'] as ResolverMap[K]
    }
    if (isWhatBuilderOptsField(def, key, 'external')) {
      let result: string[]
      if (typeof def === 'function') {
        result = def(
          Object.keys(workspace.meta.dependencies ?? {}),
          Object.keys(workspace.meta.optionalDependencies ?? {}),
          Object.keys(workspace.meta.devDependencies ?? {}),
          workspace,
        )
      }
      if (Array.isArray(def)) {
        result = def
      }
      if (def === undefined) {
        result = Object.keys(
          workspace.meta.dependencies || {}
        ).concat(Object.keys(
          workspace.meta.optionalDependencies || {}
        ))
      }
      return result as ResolverMap['external'] as ResolverMap[K]
    }
    if (def && isWhatBuilderOptsField(def, key, 'define')) {
      Object.entries(def).forEach(([k, v]) => {
        def[k] = compileMacroSyntax(v, workspace)
      })
      return def as ResolverMap['define'] as ResolverMap[K]
    }
  }
}

export function createBuilderMatrix(conf: {
  format: Builder.Format | Builder.Format[]
  platform: Builder.Platform | Builder.Platform[]
}) {
  return (['platform', 'format'] as const)
    .map(k => resolveArray(conf[k].length === 0 ? [undefined] : conf[k]))
    .reduce((acc, cur) => {
      return acc.flatMap((a) => cur.map((c) => [...a, c]))
    }, [[]]) as [Builder.Platform, Builder.Format][]
}

export type BuilderMatrixResolver = (opts: any, matrix: ReturnType<typeof createBuilderMatrix>) => void | Promise<void>

export type MatrixItemResolver<T extends Builder.Types> = (props: {
  dir: (...paths: string[]) => string
  conf: Builder.Configuration<`builder-${T}`>
  format: Builder.Format
  platform: Builder.Platform
  workspace: Linearite.Workspace
  filedResolver: ReturnType<typeof useBuilderFieldResolver>
}) => any

export function createUseBuilderMatrix<T extends Builder.Types>(
  matrixItemResolver: MatrixItemResolver<T>
) {
  return function useMatrix(conf: Builder.Configuration<`builder-${T}`>) {
    return (workspace: Linearite.Workspace, resolver: BuilderMatrixResolver) => {
      function dir(...paths: string[]) {
        return [workspace.path, ...paths].join('/')
      }
      const matrix = createBuilderMatrix(conf)

      return Promise.all(
        matrix.map(async ([platform, format]) => {
          await resolver(matrixItemResolver({
            dir,
            conf,
            format,
            platform,
            workspace,
            filedResolver: useBuilderFieldResolver(
              Object.assign({}, conf, {
                format, platform,
              }) as Builder.Opts,
              { dir, workspace },
            )
          }), matrix)
        })
      )
    }
  }
}
