import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteNotaDto } from './create-cliente-nota.dto';

export class UpdateClienteNotaDto extends PartialType(CreateClienteNotaDto) {}
