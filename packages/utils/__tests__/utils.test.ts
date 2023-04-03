import { getVersion } from '../dist/index.js';
import * as fs from 'fs';
import * as path from 'path';

describe('getVersion', () => {
  afterEach(() => {
    try {
      fs.unlinkSync(path.join(process.cwd(), 'VERSION'));
    } catch (error) {
      // Ignore
    }
  });

  test('returns content of VERSION file', () => {
    fs.writeFileSync(path.join(process.cwd(), 'VERSION'), '1.2.3');
    expect(getVersion()).toBe('1.2.3');
  });

  test('returns NaN when VERSION file does not exist', () => {
    expect(getVersion()).toBe('NaN');
  });
});
