const LONG = '\x7f';
const SHORT = '\x18';
const ONE = SHORT + LONG + SHORT + SHORT;
const ZERO = SHORT + SHORT + SHORT + LONG;

export type Options = {
  model: "selflearning" | "codeswitch" | "bell";
  house: string | number;
  unit: number;
  group?: number;
  level?: number;
  command: 'on' | 'off' | 'dim' | 'learn' | 'bell';
}

export function getPayload(options) {
  // For compatibility with what is displayed by telldus live
  options.unit -= 1;
  if (typeof options.house === 'number') {
    options.house = (options.house << 2) + 2;
  }

  let result = SHORT + String.fromCharCode(255);

  if (options.command === 'dim' && options.level === 0) {
    options.command = 'off';
  }

  result += toBits(options.house, 26); 

  result += options.group === 1 ? ONE : ZERO;

  if (options.command === 'dim') {
    result += SHORT + SHORT + SHORT + SHORT;
  } else if (options.command === 'off') {
    result += ZERO;
  } else {
    result += ONE;
  }

  result += toBits(options.unit, 4);
  
  if (options.command === 'dim') {
    const level = Math.ceil(options.level / 16);
    result += toBits(level, 4);
  }

  result += SHORT;
  return result;
}

function toBits(integer: number, length: number): string {
  return (integer >>> 0).toString(2).padStart(length, '0').replace(/0/g, ZERO).replace(/1/g, ONE);
}