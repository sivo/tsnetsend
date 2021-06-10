import { ValueMap } from "../types";

export type Parameters = {
  id: number;
  humidity: number;
  temperature: number;
}

export function isValidParameters(parameters: Record<string, unknown>): parameters is Parameters {
  return (typeof parameters.id === 'number') &&
    (typeof parameters.humidity === 'number') &&
    (typeof parameters.temperature === 'number');
}

export function getPayload(): string {
  throw new Error('Not implemented yet');
}

export function decodeData(valueMap: ValueMap): Parameters {
  if (typeof valueMap.data !== 'number') {
    throw new Error('Invalud data format to decode');
  }

  let data = valueMap.data;
  data = Math.trunc(data / 256);
  const humidity = (data & 0xFF);
  data = Math.trunc(data / 256);
  let temperature = (data & 0x7FF) / 10;
  data = Math.trunc(data / 2048);
  const negative = (data & 0x1);
  data = Math.trunc(data / 2);
  const id = (data & 0xFF);

  if (negative) {
    temperature = -temperature;
  }

  return {id, temperature, humidity};
}