import {initialize as initializeLogger, log} from './log';
import { getConfiguration } from './configuration';
import * as mqtt from './hassMqtt';
import TellstickNet from './TellstickNet';

async function start() {
  const config = await getConfiguration();
  initializeLogger(process.env.NODE_ENV === 'development' ? 'debug' : config.logLevel);

  log.debug('Configuration: %j', config);

  const tellstick = new TellstickNet(config.tellstickNetIp, config.devices);

  const alive = await tellstick.checkAlive();

  if (!alive) {
    log.error(`No discovery reply from ${config.tellstickNetIp}`);
  } else {
    log.info(`Tellstick found at ${config.tellstickNetIp}`);
  }
  
  if (config.mqtt.enabled) {
    try {
      await mqtt.start(tellstick.command.bind(tellstick));
      tellstick.listen(({device, index}, command) => {
        if (device.type === 'switch') {
          mqtt.updateState(device, index, command);
          return;
        }

        if (device.type === 'trigger') {
          mqtt.updateState(device, index, command);
          return;
        }
      });
    } catch(err) {
      log.error(`Unable to connect to MQTT: ${err.message}`);
    }
  }
}

async function stop() {
  mqtt.stop();
}

start();

setInterval(() => {
  stop();
  start();
}, 3600 * 1000);
