import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  VersioningMiddleware,
  CURRENT_VERSION,
  DEPRECATED_VERSIONS,
} from './common/versioning/versioning.middleware';
import { VersionAnalyticsInterceptor } from './common/versioning/version-analytics.interceptor';
import { VersionAnalyticsService } from './common/versioning/version-analytics.service';
import { GracefulShutdownService } from './common/services/graceful-shutdown.service';
import { createSecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: CURRENT_VERSION,
  });

  // Apply security headers middleware
  app.use(helmet.default());
  app.use(createSecurityHeadersMiddleware());

  // Apply compression middleware with optimized settings
  app.use(
    compression({
      threshold: 1024, // 1KB threshold - only compress responses larger than 1KB
      level: 6, // Balanced compression level (1-9, where 9 is best compression but slowest)
      filter: (req, res) => {
        // Don't compress responses with Cache-Control: no-transform
        if (req.headers['cache-control']?.includes('no-transform')) {
          return false;
        }
        // Use default compression filter
        return compression.filter(req, res);
      },
    }),
  );

  // Add Vary header for proper caching with compression
  app.use((req, res, next) => {
    res.set('Vary', 'Accept-Encoding');
    next();
  });

  // Register header-based version negotiation + deprecation warnings
  const versioningMiddleware = new VersioningMiddleware();
  app.use(versioningMiddleware.use.bind(versioningMiddleware));

  // Register version analytics interceptor globally
  const versionAnalytics = app.get(VersionAnalyticsService);
  app.useGlobalInterceptors(new VersionAnalyticsInterceptor(versionAnalytics));

  app.useGlobalFilters(new AllExceptionsFilter());
   app.useGlobalPipes(
     new ValidationPipe({
       whitelist: true,
       forbidNonWhitelisted: true,
       transform: true,
     }),
   );

   // CORS Configuration
   // Allows cross-origin requests from specified origins with credentials
   // Configure allowed origins via CORS_ORIGINS env variable (comma-separated)
   const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['*'];
   app.enableCors({
     origin: allowedOrigins,
     credentials: true,
     methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
     allowedHeaders: [
       'Content-Type',
       'Authorization',
       'X-Requested-With',
       'Accept',
       'Origin',
     ],
     exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
     maxAge: 86400, // Preflight caching for 24 hours (in seconds)
   });

    // Swagger setup with comprehensive documentation
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Nestera API')
      .setDescription(
        'API documentation for the Nestera platform\n\n' +
        '## Authentication\n' +
        'All protected endpoints require a Bearer token obtained via the authentication endpoints.\n' +
        'Include the token in the `Authorization` header: `Bearer <your-token>`\n\n' +
        '## Rate Limiting\n' +
        'The API implements rate limiting to ensure fair usage:\n' +
        '- **General endpoints**: 100 requests per minute\n' +
        '- **Auth endpoints**: 5 requests per 15 minutes\n' +
        '- **RPC/Blockchain endpoints**: 10 requests per minute\n\n' +
        'Rate limit headers are included in responses:\n' +
        '- `X-RateLimit-Limit`: Request limit per window\n' +
        '- `X-RateLimit-Remaining`: Remaining requests in current window\n' +
        '- `X-RateLimit-Reset`: Time (seconds) until limit resets\n\n' +
        '## CORS Policy\n' +
        'Cross-origin requests are configured through the `CORS_ORIGINS` environment variable.\n' +
        '- Development: `CORS_ORIGINS=*` allows all origins\n' +
        '- Production: Specify exact origins (e.g., `CORS_ORIGINS=https://nestera.io,https://app.nestera.io`)\n\n' +
        '## Error Responses\n' +
        'All endpoints follow standard HTTP status codes:\n' +
        '- `200` - Success\n' +
        '- `201` - Created\n' +
        '- `400` - Bad request (validation error)\n' +
        '- `401` - Unauthorized (missing or invalid token)\n' +
        '- `403` - Forbidden (insufficient permissions)\n' +
        '- `404` - Resource not found\n' +
        '- `429` - Too many requests (rate limit exceeded)\n' +
        '- `500` - Internal server error',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port || 3001);
  // Swagger setup — one document per supported version
  for (const version of ['1', '2']) {
    const deprecation = DEPRECATED_VERSIONS[version];
    const swaggerConfig = new DocumentBuilder()
      .setTitle(`Nestera API v${version}`)
      .setDescription(
        version === '1'
          ? 'API v1 — DEPRECATED. Sunset: 2026-09-01. Migrate to v2.'
          : 'API v2 — Current stable version.',
      )
      .setVersion(version)
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`api/v${version}/docs`, app, document);
  }

  const server = await app.listen(port || 3001);
  const logger = app.get(Logger);
  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(
    `Swagger v1 docs (deprecated): http://localhost:${port}/api/v1/docs`,
  );
  logger.log(`Swagger v2 docs: http://localhost:${port}/api/v2/docs`);

  // Setup graceful shutdown
  const gracefulShutdown = app.get(GracefulShutdownService);

  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, starting graceful shutdown...`);
      server.close(async () => {
        await app.close();
        process.exit(0);
      });
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Bootstrap] Application startup failed: ${message}`);
  process.exit(1);
});
