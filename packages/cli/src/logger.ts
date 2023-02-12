import chalk from 'chalk'
import { Context, Plugin } from '@linearite/core'

export class LoggerService {
  constructor(
    public ctx: Context<Plugin.Names>
  ) {}
  log(type: 'error' | 'warn' | 'info', ...args: any[]) {
    console[type](
      chalk.blueBright(
        `[${this.ctx.pluginName ?? 'linearite'}]`
      ),
      {
        error: chalk.bgRed,
        warn: chalk.bgYellow,
        info: chalk.bgBlue
      }[type](`(${type})`),
      ...args
    )
  }
  info(...args: any[]) {
    this.log('info', ...args)
  }
  warn(...args: any[]) {
    this.log('warn', ...args)
  }
  error(...args: any[]) {
    this.log('error', ...args)
  }
}

Context.service('logger', LoggerService)
