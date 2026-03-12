import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as fs from 'fs';
import * as path from 'path';
import express from 'express';
import * as https from 'https';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:4200',
        credentials: true,
    });

    app.setGlobalPrefix('api');
    await app.listen(3000);
    console.log('HTTP backend running at http://localhost:3000/api');

    const callbackApp = express();

    callbackApp.get('/api/tiktok/callback', async (req, res) => {
        const code = req.query.code as string;
        const state = req.query.state as string;

        if (!code) {
            return res.status(400).send('Missing authorization code');
        }

        if (state !== 'test123') {
            return res.status(400).send('Invalid state');
        }

        return res.redirect(
            `http://localhost:3000/api/tiktok/exchange-token?code=${encodeURIComponent(code)}`
        );
    });

    https.createServer(
        {
            key: fs.readFileSync(path.join(process.cwd(), 'certs', 'mayson.com-key.pem')),
            cert: fs.readFileSync(path.join(process.cwd(), 'certs', 'mayson.com.pem')),
        },
        callbackApp,
    ).listen(3443, () => {
        console.log('HTTPS callback server running at https://mayson.com:3443');
    });
}

bootstrap();