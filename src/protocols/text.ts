import { Command, ValueMap } from "../types";
import { Payload } from '.';

type Parameters = {
  on: string;
  off: string;
  pause?: number;
  repeat?: number;
  command: Command; 
}

export function isValidParameters(parameters: Record<string, unknown>): parameters is Parameters {
  return typeof parameters.on === 'string' && typeof parameters.off === 'string';
}

export function getPayload(operation: Record<string, unknown>): Payload {
  if (!isValidParameters(operation)) {
    throw new Error('Invalid parameters for protocol');
  }

  if (operation.command === 'on') {
    return {
      pulses: operation.on,
      pause: operation.pause,
      repeat: operation.repeat,
    };
  }

  if (operation.command === 'off') {
    return {
      pulses: operation.off,
      pause: operation.pause,
      repeat: operation.repeat,
    };
  }

  throw new Error('Invalid operation');
}

export function decodeData(valueMap: ValueMap): Parameters {
  return {on: 'static', off: 'static', command: 'learn'};
}