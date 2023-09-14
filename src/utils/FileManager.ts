import path from 'path';
import fs from 'fs';

/**
 * Get all files in a directory
 *
 * @param folderPath directory path
 * @param extention specify file extension
 * @returns array of file
 */
export const getFiles = (folderPath: string, extention?: string) => {
  let files: string[] = [];
  fs.readdirSync(folderPath, { recursive: true, encoding: 'utf-8' }).forEach((file) => {
    fs.lstatSync(path.resolve(folderPath, file)).isFile() &&
      (extention ? file.endsWith(extention) && files.push(file) : files.push(file));
  });
  return files.sort(
    (a, b) =>
      Number.parseInt(a.match(/(\d+)\..*$/)?.at(1) ?? '0') -
      Number.parseInt(b.match(/(\d+)\..*$/)?.at(1) ?? '0'),
  );
};

/**
 * Get all folders in a directory
 *
 * @param folderPath directory path
 * @returns array of folder
 */
export const getDirs = (folderPath: string) => {
  let dirs: string[] = [];
  fs.readdirSync(folderPath, { recursive: true, encoding: 'utf-8' }).forEach((file) => {
    fs.lstatSync(path.resolve(folderPath, file)).isDirectory() && dirs.push(file);
  });
  return dirs;
};

// TODO: Create Folders
// TODO: Export fs and path
