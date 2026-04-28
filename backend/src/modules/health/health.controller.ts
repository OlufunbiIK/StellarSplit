import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckService } from './health-check.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: HttpStatus.OK, description: 'API is healthy' })
  health() {
    return this.healthService.getHealth();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe - is the service running?' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service is alive' })
  liveness() {
    return this.healthCheckService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe - can the service handle requests?' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service is ready to handle requests' })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: 'Service is not ready' })
  async readiness() {
    return this.healthCheckService.getReadiness();
  }
}
