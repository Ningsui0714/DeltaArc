import assert from 'node:assert/strict';
import test from 'node:test';
import { parseJsonImport } from './parseJsonImport';

test('parseJsonImport marks evidence arrays as append imports', () => {
  const payload = parseJsonImport(
    JSON.stringify([
      {
        title: 'Interview note',
        summary: 'Players bounced on onboarding.',
      },
    ]),
  );

  assert.equal(payload.evidenceMode, 'append');
  assert.equal(payload.evidenceItems?.length, 1);
});

test('parseJsonImport preserves empty bundle evidence as a replace operation', () => {
  const payload = parseJsonImport(
    JSON.stringify({
      project: {
        name: 'Demo project',
      },
      evidenceItems: [],
    }),
  );

  assert.equal(payload.evidenceMode, 'replace');
  assert.deepEqual(payload.evidenceItems, []);
  assert.equal(payload.project?.name, 'Demo project');
});

test('parseJsonImport rejects non-array evidenceItems in project bundles', () => {
  assert.throws(
    () =>
      parseJsonImport(
        JSON.stringify({
          project: {
            name: 'Demo project',
          },
          evidenceItems: {
            title: 'Broken payload',
          },
        }),
      ),
    /evidenceItems array/i,
  );
});

test('parseJsonImport keeps plain project objects out of evidence replacement mode', () => {
  const payload = parseJsonImport(
    JSON.stringify({
      name: 'Project only',
      validationGoal: 'Prove the first-session hook.',
    }),
  );

  assert.equal(payload.evidenceMode, 'none');
  assert.equal(payload.project?.name, 'Project only');
  assert.equal(payload.evidenceItems, undefined);
});
