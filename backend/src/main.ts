import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

/**
 * Application bootstrap function - initializes NestJS application with global configurations.
 * This is the entry point that sets up middleware, validation, security, and API documentation.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  /**
   * Global validation pipe configuration
   * - whitelist: Strips properties that don't have decorators (security: prevents DTO pollution)
   * - forbidNonWhitelisted: Throws error if unknown properties are sent (strict validation)
   * - transform: Automatically transforms payloads to DTO instances (enables type safety)
   * - enableImplicitConversion: Converts string query params to their expected types (e.g., "1" -> 1)
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        // Aggregate all validation errors into a single, user-friendly message
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          return constraints
            ? Object.values(constraints)[0]
            : 'Validation error';
        });
        return new Error(messages.join(', '));
      },
    }),
  );

  /**
   * Global exception filter - catches all unhandled exceptions and formats them consistently.
   * Ensures proper error responses and prevents sensitive error details from leaking to clients.
   */
  app.useGlobalFilters(new AllExceptionsFilter());

  /**
   * Global interceptors - applied to all routes
   * - RequestLoggingInterceptor: Logs all incoming requests for debugging and audit purposes
   * - TimeoutInterceptor: Prevents requests from hanging indefinitely (30s default timeout)
   */
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(),
    new TimeoutInterceptor()
  );

  /**
   * CORS configuration - controls cross-origin resource sharing
   * - origin: Only allows requests from configured frontend URL (security)
   * - credentials: Enables cookies/auth headers in cross-origin requests (required for JWT cookies)
   * - methods: Explicitly defines allowed HTTP methods (security best practice)
   */
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  /**
   * Cookie parser middleware - enables reading HttpOnly cookies
   * Required for refresh token authentication strategy (stored in HttpOnly cookies for security)
   */
  app.use(cookieParser());

  /**
   * API versioning - all routes prefixed with /api/v1
   * Enables future API version migrations without breaking existing clients
   */
  app.setGlobalPrefix('api/v1');

  /**
   * Swagger/OpenAPI documentation setup
   * Provides interactive API documentation at /api/docs endpoint
   * - Bearer auth configured for JWT token testing in Swagger UI
   * - persistAuthorization: Keeps auth token in browser session for testing
   * - displayRequestDuration: Shows API response times in Swagger UI
   */
  const config = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('Real-time collaborative task management system API')
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Tasks', 'Task management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    ),
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  const port = configService.get('app.port', 3000);
  await app.listen(port);

  console.log(`🚀 TaskFlow API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
