import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { NotificationsController } from './whatsapp.controller';

@Module({
  providers: [WhatsappService],
  exports: [WhatsappService],
  controllers: [NotificationsController]
})
export class WhatsappModule { }

