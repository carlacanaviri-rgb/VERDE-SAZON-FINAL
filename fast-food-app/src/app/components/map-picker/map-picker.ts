import { Component, AfterViewInit, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface MapLocation {
  lat: number;
  lng: number;
  direccion: string;
}

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div style="width:100%;margin-bottom:8px">
    <p style="font-size:12px;color:#666;margin:0 0 6px">
      📍 Haz clic en el mapa para seleccionar tu ubicación
    </p>
    <div #mapContainer style="
      height: 300px;
      width: 100%;
      min-height: 300px;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      overflow: hidden;
      display: block;
      box-sizing: border-box;
    "></div>
    <div *ngIf="cargando" style="margin-top:6px;font-size:12px;color:#888">
      🔄 Obteniendo dirección...
    </div>
    <div *ngIf="direccionSeleccionada && !cargando"
         style="margin-top:6px;font-size:12px;color:#166534;background:#dcfce7;
                padding:6px 10px;border-radius:8px">
      ✅ {{ direccionSeleccionada }}
    </div>
  </div>
`
})
export class MapPickerComponent implements AfterViewInit {
  @Output() locationSelected = new EventEmitter<MapLocation>();
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  direccionSeleccionada = '';
  cargando = false;
  private map!: L.Map;
  private marker!: L.Marker;

  ngAfterViewInit() {
    // Más tiempo para que el *ngIf termine de renderizar el DOM
    setTimeout(() => this.initMap(), 300);
  }

  private initMap() {
    const el = this.mapContainer.nativeElement;

    if ((el as any)._leaflet_id) return;

    this.map = L.map(el, { zoomControl: true }).setView([-17.3895, -66.1568], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(this.map);

    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng, { icon: iconDefault }).addTo(this.map);
      }
      this.obtenerDireccion(lat, lng);
    });

    // 👇 Múltiples invalidateSize para asegurar que cargue completo
    setTimeout(() => this.map.invalidateSize(), 100);
    setTimeout(() => this.map.invalidateSize(), 400);
    setTimeout(() => this.map.invalidateSize(), 800);
  }

  private async obtenerDireccion(lat: number, lng: number) {
    this.cargando = true;
    this.direccionSeleccionada = '';
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      const addr = data.address;
      const partes = [
        addr.road, addr.house_number,
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village
      ].filter(Boolean);
      const direccion = partes.join(', ') || data.display_name;
      this.direccionSeleccionada = direccion;
      this.locationSelected.emit({ lat, lng, direccion });
    } catch {
      const direccion = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
      this.direccionSeleccionada = direccion;
      this.locationSelected.emit({ lat, lng, direccion });
    } finally {
      this.cargando = false;
    }
  }
}
