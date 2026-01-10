import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

type MessageHandler = (telefono: string, mensaje: string) => Promise<void>;

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client | null = null;
  private qrCodeDataUrl: string | null = null;
  private isReady = false;
  private isAuthenticated = false;
  private messageHandler: MessageHandler | null = null;

  /**
   * Al iniciar el módulo, verifica si existe una sesión guardada
   * y conecta automáticamente si la hay
   */
  async onModuleInit() {
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth');
    const sessionExists = fs.existsSync(sessionPath);

    if (sessionExists) {
      this.logger.log('Sesión de WhatsApp encontrada, conectando automáticamente...');
      this.iniciarSesion();
    } else {
      this.logger.log('No hay sesión de WhatsApp guardada');
    }
  }

  /**
   * Registra un handler para procesar mensajes entrantes
   */
  onMessage(handler: MessageHandler) {
    this.messageHandler = handler;
  }

  iniciarSesion() {
    if (this.client) return;

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/chromium',
      },
      restartOnAuthFail: true,
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
      this.qrCodeDataUrl = null; // Limpiar QR una vez conectado
    });

    this.client.on('disconnected', (reason) => {
      this.logger.warn(`WHATSAPP => Desconectado: ${reason}`);
      this.isReady = false;
      this.isAuthenticated = false;
      this.client = null;
      
      // Reconectar automáticamente después de 5 segundos
      setTimeout(() => {
        this.logger.log('Intentando reconexión automática...');
        this.iniciarSesion();
      }, 5000);
    });

    this.client.on('auth_failure', (message) => {
      this.logger.error(`WHATSAPP => Fallo de autenticación: ${message}`);
      this.isAuthenticated = false;
      this.isReady = false;
    });

    this.client.on('message', async (message: Message) => {
      // Comando de prueba
      if (message.body === '!app') {
        await message.reply('app');
        return;
      }

      // Procesar respuestas de texto
      if (this.messageHandler) {
        try {
          const telefono = message.from.replace('@c.us', '');
          await this.messageHandler(telefono, message.body);
        } catch (error) {
          this.logger.error('Error procesando mensaje:', error);
        }
      }
    });

    this.client.initialize();
  }

  async cerrarSesion() {
    if (!this.client) {
      throw new Error('Cliente no inicializado');
    }

    await this.client.logout();
    this.client = null;
    this.qrCodeDataUrl = null;
    this.isAuthenticated = false;
    this.isReady = false;
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
    if (!this.client) {
      throw new Error('Cliente no inicializado');
    }

    const numberId = await this.client.getNumberId(phone);
    if (!numberId) {
      throw new Error('Número inválido');
    }

    const response = await this.client.sendMessage(numberId._serialized, message);
    return response;
  }
}

