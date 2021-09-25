import { getMatchingDevices } from './common';
import { log } from './log';
import { checkAlive, sendCommand, listen } from './netConnection';
import { Command, DeviceWithIndex, DeviceConfiguration, isDeviceCommand } from './types';

export default class TellstickNet {
  private devices: Record<string, DeviceConfiguration> = {};

  constructor(private host: string, deviceConfigs: DeviceConfiguration[]) {
    for (const deviceConfig of deviceConfigs) {
      this.devices[deviceConfig.name] = deviceConfig;
    }
  }

  public async checkAlive(): Promise<boolean> {
    return await checkAlive(this.host);
  }

  public async listen(callback: (deviceWithIndex: DeviceWithIndex, command: Command) => void): Promise<void> {
    return await listen(this.host, (message: Record<string, unknown> | undefined) => {
      log.info('Received message: ', message);
      if (isDeviceCommand(message)) {
        log.debug('Trying to match devices');
        const matchedDevices = getMatchingDevices(message, Object.values(this.devices));
        matchedDevices.forEach((deviceWithIndex) => callback(deviceWithIndex, message.command));
      }
    });
  }

  public async on(deviceName: string): Promise<boolean> {
    return await this.command(deviceName, 'on');
  }

  public async off(deviceName: string): Promise<boolean> {
    return await this.command(deviceName, 'off');
  }

  public async command(deviceName: string, command: Command): Promise<boolean> {
    log.debug(`Trying to execute command ${command} towards ${deviceName}`);

    try {
      if (!(deviceName in this.devices)) {
        throw(new Error(`Unknown device: ${deviceName}`));
      }

      await sendCommand(this.host, this.devices[deviceName], command);
      log.info(`Executed command ${command} towards device ${deviceName}`);
      return true;
    } catch (err) {
      log.error(`Unable to execute command ${command} towards device ${deviceName}: ${err}`);
      return false;
    } 
  }
}
