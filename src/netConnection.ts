import { createSocket } from "dgram";
import { getDiscoverPacket, getSendPacket } from "./netPackets";
import { log } from './log';
import { DeviceConfiguration } from "./configuration";
import { Command } from "./types";

const tasks: PromisedTask<unknown>[] = [];
let tasksRunning;
const restPeriod = 500;
const responseTimeout = 500;
const discoverPort = 30303;
const communicationPort = 42314;

interface Task<T> {
  (): Promise<T>;
}

class PromisedTask<T> {
  private resolve;
  private reject;
  public promise;

  constructor(private task: Task<T>) {
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    })
  }

  public run() {
    this.task().then(this.resolve).catch(this.reject);
  }
}

function addTask<T>(task: Task<T>): Promise<T> {
  const promisedTask = new PromisedTask(task);

  tasks.push(promisedTask);
  runTasks();
  return promisedTask.promise;
}

async function runTasks() {
  if (tasksRunning) {
    return;
  }

  tasksRunning = true;

  while(tasks.length) {
    tasks.shift().run();
    await new Promise((resolve) => setTimeout(resolve, restPeriod));    
  }

  tasksRunning = false;
}

export async function checkAlive(host: string): Promise<boolean> {
  return addTask(checkAliveTask.bind(null, host));
}

export async function sendCommand(host: string, device: DeviceConfiguration, command: Command) {
  return addTask(sendCommandTask.bind(null, host, device, command));
}

async function checkAliveTask(host: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve(false);
      client.close();
    }, responseTimeout);

    const client = createSocket('udp4');
    
    client.on('error', (err) => {
      reject(`Error checking connectivity: ${err.message}`);
      clearTimeout(timeout);
      client.close();
    });

    client.on('listening', function() {
      log.debug(`Sending debug to ${host}:${discoverPort}`);
      client.send(getDiscoverPacket(), discoverPort, host, (err) => {
        if (err) {
          return reject(`Failed to send discover packet: ${err.message}`);
        }

        log.debug('Discover sent.');
      });
    });
    
    client.on('message', (msg, info) => {
      log.debug('Data received from discover client : ' + msg.toString());
      log.debug('Discover client received %d bytes from %s:%d',msg.length, info.address, info.port);
      resolve(true);
      clearTimeout(timeout);
      client.close();
    });

    client.on('close', () => {
      log.debug('Discover client closed');
    })
    
    client.bind();
  });
}

async function sendCommandTask(host: string, device: DeviceConfiguration, command: Command): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const client = createSocket('udp4');

    client.on('error', (err) => {
      client.close();
      return reject(`Error in server: ${err}`);
    });
    
    client.on('connect', function(err){
      if (err) {
        return reject(`Connect error: ${err.message}`);
      }
    });
    
    client.on('close',function(){
      log.info('Socket is closed!');
    });

    const message = getSendPacket(device, command);
    
    log.debug(`Sending message to ${host}:${communicationPort}`);
    client.send(message, communicationPort, host, (err) => {
      if (err) {
        return reject(`Failed to send UDP packet: ${err.message}`);
      }

      client.close();
      return resolve();
    });
  });
}