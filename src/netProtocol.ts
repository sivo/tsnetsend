export function encode(input) {
  if (input == null) {
    throw new Error(`Can\'t encode <${input}`);
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