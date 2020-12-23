import {createSocket} from 'dgram';
import {encode} from './netProtocol';

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

/**
        0x0000:  4500 00f5 e710 4000 3506 94ab 1fc0 e6c7  E.....@.5.......
        0x0010:  c0a8 0217 afca 045f b415 7b19 86f9 c32b  ......._..{....+
        0x0020:  5018 3c8c afb5 0000 3238 3a35 3430 6239  P.<.....28:540b9
        0x0030:  6230 3530 3836 6162 3439 3234 3265 3836  b05086ab49242e86
        0x0040:  6532 3862 3732 6238 6536 3835 6438 6537  e28b72b8e685d8e7
        0x0050:  3230 3839 463a 343a 7365 6e64 6833 3a41  2089F:4:sendh3:A
        0x0060:  434b 6932 3332 3546 3336 7331 3a53 3833  CKi2325F36s1:S83
        0x0070:  3a18 ff18 1818 7f18 7f18 1818 1818 7f18  :...............
        0x0080:  7f18 1818 7f18 1818 1818 7f18 7f18 1818  ................
        0x0090:  7f18 1818 7f18 1818 1818 7f18 7f18 1818  ................
        0x00a0:  1818 7f18 7f18 1818 7f18 1818 1818 7f18  ................
        0x00b0:  1818 7f18 7f18 1818 7f18 1818 7f18 1818  ................
        0x00c0:  7f18 1818 1818 7f18 1818 7f18 1818 7f18  ................
        0x00d0:  7f18 1818 7f18 1818 1818 7f18 1818 7f18  ................
        0x00e0:  7f18 1818 1818 7f18 1818 7f18 1818 7f18  ................
        0x00f0:  1818 7f18 73                             ....s
 */

const data = [0x34, 0x3a, 0x73, 0x65, 0x6e, 0x64, 0x68, 0x31, 0x3a, 0x53, 0x38, 0x33,
0x3a, 0x18, 0xff, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7f, 0x18,
0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x7f, 0x18, 0x18, 0x18,
0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x7f, 0x18, 0x18, 0x18,
0x18, 0x18, 0x7f, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7f, 0x18,
0x18, 0x18, 0x7f, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18,
0x7f, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18,
0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18,
0x7f, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18, 0x18, 0x18, 0x7f, 0x18,
0x18, 0x18, 0x7f, 0x18, 0x73];

const l = '\x7f';
const s = '\x18';
const x = String.fromCharCode(255);

let payload = 'sxssslslssssslslssslssssslslssslssslssssslslssssslslssslssssslssslslssslssslssslssssslssslssslslssslssssslssslslssssslssslssslsssls';
payload = payload
  .replace(/l/g, l)
  .replace(/s/g, s)
  .replace(/x/g, x);
const data2 = encode('send') + encode({'S': payload})

const buffer = Buffer.from(data2, 'ascii');
server.send(buffer, 42314, '192.168.2.23', (err) => {
  console.log('thing sent', err);
});
