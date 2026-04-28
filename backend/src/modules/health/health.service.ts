import { Injectable } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';

@Injectable()
export class HealthService {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  getHealth() {
    return this.healthCheckService.getBasicHealth();
  }
}
