import { DeviceConfiguration } from './configuration';
import { encode } from './netProtocol';
import * as protocols from './protocols/index';
import { Command } from './types';

export function getSendPacket(device: DeviceConfiguration, command: Command): Buffer {
  const payload = protocols.arctech.getPayload({...device, command});
  const data = encode('send') + encode({'S': payload})

  return Buffer.from(data, 'ascii');
}

export function getDiscoverPacket(): Buffer {
  return Buffer.from('D');
}