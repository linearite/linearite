import * as cordis from 'cordis'

import Linearite from './index'

export interface Context {}

export class Context extends cordis.Context<Context.Config> {
  constructor(options?: Context.Config) {
    super(options)
  }
}

export namespace Context {
  export interface Config extends cordis.Context.Config, Linearite.Configuration {
  }
}
