import { createLogger, Logger, format, transports } from 'winston';

export let log: Logger;

export function initialize(level: string) {
  log = createLogger({
    level,
    format: format.combine(
      format.cli(),
      format.splat(),
      format.simple(),
    ),
    transports: [
      new transports.Console(),
    ]
  });
}
