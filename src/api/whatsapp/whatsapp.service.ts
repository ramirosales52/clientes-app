import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

type MessageHandler = (telefono: string, mensaje: string) => Promise<void>;

type IniciarSesionOptions = {
  allowQr?: boolean;
  reconnectOnDisconnect?: boolean;
};

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client | null = null;
  private qrCodeDataUrl: string | null = null;
  private isReady = false;
  private isAuthenticated = false;
  private messageHandler: MessageHandler | null = null;
  private shouldReconnect = true;
  private allowQrGeneration = true;
  private initializationAborted = false;

  /**
   * Si hay una sesion previa, intenta restaurarla sin exponer QR.
   * Si la sesion ya no sirve, la UI debe iniciar una vinculacion manual.
   */
  async onModuleInit() {
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth');
    const sessionExists = fs.existsSync(sessionPath);

    if (!sessionExists) {
      this.logger.log('WhatsApp en espera de conexión manual');
      return;
    }

    this.logger.log('Intentando restaurar sesión de WhatsApp...');
    await this.iniciarSesion({ allowQr: false, reconnectOnDisconnect: true });
  }

  /**
   * Registra un handler para procesar mensajes entrantes
   */
  onMessage(handler: MessageHandler) {
    this.messageHandler = handler;
  }

  private normalizarTelefono(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  private async obtenerTelefonoRemitente(message: Message): Promise<string> {
    const contacto = await message.getContact();
    const candidatos = [contacto?.number, contacto?.id?._serialized, message.author, message.from].filter(Boolean) as string[];

    const candidatoCanonico = candidatos.find((valor) => /@c\.us$/i.test(valor) || /@s\.whatsapp\.net$/i.test(valor));
    if (candidatoCanonico) {
      const telefono = this.normalizarTelefono(candidatoCanonico);
      if (telefono.length >= 10) {
        return telefono;
      }
    }

    const idsParaResolver = [contacto?.id?._serialized, message.author, message.from].filter(Boolean) as string[];

    if (this.client && idsParaResolver.length > 0) {
      try {
        const resolver = (this.client as unknown as {
          getContactLidAndPhone: (userIds: string[]) => Promise<Array<{ lid?: string; pn?: string }>>;
        }).getContactLidAndPhone;

        if (typeof resolver === 'function') {
          const mapeos = await resolver.call(this.client, idsParaResolver);
          for (const mapeo of mapeos) {
            const telefono = this.normalizarTelefono(mapeo.pn ?? mapeo.lid ?? '');
            if (telefono.length >= 10) {
              return telefono;
            }
          }
        }
      } catch (error) {
        this.logger.debug('No se pudo resolver LID a teléfono', error as Error);
      }
    }

    for (const candidato of candidatos) {
      if (/@lid$/i.test(candidato)) {
        continue;
      }

      const telefono = this.normalizarTelefono(candidato);
      if (telefono.length >= 10) {
        return telefono;
      }
    }

    return this.normalizarTelefono(message.from);
  }

  async iniciarSesion(options?: IniciarSesionOptions) {
    if (this.client) return;

    this.shouldReconnect = options?.reconnectOnDisconnect ?? true;
    this.allowQrGeneration = options?.allowQr ?? true;
    this.initializationAborted = false;
    this.qrCodeDataUrl = null;
    this.isReady = false;
    this.isAuthenticated = false;

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/chromium',
      },
    });

    this.client.on('qr', async (qr) => {
      if (!this.allowQrGeneration) {
        this.logger.warn('La sesión guardada ya no es válida. Se requiere reconexión manual.');
        this.initializationAborted = true;
        await this.cancelarConexionInterna(false);
        return;
      }

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
      this.qrCodeDataUrl = null;
      this.client = null;
      
      if (this.shouldReconnect) {
        const allowQrOnReconnect = this.allowQrGeneration;
        setTimeout(() => {
          if (!this.client && this.shouldReconnect) {
            this.logger.log('Intentando reconexión automática...');
            void this.iniciarSesion({
              allowQr: allowQrOnReconnect,
              reconnectOnDisconnect: true,
            }).catch((error) => {
              this.logger.error('WHATSAPP => Error en reconexión automática', error as Error);
            });
          }
        }, 5000);
      }
    });

    this.client.on('auth_failure', (message) => {
      this.logger.error(`WHATSAPP => Fallo de autenticación: ${message}`);
      this.isAuthenticated = false;
      this.isReady = false;
    });

    this.client.on('message', async (message: Message) => {
      if (message.fromMe) {
        return;
      }

      // Comando de prueba
      if (message.body === '!app') {
        await message.reply('app');
        return;
      }

      // Procesar respuestas de texto
      if (this.messageHandler) {
        try {
          const telefono = await this.obtenerTelefonoRemitente(message);
          this.logger.debug(`WHATSAPP <= ${telefono}: ${message.body}`);
          await this.messageHandler(telefono, message.body);
        } catch (error) {
          this.logger.error('Error procesando mensaje:', error);
        }
      }
    });

    try {
      await this.client.initialize();
    } catch (error) {
      if (this.initializationAborted && error instanceof Error && /Target closed/i.test(error.message)) {
        this.logger.warn('WHATSAPP => Inicio cancelado porque la sesión guardada ya no es válida');
        return;
      }

      this.logger.error('WHATSAPP => Error iniciando sesión', error as Error);
      await this.cancelarConexionInterna(false);
      throw error;
    }
  }

  async cerrarSesion() {
    if (!this.client) {
      throw new Error('Cliente no inicializado');
    }

    this.shouldReconnect = false;
    await this.client.logout();
    await this.cancelarConexionInterna(false);
  }

  async cancelarConexionPendiente() {
    this.shouldReconnect = false;

    if (!this.client) {
      this.qrCodeDataUrl = null;
      this.isAuthenticated = false;
      this.isReady = false;
      return { success: true };
    }

    if (this.isReady) {
      this.shouldReconnect = true;
      return { success: false, message: 'La sesión ya está conectada' };
    }

    await this.cancelarConexionInterna(false);

    return { success: true };
  }

  private async cancelarConexionInterna(keepReconnectState: boolean) {
    if (!keepReconnectState) {
      this.shouldReconnect = false;
    }

    const client = this.client;
    this.client = null;

    try {
      await client?.destroy();
    } catch (error) {
      this.logger.warn('Error cancelando conexión pendiente', error as Error);
    } finally {
      this.isAuthenticated = false;
      this.isReady = false;
      this.qrCodeDataUrl = null;
      this.allowQrGeneration = false;
    }
  }

  getQr() {
    return this.qrCodeDataUrl;
  }

  getStatus() {
    return {
      authenticated: this.isAuthenticated,
      ready: this.isReady,
      connected: this.isReady || this.isAuthenticated,
    };
  }

  async sendMessage(phone: string, message: string) {
    if (!this.client) {
      throw new Error('Cliente no inicializado');
    }

    if (!this.isAuthenticated && !this.isReady) {
      throw new Error('WhatsApp no está conectado');
    }

    const numberId = await this.client.getNumberId(phone);
    if (!numberId) {
      throw new Error('Número inválido');
    }

    try {
      return await this.client.sendMessage(numberId._serialized, message);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);

      if (/markedUnread|Cannot read properties of undefined|undefined \(reading/i.test(messageText)) {
        this.logger.warn(`WHATSAPP => Error transitorio al enviar, reintentando: ${messageText}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return await this.client.sendMessage(numberId._serialized, message);
      }

      throw error;
    }
  }
}
