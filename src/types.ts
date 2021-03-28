import { protocols } from "./protocols";

const commands = ['on', 'off', 'dim', 'learn', 'bell'] as const;
export type Command = typeof commands[number];
export function isCommand(command: unknown): command is Command {
  return commands.includes(command as Command);
}

const types = ['switch', 'trigger'] as const;
export type Type = typeof types[number];
export function isType(type: unknown): type is Command {
  return types.includes(type as Type);
}

export type Model = 'selflearning' | 'codeswitch' | 'bell' | 'remote';

export type DeviceConfiguration = {
  name: string;
  type: Type;
  protocol: keyof typeof protocols;
  model: Model;
  parameters: Record<string, unknown>[];
}

export type DeviceCommand = Record<string, unknown> & {
  command: Command;
}
export function isDeviceCommand(deviceCommand: unknown): deviceCommand is DeviceCommand {
  if (typeof deviceCommand !== 'object' || deviceCommand == null) {
    return false;
  }
  
  const op = deviceCommand as DeviceCommand;
  return isCommand(op.command);
}

export type Value = number | string | ValueMap | Value[] | undefined;
export interface ValueMap extends Record<string, Value> {};
export function isValueMap(valueMap: unknown): valueMap is ValueMap {
  return !!valueMap && typeof valueMap === 'object' && !Array.isArray(valueMap);
}
