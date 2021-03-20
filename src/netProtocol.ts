import {Value, ValueMap} from './types';

export function encode(input: Value): string {
  if (input == null) {
    throw new Error(`Can\'t encode ${input}`);
  }

  if (typeof(input) === 'number') {
    return 'i' + input.toString(16).toUpperCase() + 's';
  }

  if (typeof(input) === 'string') {
    return input.length.toString(16).toUpperCase() + ':' + input;
  }

  if(Array.isArray(input)) {
    return 'l' + input.map((element) => encode(element)).join('') + 's';
  }

  if (typeof(input) === 'object') {
    let result = 'h';

    for(const [key, value] of Object.entries(input)) {
      result += encode(key) + encode(value);
    }

    return result + 's';
  }

  throw new Error(`Can\'t encode <${input}`);
}

const nrRegex = /^i([A-F0-9]+)s(.*)$/;
const strRegex = /^([A-F0-9]+):(.*)$/;
const lstRegex = /^l(.*)$/;
const objRegex = /^h(.*)$/;

export function decode(input: string): Value {
  return decodeInternal(input).value;
}

function decodeInternal(input: string): {value: Value, rest: string } {
  const outputFront = '';
  const outputEnd = '';

  let match;
  match = input.match(nrRegex);
  if (match) {
    return {
      value: parseInt(match[1], 16),
      rest: match[2]
    }
  }

  match = input.match(strRegex);
  if (match) {
    const start = match[1].length + 1;
    const end = start + parseInt(match[1], 16);
    return {
      value: input.substring(start, end),
      rest: input.substring(end)
    };
  }

  match = input.match(lstRegex);
  if (match) {
    const result = [];
    let rest = match[1];
    let value;

    while (rest && rest[0] !== 's') {
      ({rest, value} = decodeInternal(rest));
      result.push(value);
    }

    return {
      value: result,
      rest: rest?.substring(1)
    };
  }

  match = input.match(objRegex);
  if (match) {
    const result: ValueMap = {};
    let rest = match[1];
    let key, value;

    while (rest && rest[0] !== 's') {
      ({rest, value: key} = decodeInternal(rest));
      ({rest, value} = decodeInternal(rest));
      result[key as string] = value;
    }

    return {
      value: result,
      rest: rest?.substring(1)
    }
  }

  return {
    value: undefined,
    rest: ''
  };
}