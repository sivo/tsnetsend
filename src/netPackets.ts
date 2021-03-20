import { encode, decode } from './netProtocol';
import { protocols } from './protocols';
import { Command, isValueMap, DeviceConfiguration, Operation } from './types';

export function getSendPacket(device: DeviceConfiguration, command: Command): Buffer {
  const payload = protocols[device.protocol].getPayload({...device.parameters[0], command});
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

export function decodeMessage(message: Buffer): Operation | undefined{
  const msg = message.toString();
  
  if (msg.startsWith('7:RawData')) {
    const value = decode(msg.substring(9));

    if (isValueMap(value) && typeof value.protocol === 'string' && typeof value.data === 'number') {
      if (protocols[value.protocol]) {
        return protocols[value.protocol].decodeData(value.data);
      }
    }
  }

  // throw new Error('Unable to decode message');
}
