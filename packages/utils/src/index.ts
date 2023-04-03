import * as fs from 'fs';
import * as path from 'path';

export function getVersion(): string {
  const versionFilePath = path.join(process.cwd(), 'VERSION');

  if (fs.existsSync(versionFilePath)) {
    const version = fs.readFileSync(versionFilePath, 'utf-8');
    return version.trim();
  } else {
    return 'NaN';
  }
}
