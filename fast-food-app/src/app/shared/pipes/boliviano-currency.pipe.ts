import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bolivianos',
  standalone: true
})
export class BolivianoCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, fractionDigits = 0): string {
    if (value === null || value === undefined || value === '') {
      return 'Bs 0';
    }

    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return 'Bs 0';
    }

    const formatter = new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    });

    return `Bs ${formatter.format(amount)}`;
  }
}

