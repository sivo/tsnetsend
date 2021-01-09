import {createSocket} from 'dgram';
import { getPacket } from './netCommunication';

const server = createSocket('udp4');

server.on('error', (err) => {
  console.error(`Error in server: ${err}`);
  server.close();
});

server.on('message', (msg, info) => {
  console.log('Data received from client : ' + msg.toString());
  console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
});

server.on('listening',function(){
  var address = server.address();
  var port = address.port;
  var family = address.family;
  var ipaddr = address.address;
  console.log('Server is listening at port' + port);
  console.log('Server ip :' + ipaddr);
  console.log('Server is IP4/IP6 : ' + family);
});

//emits after the socket is closed using socket.close();
server.on('close',function(){
  console.log('Socket is closed !');
});

server.bind(3000);

const bufferOn = getPacket({
  protocol: 'arctech',
  model: 'selflearning',
  house: 6008049,
  unit: 1,
  command: 'on'
});

const bufferOff = getPacket({
  protocol: 'arctech',
  model: 'selflearning',
  house: 6008049,
  unit: 1,
  command: 'off'
});

server.send(bufferOn, 42314, '192.168.2.21', (err) => {
  console.log('on sent', err);

  server.send(bufferOff, 42314, '192.168.2.21', (err) => {
    console.log('off sent', err);
  });
});
