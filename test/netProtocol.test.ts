import { decode, encode } from '../src/netProtocol';

const inputOutput: any[] = [
  [10, 'iAs'],
  ['abcdefghij', 'A:abcdefghij'], 
  [[1, 'q'], 'li1s1:qs'],
  [{a: 'b', c: 4}, 'h1:a1:b1:ci4ss'],
  [{a: 'b', c: [4, 'abc']}, 'h1:a1:b1:cli4s3:abcss'],
];

it.each(inputOutput)('Encodes %j to %s', (input: any, expected: string) => {
  expect(encode(input)).toBe(expected);
});

it.each(inputOutput)('Decodes to %j from %s', (expected: any, input: string) => {
  expect(decode(input)).toEqual(expected);
});