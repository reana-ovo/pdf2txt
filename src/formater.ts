import * as fs from 'fs';
import * as path from 'path';
import * as files from './utils/files';
import * as synchronizedPrettier from '@prettier/sync';

/**
 * format a file with prettier
 *
 * @param inputFilePath path of unformatted file
 * @param formattedFilePath path of output file
 */
export const formatFile = (inputFilePath: string, formattedFilePath: string) => {
  const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
  const formattedContent =
    inputFilePath.endsWith('.html') || inputFilePath.endsWith('.htm')
      ? synchronizedPrettier.format(fileContent, { parser: 'html' })
      : inputFilePath.endsWith('.css')
      ? synchronizedPrettier.format(fileContent, { parser: 'css' })
      : fileContent;
  fs.writeFileSync(formattedFilePath, formattedContent, 'utf-8');
};

/**
 * format files in a directory with prettier
 *
 * @param inputFolderPath folder path of unformatted files
 * @param formattedFolderPath path of output folder
 */
export const formatFolder = (inputFolderPath: string, formattedFolderPath: string) => {
  // copy dirs
  files.getDirs(inputFolderPath).forEach((dir) => {
    fs.mkdirSync(path.resolve(formattedFolderPath, dir), { recursive: true });
  });
  // format files
  files.getFiles(inputFolderPath).forEach((file) => {
    formatFile(path.resolve(inputFolderPath, file), path.resolve(formattedFolderPath, file));
  });
};
