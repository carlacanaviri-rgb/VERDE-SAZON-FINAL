import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { LoggerService } from '../logger/logger.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';

@Injectable()
export class ProductosService {
  private collection = 'productos';

  constructor(
    private firebase: FirebaseService,
    private logger: LoggerService,
  ) {}

  async getAll() {
    try {
      const snap = await this.firebase.getFirestore()
        .collection(this.collection).get();
      const productos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.logger.log('GET_ALL', '/productos', { total: productos.length });
      return productos;
    } catch (e: any) {
      this.logger.log('GET_ALL', '/productos', { error: e.message }, 'ERROR');
      throw e;
    }
  }

  async getOne(id: string) {
    try {
      const doc = await this.firebase.getFirestore()
        .collection(this.collection).doc(id).get();
      if (!doc.exists) return null;
      const producto = { id: doc.id, ...doc.data() };
      this.logger.log('GET_ONE', `/productos/${id}`, { producto });
      return producto;
    } catch (e: any) {
      this.logger.log('GET_ONE', `/productos/${id}`, { error: e.message }, 'ERROR');
      throw e;
    }
  }

  async create(dto: CreateProductoDto) {
    this.logger.log('CREATE', '/productos', { payload: dto });
    try {
      const ref = await this.firebase.getFirestore()
        .collection(this.collection).add({
          ...dto,
          creadoEn: new Date().toISOString()
        });
      await this.addFirebaseLog('CREAR', ref.id, dto.nombre, dto);
      this.logger.log('CREATE', '/productos', { id: ref.id, nombre: dto.nombre });
      return { id: ref.id, ...dto };
    } catch (e: any) {
      this.logger.log('CREATE', '/productos', { error: e.message, payload: dto }, 'ERROR');
      throw e;
    }
  }

  async update(id: string, dto: UpdateProductoDto, original: any) {
    this.logger.log('UPDATE', `/productos/${id}`, { payload: dto, original });
    try {
      await this.firebase.getFirestore()
        .collection(this.collection).doc(id).update({ ...dto });

      const cambios: any = {};
      const anteriores: any = {};
      for (const key of Object.keys(dto)) {
        if (dto[key] !== original[key]) {
          cambios[key] = dto[key];
          anteriores[key] = original[key];
        }
      }
      await this.addFirebaseLog('EDITAR', id, dto.nombre ?? id, { cambios, anteriores });
      this.logger.log('UPDATE', `/productos/${id}`, { cambios, anteriores });
      return { id, ...dto };
    } catch (e: any) {
      this.logger.log('UPDATE', `/productos/${id}`, { error: e.message, payload: dto }, 'ERROR');
      throw e;
    }
  }

  async delete(id: string, nombre: string) {
    this.logger.log('DELETE', `/productos/${id}`, { id, nombre });
    try {
      const doc = await this.getOne(id);
      await this.firebase.getFirestore()
        .collection(this.collection).doc(id).delete();
      await this.addFirebaseLog('ELIMINAR', id, nombre, doc);
      this.logger.log('DELETE', `/productos/${id}`, { eliminado: true, nombre });
      return { eliminado: true, id };
    } catch (e: any) {
      this.logger.log('DELETE', `/productos/${id}`, { error: e.message, id, nombre }, 'ERROR');
      throw e;
    }
  }

  private async addFirebaseLog(accion: string, id: string, nombre: string, snapshot: any) {
    try {
      await this.firebase.getFirestore().collection('logs').add({
        accion,
        id_producto: id,
        nombre_producto: nombre,
        snapshot,
        fecha: new Date().toISOString(),
      });
    } catch (e: any) {
      this.logger.log('FIREBASE_LOG', '/logs', { error: e.message }, 'ERROR');
    }
  }
}
