import { ConfigService } from '@nestjs/config';

export const getRedisConfig = (configService: ConfigService) => ({
  host: configService.get('redis.host', 'localhost'),
  port: configService.get('redis.port', 6379),
  password: configService.get('redis.password'),
  db: configService.get('redis.db', 0),
  keyPrefix: 'taskflow:',
  ttl: 3600, // 1 hour default TTL
});



