import { Plugin } from './context'
import Linearite from './index'

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
  export type Format = 'cjs' | 'esm' | 'iife' | 'umd'
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
     * @default will falback as follows:
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
  outfile: string
  external: string[]
}

type L2T<L, LAlias = L, LAlias2 = L> = [L] extends [never]
  ? []
  : L extends infer LItem
    ? [LAlias, ...L2T<Exclude<LAlias2, LItem>, LAlias>]
    : never

function isWhatBuilderOptsField<K extends keyof ResolverMap>(
  field: Builder.Opts[keyof ResolverMap], k: keyof ResolverMap, tK: K
): field is Builder.Opts[typeof tK] {
  return (
    [
      'input',
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
        result = {
          esm: dir(workspace.meta.module
            ?? `${conf.outdir}/index.mjs`),
          cjs: dir(workspace.meta.main
            ?? `${conf.outdir}/index.cjs`),
          iife: dir(workspace.meta.main?.replace(/\.js$/, '.iife.js')
            ?? `${conf.outdir}/index.iife.js`),
        }[conf.format as Builder.Format]
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
  }
}
