import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthCheckService } from './health-check.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, HealthCheckService],
  exports: [HealthService, HealthCheckService],
})
export class HealthModule {}
