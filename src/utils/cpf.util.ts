export function isValidCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;

  // Rejeita sequências conhecidas inválidas (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  const calcDigit = (slice: string, factor: number): number => {
    const sum = slice
      .split('')
      .reduce((acc, digit, i) => acc + parseInt(digit) * (factor - i), 0);
    const remainder = (sum * 10) % 11;
    return remainder >= 10 ? 0 : remainder;
  };

  const firstDigit = calcDigit(cleaned.slice(0, 9), 10);
  if (firstDigit !== parseInt(cleaned[9])) return false;

  const secondDigit = calcDigit(cleaned.slice(0, 10), 11);
  if (secondDigit !== parseInt(cleaned[10])) return false;

  return true;
}

export function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}
