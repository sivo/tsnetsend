import * as arctech from './arctech';
import * as fineoffset from './fineoffset';

export const supportedProtocols = ['arctech', 'fineoffset'] as const
export type ProtocolName = typeof supportedProtocols[number];

export function isProtocolName(name: unknown): name is ProtocolName {
  return supportedProtocols.includes(name as ProtocolName);
}

export interface Protocol {
  getPayload?: (operation: Record<string, unknown>) => string;
  decodeData: (data: number) => Record<string, unknown>;
  isValidParameters: (parameters: Record<string, unknown>) => boolean;
}

export const protocols: Record<ProtocolName, Protocol> = {
  arctech,
  fineoffset,
};
