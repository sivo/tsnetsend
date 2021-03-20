import { Operation } from '../types';
import * as arctech from './arctech';

export interface Protocol {
  getPayload: (data: Operation) => string;
  decodePayload: (payload: string) => Operation;
  decodeData: (data: number) => Operation;
}

export const protocols: Record<string, Protocol> = {
  arctech,
};
