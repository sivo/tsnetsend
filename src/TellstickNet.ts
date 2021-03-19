import { log } from './log';
import { DeviceConfiguration } from './configuration';
import { checkAlive, sendCommand, listen } from './netConnection';
import { Command } from './types';

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

  public async listen(): Promise<void> {
    return await listen(this.host, (obj) => console.log('Got object: ', obj));
  }

  public async on(deviceName: string): Promise<boolean> {
    return await this.command(deviceName, Command.on);
  }

  public async off(deviceName: string): Promise<boolean> {
    return await this.command(deviceName, Command.off);
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