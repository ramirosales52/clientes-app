import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteService } from './clientes.service';
import { ClienteController } from './clientes.controller';
import { Cliente } from './entities/cliente.entity';
import { ClienteNota } from './entities/cliente-nota.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, ClienteNota])],
  controllers: [ClienteController],
  providers: [ClienteService],
})
export class ClienteModule { }

