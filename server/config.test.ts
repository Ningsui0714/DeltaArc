import assert from 'node:assert/strict';
import test from 'node:test';
import { parseListenHost } from './config';

test('parseListenHost defaults to localhost when HOST is unset', () => {
  assert.equal(parseListenHost(undefined, '127.0.0.1'), '127.0.0.1');
});

test('parseListenHost trims configured HOST values', () => {
  assert.equal(parseListenHost(' 0.0.0.0 ', '127.0.0.1'), '0.0.0.0');
});
