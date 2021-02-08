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
  
  // await tellstick.on('AN_1');
  // await tellstick.off('AN_1');
  // await tellstick.on('AN_1');
  // await tellstick.off('AN_1');

  if (config.mqtt.enabled) {
    try {
      await mqtt.initialize(tellstick.command.bind(tellstick));
    } catch(err) {
      log.error(`Unable to connect to MQTT: ${err.message}`);
    }
  }
}

initialize();

