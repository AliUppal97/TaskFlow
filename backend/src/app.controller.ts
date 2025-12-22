import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { CacheService } from './common/cache/cache.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get application info' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint with system status' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  async getHealth() {
    const cacheStats = await this.cacheService.getStats();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        cache: {
          connected: cacheStats.connected,
          type: cacheStats.storeType,
        },
      },
    };
  }

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ping endpoint for connectivity check' })
  @ApiResponse({ status: 200, description: 'Pong' })
  getPing() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }
}
