import { getConfiguration, DeviceConfiguration, Configuration } from './configuration';
import { connectAsync, AsyncClient } from 'async-mqtt';

const register = {
  switch: registerSwitch,
}

const subscribe = {
  switch: subscribeSwitch,
}

let client: AsyncClient;
let config: Configuration;

const topicPrefix = 'homeassistant';

export type CommandHandler = (device: DeviceConfiguration, command: string) => Promise<boolean>;

export async function initialize(commandHandler: CommandHandler) {
  config = await getConfiguration();
  client = await connectAsync(`tcp://${config.mqtt.host}:${config.mqtt.port}`);

  handleMessages(commandHandler);
  await subscribeDevices();
  await registerDevices();
}

function handleMessages(commandHandler: CommandHandler) {
  const commandTopicRegex = new RegExp(`${topicPrefix}/([^/])+/([^/])+/set`);

  client.on('message', (topic, message) => {
    let match;

    if (match = topic.match(commandTopicRegex)) {
      const name = match[2];
      const device = config.devices.find((entry) => entry.name === name);
      
      if (!device) {
        return;
      }
      
      const success = commandHandler(device, message.toString('latin1'));

      if (!success) {
        return;
      }

      try {
        client.publish(getStateTopic(device), message);
      } catch(err) {
        console.error(`Unable to update state for device ${device.name}: ${err.message}`);
      }
    }
  });
}

async function subscribeDevices() {
  try {
    for (const device of config.devices) {
      await subscribe[device.type](device);
      console.log(`Subscribed to device: ${device.name}`);
    }
  } catch (err) {
    console.error(`Failed to subscribe to device. Error: ${err.message}`);
  }
}

async function registerDevices() {
  try {
    for (const device of config.devices) {
      await register[device.type](device);
      console.log(`Registered device: ${device.name}`);
    }
  } catch (err) {
    console.error(`Failed to register device. Error: ${err.message}`);
  }
}

async function subscribeSwitch(device: DeviceConfiguration) {
  const topic = getCommandTopic(device);

  await client.subscribe(topic);
}

async function registerSwitch(device: DeviceConfiguration) {
  const topic = getConfigTopic(device);
  const message = JSON.stringify({
    name: device.name,
    command_topic: getCommandTopic(device),
    state_topic: getStateTopic(device),
  });
  
  await client.publish(topic, message);
}

function getConfigTopic(device: DeviceConfiguration) {
  return `${getDeviceTopic(device)}/config`;
}
function getCommandTopic(device: DeviceConfiguration) {
  return `${getDeviceTopic(device)}/set`;
}

function getStateTopic(device: DeviceConfiguration) {
  return `${getDeviceTopic(device)}/state`;
}

function getDeviceTopic(device: DeviceConfiguration) {
  return `${topicPrefix}/${device.type}/${device.name}`;
}