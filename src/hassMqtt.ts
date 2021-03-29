import { getConfiguration, Configuration } from './configuration';
import { connectAsync, AsyncClient } from 'async-mqtt';
import { log } from './log';
import { Command, DeviceConfiguration, isCommand, isType, ProtocolParameters, Type } from './types';

const register = {
  switch: registerSwitch,
  trigger: registerTrigger,
}

const subscribe = {
  switch: subscribeSwitch,
  trigger: subscribeTrigger,
}

let client: AsyncClient;
let config: Configuration;

const topicPrefix = 'homeassistant';

export type CommandExecutor = (deviceName: string, command: Command) => Promise<boolean>;

export async function initialize(commandExecutor: CommandExecutor) {
  config = await getConfiguration();
  client = await connectAsync(`tcp://${config.mqtt.host}:${config.mqtt.port}`);

  handleMessages(commandExecutor);
  await subscribeDevices();
  await registerDevices();
}

export async function stop() {
  if (client) {
    await client.end()
  }
}

function handleMessages(commandExecutor: CommandExecutor) {
  const commandTopicRegex = new RegExp(`${topicPrefix}/([^/]+)/([^/]+)/set`);

  client.on('message', (topic, message) => {
    log.debug(`Message from MQTT: Topic: ${topic} Message: ${message}`)

    let match;

    if (match = topic.match(commandTopicRegex)) {
      const rawDeviceType = match[1];
      const rawDeviceName = match[2];
      const rawCommand = message.toString('latin1');

      if (!isType(rawDeviceType)) {
        log.debug(`Unknown device type: ${rawDeviceType}`);
        return;
      }
      
      if (!isCommand(rawCommand)) {
        log.debug(`Unknown command: ${rawCommand}`);
        return;
      }

      const type = rawDeviceType as Type;
      const command = rawCommand as Command;

      const success = commandExecutor(rawDeviceName, command);

      if (!success) {
        return;
      }

      try {
        const device = config.devices.find((dev) => dev.name === rawDeviceName);
        if (!device) {
          throw new Error(`Device not found: ${rawDeviceName}`);
        }

        log.debug(`Setting state for ${rawDeviceType} ${rawDeviceName} to ${command}`);
        updateState(device, undefined, command);
      } catch(err) {
        log.error(`Unable to update state for device ${rawDeviceType}: ${err.message}`);
      }
    }
  });
}

export async function updateState(device: DeviceConfiguration, protocolParameterIndex: number | undefined, state: Command) {

  if (device.type === 'switch') {
    log.debug(`Updating state for switch ${device.name} to ${state}`);
    await client.publish(getStateTopic(device.type, device.name), state);
  }

  if (device.type === 'trigger') {
    if (protocolParameterIndex === undefined) {
      throw new Error('Can\'t update state of trigger without button index');
    }

    log.debug(`Updating state for trigger button ${protocolParameterIndex + 1} on ${device.name} to ${state}`);
    await client.publish(getStateTopic('switch', `${device.name}_Button_${protocolParameterIndex + 1}`), state);
  }

}

async function subscribeDevices() {
  try {
    for (const device of config.devices) {
      await subscribe[device.type](device.type, device.name);
      log.info(`Subscribed to device: ${device.name}`);
    }
  } catch (err) {
    log.error(`Failed to subscribe to device. Error: ${err.message}`);
  }
}

async function registerDevices() {
  try {
    for (const device of config.devices) {
      await register[device.type](device);
      log.info(`Registered device: ${device.name}`);
    }
  } catch (err) {
    log.error(`Failed to register device. Error: ${err.message}`);
  }
}

async function subscribeSwitch(type: Type, deviceName: string) {
  const topic = getCommandTopic(type, deviceName);

  await client.subscribe(topic);
}

async function subscribeTrigger(type: Type, deviceName: string) {
  throw new Error('Subscribing a trigger not implemented yet');
}

async function registerSwitch({type, name}: DeviceConfiguration) {
  const topic = getConfigTopic(type, name);
  const message = JSON.stringify({
    name: name,
    unique_id: name,
    command_topic: getCommandTopic(type, name),
    state_topic: getStateTopic(type, name),
    payload_off: 'off',
    payload_on: 'on',
    state_off: 'off',
    state_on: 'on'
  });
  
  log.debug(`Registering ${type} ${name} by sending the following to topic ${topic}: ${message}`);

  await client.publish(topic, message);
}

async function registerTrigger(device: DeviceConfiguration) {
  // Register a trigger (e.g. a remote) as different devices. In Home Assistant, these can be used as state triggers
  device.parameters.forEach((params, index) => {
    registerSwitch({...device, type: 'switch', name: `${device.name}_Button_${index + 1}`});
  });
}

function getConfigTopic(type: Type, deviceName: string) {
  return `${getDeviceTopic(type, deviceName)}/config`;
}

function getCommandTopic(type: Type, deviceName: string) {
  return `${getDeviceTopic(type, deviceName)}/set`;
}

function getStateTopic(type: Type, deviceName: string) {
  return `${getDeviceTopic(type, deviceName)}/state`;
}

function getDeviceTopic(type: Type, deviceName: string) {
  return `${topicPrefix}/${type}/${deviceName}`;
}