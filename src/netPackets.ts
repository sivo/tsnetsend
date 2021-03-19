import { DeviceConfiguration } from './configuration';
import { encode } from './netProtocol';
import * as protocols from './protocols/index';
import { Command } from './types';

export function getSendPacket(device: DeviceConfiguration, command: Command): Buffer {
  console.log('AAAAAAAAA', device)
  const payload = protocols.arctech.getPayload({...device.parameters[0], command});
  const data = encode('send') + encode({'S': payload})

  return Buffer.from(data, 'ascii');
}

export function getDiscoverPacket(): Buffer {
  return Buffer.from('D');
}

export function getListenPacket(): Buffer {
  const payload = encode('reglistener');
  return Buffer.from(payload, 'ascii');
}