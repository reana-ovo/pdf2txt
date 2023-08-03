import * as fs from 'fs';

export const cleanup = (tempFolderPath: string) => {
  fs.rmSync(tempFolderPath, { force: true, recursive: true });
  console.log('cleaning temp:' + tempFolderPath);
};
