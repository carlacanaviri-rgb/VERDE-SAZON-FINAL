import { BolivianoCurrencyPipe } from './boliviano-currency.pipe';

describe('BolivianoCurrencyPipe', () => {
  const pipe = new BolivianoCurrencyPipe();

  it('formatea montos con simbolo Bs y separador boliviano', () => {
    expect(pipe.transform(1234)).toBe('Bs 1.234');
  });

  it('permite configurar decimales', () => {
    expect(pipe.transform(1234.5, 2)).toBe('Bs 1.234,50');
  });

  it('nunca retorna simbolo dolar', () => {
    const result = pipe.transform(2500);
    expect(result).toContain('Bs');
    expect(result).not.toContain('$');
  });
});

