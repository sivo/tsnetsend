import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import * as protocols from './protocols/index';

export type DeviceConfiguration = {
  name: string;
  type: 'switch';
  protocol: keyof typeof protocols;
  model: "selflearning" | "codeswitch";
  house: string | number;
  unit: number;
}

export type Configuration = {
  devices: DeviceConfiguration[];
  mqtt: {
    enabled: boolean;
    host: string;
    port: number;
  };
  tellstickNetIp: string;
}

let configurationPromise: Promise<Configuration>;

export async function getConfiguration(): Promise<Configuration> {
  return await configurationPromise;
}

configurationPromise = readConfiguration();

async function readConfiguration(): Promise<Configuration> {
  const contents = await readFile(`${__dirname}/../config.yml`);
  try {
    return parse(contents.toString('utf8'))
  } catch (err) {
    console.error(`Error when reading or parsing configuration: ${err.message}`);
    throw err;
  }
}
