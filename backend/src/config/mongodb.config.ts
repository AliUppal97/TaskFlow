import { ConfigService } from '@nestjs/config';

export const getMongoConfig = (configService: ConfigService) => ({
  uri: configService.get('mongodb.uri', 'mongodb://localhost:27017/taskflow'),
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
