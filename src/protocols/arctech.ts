import { Command, Operation } from "../types";

const LONG = '\x7f';
const SHORT = '\x18';
const ONE = SHORT + LONG + SHORT + SHORT;
const ZERO = SHORT + SHORT + SHORT + LONG;

export type Data = {
  house: string | number;
  unit: number;
  group?: number;
  level?: number;
  command: Command;
}

export function getPayload(operation: Operation) {
  if (typeof operation.house !== 'number') {
    throw new Error('Arctech house with letters not implemented yet');
  }

  // For compatibility with what is displayed by telldus live
  operation.unit -= 1;
  if (typeof operation.house === 'number') {
    operation.house = (operation.house << 2) + 2;
  }

  let result = SHORT + String.fromCharCode(255);

  if (operation.command === Command.dim && operation.level === 0) {
    operation.command = Command.off;
  }

  result += toBits(operation.house, 26); 

  result += operation.group === 1 ? ONE : ZERO;

  if (operation.command === Command.dim) {
    result += SHORT + SHORT + SHORT + SHORT;
  } else if (operation.command === Command.off) {
    result += ZERO;
  } else {
    result += ONE;
  }

  result += toBits(operation.unit, 4);
  
  if (operation.command === Command.dim) {
    if (!operation.level) {
      operation.level = 0;
    }

    const level = Math.ceil(operation.level / 16);
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

export function decodePayload(payload: string): Operation {
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

export function decodeData(data: number): Operation {
  const house: number = ((data & 0xFFFFFFC0) >>> 0) >> 6 >> 2;
  const group: number = ((data & 0x20) >>> 0) >> 5;
  const command: Command = (((data & 0x10) >>> 0) >> 4) ? Command.on : Command.off;
  const unit: number = ((data & 0xf) >>> 0)+ 1;
  return {house, group, command, unit};
}