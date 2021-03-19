import { getConfiguration, Configuration } from './configuration';
import { connectAsync, AsyncClient } from 'async-mqtt';
import { log } from './log';
import { Command, Type } from './types';

const register = {
  switch: registerSwitch,
}

const subscribe = {
  switch: subscribeSwitch,
}

let client: AsyncClient;
let config: Configuration;

const topicPrefix = 'homeassistant';

export type CommandHandler = (deviceName: string, command: Command) => Promise<boolean>;

export async function initialize(commandHandler: CommandHandler) {
  config = await getConfiguration();
  client = await connectAsync(`tcp://${config.mqtt.host}:${config.mqtt.port}`);

  handleMessages(commandHandler);
  await subscribeDevices();
  await registerDevices();
}

export async function stop() {
  if (client) {
    await client.end()
  }
}

function handleMessages(commandHandler: CommandHandler) {
  const commandTopicRegex = new RegExp(`${topicPrefix}/([^/]+)/([^/]+)/set`);

  client.on('message', (topic, message) => {
    log.debug(`Message from MQTT: Topic: ${topic} Message: ${message}`)

    let match;

    if (match = topic.match(commandTopicRegex)) {
      const rawDeviceType = match[1];
      const rawDeviceName = match[2];
      const rawCommand = message.toString('latin1').toLowerCase();

      if (!(rawDeviceType in Type)) {
        log.debug(`Unknown device type: ${rawDeviceType}`);
        return;
      }
      
      if (!(rawCommand in Command)) {
        log.debug(`Unknown command: ${rawCommand}`);
        return;
      }

      const type = rawDeviceType as Type;
      const command = rawCommand as Command;

      const success = commandHandler(rawDeviceName, command);

      if (!success) {
        return;
      }

      try {
        log.debug(`Settings state for ${rawDeviceType} to ${message}`);
        client.publish(getStateTopic(type, rawDeviceName), message);
      } catch(err) {
        log.error(`Unable to update state for device ${rawDeviceType}: ${err.message}`);
      }
    }
  });
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

async function subscribeSwitch(type: string, deviceName: string) {
  const topic = getCommandTopic(type, deviceName);

  await client.subscribe(topic);
}

async function registerSwitch(type: string, deviceName: string) {
  const topic = getConfigTopic(type, deviceName);
  const message = JSON.stringify({
    name: deviceName,
    unique_id: deviceName,
    command_topic: getCommandTopic(type, deviceName),
    state_topic: getStateTopic(type, deviceName),
  });
  
  log.debug(`Registering ${type} ${deviceName} by sending the following to topic ${topic}: ${message}`);

  await client.publish(topic, message);
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