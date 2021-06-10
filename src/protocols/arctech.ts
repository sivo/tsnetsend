import { Command, DeviceCommand, isCommand, ValueMap } from "../types";

const LONG = '\x7f';
const SHORT = '\x18';
const ONE = SHORT + LONG + SHORT + SHORT;
const ZERO = SHORT + SHORT + SHORT + LONG;

type Parameters = {
  house: string | number;
  unit: number;
  group?: number;
  level?: number;
  command: Command;
}

export function isValidParameters(parameters: Record<string, unknown>): parameters is Parameters {
  return (typeof parameters.house === 'string' || typeof parameters.house === 'number') &&
    (typeof parameters.unit === 'number') &&
    isCommand(parameters.command) &&
    (parameters.group == null || typeof parameters.group === 'number') &&
    (parameters.level == null || typeof parameters.level === 'number');
}

export function getPayload(operation: Record<string, unknown>): string {
  if (!isValidParameters(operation)) {
    throw new Error('Invalid parameters for protocol');
  }

  if (typeof operation.house === 'number') {
    return getPayloadSelfLearning(operation);
  } else {
    return getPayloadCodeSwitch(operation);
  }
}

function getPayloadCodeSwitch(operation: Parameters): string {
  console.log(operation);
  
  let result = '';
  const houseNumber = (operation.house as string).toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
  result += toBitsReverse(houseNumber, 4, '$k$k', '$kk$');
  result += toBitsReverse(operation.unit - 1, 4, '$k$k', '$kk$');
  result += operation.command === 'on' ? '$k$k$kk$$kk$$kk$$k' : '$k$k$kk$$kk$$k$k$k';
  
  return result;
}

function getPayloadSelfLearning(operation: Parameters): string {
  // For compatibility with what is displayed by telldus live
  operation.unit -= 1;
  if (typeof operation.house === 'number') {
    operation.house = (operation.house << 2) + 2;
  }

  let result = SHORT + String.fromCharCode(255);

  if (operation.command === 'dim' && operation.level === 0) {
    operation.command = 'off';
  }

  result += toBits(operation.house as number, 26, ZERO, ONE); 

  result += operation.group === 1 ? ONE : ZERO;

  if (operation.command === 'dim') {
    result += SHORT + SHORT + SHORT + SHORT;
  } else if (operation.command === 'off') {
    result += ZERO;
  } else {
    result += ONE;
  }

  result += toBits(operation.unit, 4, ZERO, ONE);
  
  if (operation.command === 'dim') {
    if (!operation.level) {
      operation.level = 0;
    }

    const level = Math.ceil(operation.level / 16);
    result += toBits(level, 4, ZERO, ONE);
  }

  result += SHORT;
  return result;
}

function toBits(integer: number, length: number, zero: string, one: string): string {
  return (integer >>> 0).toString(2).padStart(length, '0').replace(/0/g, zero).replace(/1/g, one);
}

function toBitsReverse(integer: number, length: number, zero: string, one: string): string {
  return (integer >>> 0).toString(2).padStart(length, '0').split('').reverse().join('').replace(/0/g, zero).replace(/1/g, one);
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

function decodePayload(payload: string): DeviceCommand {
  let position = (SHORT + String.fromCharCode(255)).length;
  
  const house = fromBits(payload.substr(position, 26 * ZERO.length));
  position += 26 * ZERO.length;

  const group = (payload.substr(position, ZERO.length) === ONE) ? 1 : 0;
  position += ZERO.length;
  
  let command: Command;
  let commandBits = payload.substr(position, ZERO.length);
  if (commandBits[1] === SHORT && commandBits[3] === SHORT) {
    command = 'dim';
  } else if (commandBits[1] === LONG) {
    command = 'on';
  }
  position += ZERO.length;

  const unit = fromBits(payload.substr(position, 4 * ZERO.length));
  position += 4 * ZERO.length;

  let level;
  if (command = 'dim') {
    level = fromBits(payload.substr(position, 4 * ZERO.length)) * 16;
  }

  return {house, group, command, unit, level};
}

export function decodeData(valueMap: ValueMap): Parameters {
  if (typeof valueMap.data !== 'number') {
    throw new Error('Invalud data format to decode');
  }

  if (valueMap.model === 'selflearning') {
    const data = valueMap.data;
    const house: number = Math.floor(data / 256);
    const group: number = ((data & 0x20) >> 5 ) >>> 0;
    const command: Command = (((data & 0x10) >> 4) >>> 0) ? 'on' : 'off';
    const unit: number = ((data & 0xf) >>> 0)+ 1;
    return {house, group, command, unit};
  }

  const data = valueMap.data;
  const house = String.fromCharCode((data % 16) + 'A'.charCodeAt(0));
  const unit = (data >> 4) % 16;
  const command = (data >> 11) ? 'on' : 'off';
  return {house, command, unit};
}