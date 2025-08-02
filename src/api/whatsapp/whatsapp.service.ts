import { Injectable, Logger } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client | null = null;
  private qrCodeDataUrl: string | null = null;
  private isReady = false;
  private isAuthenticated = false;

  iniciarSesion() {
    if (this.client) return;

    this.client = new Client({
      authStrategy: new LocalAuth(),
    });

    this.client.on('qr', async (qr) => {
      this.logger.log('QR recibido');
      this.qrCodeDataUrl = await qrcode.toDataURL(qr);
    });

    this.client.on('authenticated', () => {
      this.logger.log('WHATSAPP => Autenticado');
      this.isAuthenticated = true;
    });

    this.client.on('ready', () => {
      this.logger.log('WHATSAPP => Listo');
      this.isReady = true;
    });

    this.client.on('message', async (message) => {
      if (message.body === '!ping') {
        await message.reply('pong');
      }
    });

    this.client.initialize();
  }

  getQr() {
    return this.qrCodeDataUrl;
  }

  getStatus() {
    return {
      authenticated: this.isAuthenticated,
      ready: this.isReady,
    };
  }


  async sendMessage(phone: string, message: string) {
    const numberId = await this.client.getNumberId(phone);
    if (!numberId) {
      throw new Error('Número inválido');
    }

    const response = await this.client.sendMessage(numberId._serialized, message);
    return response;
  }
}

