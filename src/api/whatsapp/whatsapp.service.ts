import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private client: typeof Client;

  onModuleInit() {
    this.initializeWhatsapp();
  }

  private initializeWhatsapp() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
    });

    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on('authenticated', () => {
      this.logger.log('WHATSAPP WEB => Authenticated');
    });

    this.client.on('ready', () => {
      this.logger.log('WHATSAPP WEB => Ready');
    });

    this.client.on('message', async (message) => {
      if (message.body === '!ping') {
        await message.reply('pong');
      }
    });

    this.client.initialize();
  }

  async sendMessage(phone: string, message: string) {
    const numberId = await this.client.getNumberId(phone); // Validate number first
    if (!numberId) {
      throw new Error('Number not found on WhatsApp');
    }

    const response = await this.client.sendMessage(numberId._serialized, message);
    return response;
  }
}

