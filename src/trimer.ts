import * as fs from 'fs';
import * as path from 'path';

export const trim = (inputFolderPath: string, trimmedFolderPath: string) => {
  // Create folder
  fs.mkdirSync(path.resolve(trimmedFolderPath), { recursive: true });

  fs.readdirSync(inputFolderPath, { recursive: true }).forEach((file) => {
    let fileContent = fs.readFileSync(path.resolve(inputFolderPath, file), 'utf8');
    fileContent = fileContent.replaceAll(
      /([a-zA-Z0-9\u4e00-\u9fa5])\n\s*([a-zA-Z0-9\u4e00-\u9fa5])/g,
      '$1$2',
    );
    fs.writeFileSync(path.resolve(trimmedFolderPath, file), fileContent, 'utf8');
  });
};
