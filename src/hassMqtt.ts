import { getConfiguration, Configuration } from './configuration';
import { connectAsync, AsyncClient } from 'async-mqtt';
import { log } from './log';
import { Command, isCommand, isType, Type } from './types';

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
        log.debug(`Setting state for ${rawDeviceType} ${rawDeviceName} to ${command}`);
        updateState(type, rawDeviceName, command);
      } catch(err) {
        log.error(`Unable to update state for device ${rawDeviceType}: ${err.message}`);
      }
    }
  });
}

export async function updateState(deviceType: Type, deviceName: string, state: Command) {
  await client.publish(getStateTopic(deviceType, deviceName), state);
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
      await register[device.type](device.type, device.name);
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

async function registerSwitch(type: Type, deviceName: string) {
  const topic = getConfigTopic(type, deviceName);
  const message = JSON.stringify({
    name: deviceName,
    unique_id: deviceName,
    command_topic: getCommandTopic(type, deviceName),
    state_topic: getStateTopic(type, deviceName),
    payload_off: 'off',
    payload_on: 'on',
    state_off: 'off',
    state_on: 'on'
  });
  
  log.debug(`Registering ${type} ${deviceName} by sending the following to topic ${topic}: ${message}`);

  await client.publish(topic, message);
}

async function registerTrigger(type: Type, deviceName: string) {
  throw new Error('Registering a trigger not implemented yet');
}

function getConfigTopic(type: string, deviceName: string) {
  return `${getDeviceTopic(type, deviceName)}/config`;
}

function getCommandTopic(type: string, deviceName: string) {
  return `${getDeviceTopic(type, deviceName)}/set`;
}

function getStateTopic(type: string, deviceName: string) {
  return `${getDeviceTopic(type, deviceName)}/state`;
}

function getDeviceTopic(type: string, deviceName: string) {
  return `${topicPrefix}/${type}/${deviceName}`;
}