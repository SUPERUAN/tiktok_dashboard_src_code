import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as fs from 'fs';
import * as path from 'path';
import express from 'express';
import * as https from 'https';

async function bootstrap() {
    // Main HTTP Nest app
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');

    await app.listen(3000);
    console.log('HTTP backend running at http://localhost:3000/api');

    // HTTPS callback-only server
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

        try {
            // ส่ง code ต่อไปให้ Nest HTTP route ตัวเดิมจัดการ
            return res.redirect(
                `http://localhost:3000/api/tiktok/exchange-token?code=${encodeURIComponent(code)}`
            );
        } catch (error: any) {
            return res.status(500).json({
                message: 'Callback redirect failed',
                error: error?.message || 'Unknown error',
            });
        }
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