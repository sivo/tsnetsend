import { log } from './log';
import { checkAlive, sendCommand, listen } from './netConnection';
import { Command, DeviceConfiguration, isDeviceCommand, Value } from './types';

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

  public async listen(callback: (device: DeviceConfiguration, command: Command) => void): Promise<void> {
    return await listen(this.host, (message: Record<string, unknown> | undefined) => {
      log.info('Received message: ', message);
      if (isDeviceCommand(message)) {
        log.debug('Trying to match devices');
        const matchedDevices = getMatchingDevices(message, Object.values(this.devices));
        matchedDevices.forEach((device) => callback(device, message.command));
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
      log.error(`Unable to execute command ${command} towards device ${deviceName}: ${err.stack}`);
      return false;
    } 
  }
}

function getMatchingDevices(parameters: Record<string, unknown>, devices: DeviceConfiguration[]) {
  return devices.filter((device) => {
    for (const deviceParameter of device.parameters) {
      for (const [parameter, value] of Object.entries(deviceParameter)) {
        if ((parameters as typeof deviceParameter)[parameter as keyof typeof deviceParameter] !== value) {
          return false;
        }
      }

      return true;
    }
  });
}