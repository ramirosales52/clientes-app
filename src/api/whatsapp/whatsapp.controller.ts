import { Body, Controller, Get, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class NotificationsController {
  constructor(private readonly whatsappService: WhatsappService) { }

  @Post('iniciar-sesion')
  iniciarSesion() {
    this.whatsappService.iniciarSesion();
    return { ok: true };
  }

  @Get('qr')
  getQr() {
    const qr = this.whatsappService.getQr();
    return qr ? { qr } : { qr: null, message: 'QR no disponible' };
  }

  @Get('status')
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post('send')
  async sendReminder(@Body() body: { phone: string; message: string }) {
    const result = await this.whatsappService.sendMessage(body.phone, body.message);
    return { success: true, result };
  }
}
