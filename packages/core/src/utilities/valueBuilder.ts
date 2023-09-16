import blake from 'blakejs';
import { CLValueParsers, CLKey, CLU256 } from 'casper-js-sdk';
import { concat } from '@ethersproject/bytes';

export const keyAndValueToHex = (key: CLKey, value: CLU256): string => {
  const aBytes = CLValueParsers.toBytes(key).unwrap();
  const bBytes = CLValueParsers.toBytes(value).unwrap();

  const blaked = blake.blake2b(concat([aBytes, bBytes]), undefined, 32);
  return Buffer.from(blaked).toString('hex');
};
