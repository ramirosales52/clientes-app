import { Body, Controller, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly whatsappService: WhatsappService) { }

  @Post('send')
  async sendReminder(@Body() body: { phone: string; message: string }) {
    const result = await this.whatsappService.sendMessage(body.phone, body.message);
    return { success: true, result };
  }
}
