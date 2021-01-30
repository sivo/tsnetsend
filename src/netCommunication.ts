import { encode } from './netProtocol';
import * as protocols from './protocols/index';

type SendOptions = {
  protocol: keyof typeof protocols;
  model: "selflearning" | "codeswitch";
  house: string | number;
  unit: number;
  command: "on" | "off" | "dim" | "learn"
};

export function getSendPacket(options: SendOptions): Buffer {
  const payload = protocols.arctech.getPayload(options);
  const data = encode('send') + encode({'S': payload})

  return Buffer.from(data, 'ascii');
}

export function getDiscoverPacket(): Buffer {
  return Buffer.from('D');
}