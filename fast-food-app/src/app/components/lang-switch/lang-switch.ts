import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-lang-switch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;gap:4px;background:#f0f7f0;border-radius:20px;padding:4px">
      <button (click)="setLang('es')"
        [style]="'padding:4px 12px;border-radius:16px;border:none;font-size:12px;font-weight:500;cursor:pointer;' +
          (currentLang === 'es' ? 'background:#1D9E75;color:white' : 'background:transparent;color:#555')">
        ES
      </button>
      <button (click)="setLang('en')"
        [style]="'padding:4px 12px;border-radius:16px;border:none;font-size:12px;font-weight:500;cursor:pointer;' +
          (currentLang === 'en' ? 'background:#1D9E75;color:white' : 'background:transparent;color:#555')">
        EN
      </button>
    </div>
  `
})
export class LangSwitchComponent {
  private translate = inject(TranslateService);
  currentLang = 'es';

  setLang(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
  }
}
