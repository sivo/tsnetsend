import {initialize as initializeLogger, log} from './log';
import { getConfiguration } from './configuration';
import * as mqtt from './hassMqtt';
import TellstickNet from './TellstickNet';

async function initialize() {
  const config = await getConfiguration();
  initializeLogger('debug');

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
      await mqtt.initialize(tellstick.command.bind(tellstick));
      tellstick.listen((device, command) => {
        if (device.type === 'switch') {
          mqtt.updateState(device.type, device.name, command);
          return;
        }

        if (device.type === 'trigger') {
          mqtt.updateState(device.type, device.name, command);
          return;
        }
      });
    } catch(err) {
      log.error(`Unable to connect to MQTT: ${err.message}`);
    }
  }
}

initialize();

