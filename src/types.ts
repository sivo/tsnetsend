import { protocols } from "./protocols";

const commands = ['on', 'off', 'dim', 'learn', 'bell'] as const;
export type Command = typeof commands[number];
export function isCommand(command: unknown): command is Command {
  return commands.includes(command as Command);
}

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
  return !!op.command && !!op.house && !!op.unit;
}

const types = ['switch', 'trigger'] as const;
export type Type = typeof types[number];
export function isType(type: unknown): type is Command {
  return types.includes(type as Type);
}

export type Model = 'selflearning' | 'codeswitch' | 'bell';

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
