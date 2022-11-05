import * as cordis from 'cordis'

import Linearite from './index'
import { Builder } from './builder'

export interface Context<B> {}

export class Context<B extends Builder.Types> extends cordis.Context<Context.Config<B>> {
  constructor(options?: Context.Config<B>) {
    super(options)
  }
}

export namespace Context {
  export interface Config<B extends Builder.Types> extends cordis.Context.Config, Linearite.Configuration<B> {
  }
}
