import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService {
  private logPath = path.join(process.cwd(), 'logs', 'api.log');

  constructor() {
    const dir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(accion: string, endpoint: string, datos: any, status: 'OK' | 'ERROR' = 'OK') {
    const entrada = {
      fecha: new Date().toISOString(),
      accion,
      endpoint,
      status,
      datos,
    };

    const linea = JSON.stringify(entrada) + '\n';

    try {
      fs.appendFileSync(this.logPath, linea, 'utf8');
    } catch (e) {
      console.error('Error escribiendo log local:', e);
    }
  }

  getLogs(limite = 50): any[] {
    try {
      if (!fs.existsSync(this.logPath)) return [];
      const contenido = fs.readFileSync(this.logPath, 'utf8');
      const lineas = contenido.trim().split('\n').filter(Boolean);
      return lineas
        .slice(-limite)
        .map(l => JSON.parse(l))
        .reverse();
    } catch (e) {
      return [];
    }
  }

  getUltimosAntesDeError(): any[] {
    try {
      const todos = this.getLogs(100);
      const ultimoError = todos.findIndex(l => l.status === 'ERROR');
      if (ultimoError === -1) return todos.slice(0, 10);
      return todos.slice(0, ultimoError + 1);
    } catch {
      return [];
    }
  }
}