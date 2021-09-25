import { ValueMap } from '../types';
import * as arctech from './arctech';
import * as fineoffset from './fineoffset';
import * as text from './text';

export const supportedProtocols = ['arctech', 'fineoffset', 'text'] as const
export type ProtocolName = typeof supportedProtocols[number];

export function isProtocolName(name: unknown): name is ProtocolName {
  return supportedProtocols.includes(name as ProtocolName);
}

export type Payload = {
  pulses: string,
  pause?: number,
  repeat?: number
};

export interface Protocol {
  getPayload?: (operation: Record<string, unknown>) => Payload;
  decodeData: (valueMap: ValueMap) => Record<string, unknown>;
  isValidParameters: (parameters: Record<string, unknown>) => boolean;
}

export const protocols: Record<ProtocolName, Protocol> = {
  arctech,
  fineoffset,
  text,
};
