// tratamiento.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tratamiento } from './entities/tratamiento.entity';
import { PrecioHistorial } from './entities/precio-historial.entity';
import { TratamientoService } from './tratamientos.service';
import { TratamientoController } from './tratamientos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tratamiento, PrecioHistorial])],
  controllers: [TratamientoController],
  providers: [TratamientoService],
})
export class TratamientoModule { }

