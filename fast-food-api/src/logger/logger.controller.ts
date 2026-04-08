import { Controller, Get, Query } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Controller('logs-local')
export class LoggerController {
  constructor(private logger: LoggerService) {}

  @Get()
  getLogs(@Query('limite') limite = '50') {
    return this.logger.getLogs(Number(limite));
  }

  @Get('antes-de-error')
  getAntesDeError() {
    return this.logger.getUltimosAntesDeError();
  }
}