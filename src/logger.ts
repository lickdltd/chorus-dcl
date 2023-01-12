export class Logger {
    private static PREFIX = '[lickd-chorus]'

    static log(...args: any[]) {
        log(Logger.PREFIX, ...args)
    }
}
