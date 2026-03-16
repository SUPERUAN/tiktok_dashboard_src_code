import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import express from 'express';
import * as https from 'https';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const backendUrl =
    configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
  const backendPort = Number(new URL(backendUrl).port || '3000');

  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

  const redirectUri =
    configService.get<string>('TIKTOK_REDIRECT_URI') ||
    'https://mayson.com:3443/api/tiktok/callback';

    //if redirectUrl = https://mayson.com:3443/api/tiktok/callback
    //port = 3443
    //hostname = mayson.com
    //pathname = /api/tiktok/callback
  const redirectUrl = new URL(redirectUri);
  const callbackHttpsPort = Number(redirectUrl.port || '3443');
  const callbackHost = redirectUrl.hostname;
  const callbackPath = redirectUrl.pathname;

  const sslKeyPath =
    configService.get<string>('SSL_KEY_PATH') || 'certs/mayson.com-key.pem';
  const sslCertPath =
    configService.get<string>('SSL_CERT_PATH') || 'certs/mayson.com.pem';

  const tiktokAuthState =
    configService.get<string>('TIKTOK_AUTH_STATE') || 'test123';

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(backendPort);
  console.log(`HTTP backend running at ${backendUrl}/api`);

  const callbackApp = express();

  callbackApp.get(callbackPath, async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    if (state !== tiktokAuthState) {
      return res.status(400).send('Invalid state');
    }

    return res.redirect(
      `${backendUrl}/api/tiktok/exchange-token?code=${encodeURIComponent(code)}`,
    );
  });

  https
    .createServer(
      {
        key: fs.readFileSync(path.join(process.cwd(), sslKeyPath)),
        cert: fs.readFileSync(path.join(process.cwd(), sslCertPath)),
      },
      callbackApp,
    )
    .listen(callbackHttpsPort, () => {
      console.log(
        `HTTPS callback server running at https://${callbackHost}:${callbackHttpsPort}${callbackPath}`,
      );
    });
}

bootstrap();