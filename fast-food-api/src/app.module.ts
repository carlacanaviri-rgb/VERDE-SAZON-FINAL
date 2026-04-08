import { Module } from '@nestjs/common';
import { ProductosModule } from './productos/productos.module';
import { FirebaseModule } from './firebase/firebase.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [FirebaseModule, ProductosModule, LoggerModule],
})
export class AppModule {}
