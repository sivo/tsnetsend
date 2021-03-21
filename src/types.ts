import { protocols } from "./protocols";

export enum Command {
  on = 'on',
  off = 'off',
  dim = 'dim',
  learn = 'learn',
  bell = 'bell',
};

export type Operation = Parameters & {
  command: Command;
  group?: number;
  level?: number;
};

export function isOperation(operation: unknown): operation is Operation {
  if (typeof operation !== 'object' || operation == null) {
    return false;
  }
  
  const op = operation as Operation;
  return !!op.command && !!op.house && !!op.unit && true;
}

export enum Type {
  switch = 'switch',
};

export enum Model {
  selflearning = 'selflearning',
  codeswitch = 'codeswitch',
  bell = 'bell',
};

export type Parameters = {
  house: string | number;
  unit: number;
}

export type DeviceConfiguration = {
  name: string;
  type: Type;
  protocol: keyof typeof protocols;
  model: Model;
  parameters: Parameters[];
}

export type DeviceCommand = Parameters & {
  command: Command;
}

export type Value = number | string | ValueMap | Value[] | undefined;
export interface ValueMap extends Record<string, Value> {};
export function isValueMap(valueMap: unknown): valueMap is ValueMap {
  return !!valueMap && typeof valueMap === 'object' && !Array.isArray(valueMap);
}
