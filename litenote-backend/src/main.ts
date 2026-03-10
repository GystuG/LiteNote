import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 提升请求体大小限制（图片 base64 编码较大）
  app.useBodyParser('json', { limit: '10mb' });

  // 配置静态文件服务（用于头像等上传文件）
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS for React Native
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger API文档配置
  const config = new DocumentBuilder()
    .setTitle('智能记账 API')
    .setDescription('智能记账后端 API 文档，包含记账、分类管理、预算追踪、AI 助手等功能')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '请输入JWT token',
      },
      'JWT-auth',
    )
    .addTag('auth', '用户认证')
    .addTag('bills', '账单管理')
    .addTag('categories', '分类管理')
    .addTag('app-version', '应用版本管理')
    .addServer(`http://localhost:${process.env.PORT ?? 3000}`, '开发环境')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
    },
    customSiteTitle: '智能记账 API 文档',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Backend server is running on http://localhost:${port}`);
  console.log(
    `📚 Swagger API docs available at http://localhost:${port}/api-docs`,
  );
  console.log('🔍 API endpoints:');
  console.log(`   - Bills: http://localhost:${port}/api-docs#/bills`);
  console.log(`   - Categories: http://localhost:${port}/api-docs#/categories`);
}
bootstrap();
