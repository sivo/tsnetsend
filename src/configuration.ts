import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import * as protocols from './protocols/index';

const possibleConfigFiles = [
  '/config/config.yml',
  `${__dirname}/../config.yml`,
]

type Parameters = {
  house: string | number;
  unit: number;
}

export type DeviceConfiguration = {
  name: string;
  type: 'switch';
  protocol: keyof typeof protocols;
  model: "selflearning" | "codeswitch";
  parameters: Parameters[];
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
  let contents: string | undefined = undefined;

  for (const fileName of possibleConfigFiles) {
    try {
      contents = await readFile(fileName, 'utf8');
      break;
    } catch (err) {}
  }

  if (!contents) {
    console.error('Configuration file not found');
    throw new Error('Configuration file not found');
  }
  
  try {
    return parse(contents)
  } catch (err) {
    console.error(`Error when reading or parsing configuration: ${err.message}`);
    throw err;
  }
}
