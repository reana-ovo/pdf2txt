import { resolve } from 'path';
import { readdirSync, lstatSync } from 'fs';

/**
 * Get all files in a directory
 *
 * @param folderPath directory path
 * @param extention specify file extension
 * @returns array of file
 */
export const getFiles = (folderPath: string, extention?: string) => {
  let files: string[] = [];
  readdirSync(folderPath, { recursive: true, encoding: 'utf-8' }).forEach((file) => {
    lstatSync(resolve(folderPath, file)).isFile() &&
      (extention ? file.endsWith(extention) && files.push(file) : files.push(file));
  });
  return files;
};

/**
 * Get all folders in a directory
 *
 * @param folderPath directory path
 * @returns array of folder
 */
export const getDirs = (folderPath: string) => {
  let dirs: string[] = [];
  readdirSync(folderPath, { recursive: true, encoding: 'utf-8' }).forEach((file) => {
    lstatSync(resolve(folderPath, file)).isDirectory() && dirs.push(file);
  });
  return dirs;
};
