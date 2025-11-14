import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '../../shared/config/winston.config';
import { LoggingInterceptor } from './logging.interceptor';

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
  ],
  providers: [LoggingInterceptor],
  exports: [WinstonModule, LoggingInterceptor],
})
export class LoggerModule { }
