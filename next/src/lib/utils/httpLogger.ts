import morgan from 'morgan';
import { logger } from './logger';

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

export const httpLogger = morgan(format, { stream });
