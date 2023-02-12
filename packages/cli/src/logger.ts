import chalk from 'chalk'
import { Context, Plugin } from '@linearite/core'

export class LoggerService {
  constructor(
    public ctx: Context<Plugin.Names>
  ) {}
  log(tag: string, type: 'error' | 'warn' | 'info', ...args: any[]) {
    console[type](
      chalk.blueBright(
        `[${tag ?? 'linearite'}]`
      ),
      {
        error: chalk.bgRed,
        warn: chalk.bgYellow,
        info: chalk.bgBlue
      }[type](`(${type})`),
      ...args
    )
  }
  info(tag: string, ...args: any[]) {
    this.log(tag, 'info', ...args)
  }
  warn(tag: string, ...args: any[]) {
    this.log(tag, 'warn', ...args)
  }
  error(tag: string, ...args: any[]) {
    this.log(tag, 'error', ...args)
  }
}

Context.service('logger', LoggerService)
