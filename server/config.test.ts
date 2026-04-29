import assert from 'node:assert/strict';
import test from 'node:test';
import { parseListenHost, resolveDoubaoApiKey } from './config';

test('parseListenHost defaults to localhost when HOST is unset', () => {
  assert.equal(parseListenHost(undefined, '127.0.0.1'), '127.0.0.1');
});

test('parseListenHost trims configured HOST values', () => {
  assert.equal(parseListenHost(' 0.0.0.0 ', '127.0.0.1'), '0.0.0.0');
});

test('resolveDoubaoApiKey accepts ARK_API_KEY as a Doubao/Ark alias', () => {
  assert.equal(resolveDoubaoApiKey({ ARK_API_KEY: ' ark-test-key ' }), 'ark-test-key');
});

test('resolveDoubaoApiKey prefers DOUBAO_API_KEY over ARK_API_KEY', () => {
  assert.equal(
    resolveDoubaoApiKey({ DOUBAO_API_KEY: ' doubao-test-key ', ARK_API_KEY: 'ark-test-key' }),
    'doubao-test-key',
  );
});
