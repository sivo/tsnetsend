import { Command } from "../types";

const LONG = '\x7f';
const SHORT = '\x18';
const ONE = SHORT + LONG + SHORT + SHORT;
const ZERO = SHORT + SHORT + SHORT + LONG;

export type Options = {
  house: string | number;
  unit: number;
  group?: number;
  level?: number;
  command: Command;
}

export function getPayload(options) {
  // For compatibility with what is displayed by telldus live
  options.unit -= 1;
  if (typeof options.house === 'number') {
    options.house = (options.house << 2) + 2;
  }

  let result = SHORT + String.fromCharCode(255);

  if (options.command === Command.dim && options.level === 0) {
    options.command = Command.off;
  }

  result += toBits(options.house, 26); 

  result += options.group === 1 ? ONE : ZERO;

  if (options.command === Command.dim) {
    result += SHORT + SHORT + SHORT + SHORT;
  } else if (options.command === Command.off) {
    result += ZERO;
  } else {
    result += ONE;
  }

  result += toBits(options.unit, 4);
  
  if (options.command === Command.dim) {
    const level = Math.ceil(options.level / 16);
    result += toBits(level, 4);
  }

  result += SHORT;
  return result;
}

function toBits(integer: number, length: number): string {
  return (integer >>> 0).toString(2).padStart(length, '0').replace(/0/g, ZERO).replace(/1/g, ONE);
}

function fromBits(bits: string): number {
  let result = '';
  let chars = Array.from(bits);
  let a, b, c, d;

  while(chars.length) {
    [a, b, c, d, ...chars] = chars;
    if (b === LONG) {
      result += 1;
    } else {
      result += 0;
    }
  }

  return parseInt(result, 2);
}

export function decodePayload(payload: string): Options {
  let position = (SHORT + String.fromCharCode(255)).length;
  
  const house = fromBits(payload.substr(position, 26 * ZERO.length));
  position += 26 * ZERO.length;

  const group = (payload.substr(position, ZERO.length) === ONE) ? 1 : 0;
  position += ZERO.length;
  
  let command;
  let commandBits = payload.substr(position, ZERO.length);
  if (commandBits[1] === SHORT && commandBits[3] === SHORT) {
    command = Command.dim;
  } else if (commandBits[1] === LONG) {
    command = Command.on;
  }
  position += ZERO.length;

  const unit = fromBits(payload.substr(position, 4 * ZERO.length));
  position += 4 * ZERO.length;

  let level;
  if (command = Command.dim) {
    level = fromBits(payload.substr(position, 4 * ZERO.length)) * 16;
  }

  return {house, group, command, unit, level};
}