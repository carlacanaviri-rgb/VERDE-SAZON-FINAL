import { Module } from '@nestjs/common';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [FirebaseModule, LoggerModule],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}
