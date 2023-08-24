import path from 'path';
import * as logger from './src/utils/logger.js';
import * as fileManager from './src/utils/fileManager.js';
import * as converter from './src/converter.js';
import * as transformer from './src/transformer.js';
import * as extractor from './src/extractor.js';

import * as scanner from './src/utils/scanner.js';

const logFolderPath = path.resolve('log/');
const originFolderPath = path.resolve('origin/');
const convertFolderPath = path.resolve('.handling/convert/');
const transformFolderPath = path.resolve('.handling/transform/');
const extractFolderPath = path.resolve('.handling/extract/');

// Async size
const ASYNC_POOL_SIZE = 4;

// Get PDF files
const pdfFiles = fileManager.getFiles(originFolderPath, '.pdf');

// Worker Size
const workerAmount: number = Math.ceil(pdfFiles.length / ASYNC_POOL_SIZE);

// Initialize logger
logger.init(logFolderPath, workerAmount);

// Process PDF files
[...Array(workerAmount).keys()].reduce(async (prev, row) => {
  await prev;

  // Update logger
  logger.updateWorker(row + 1);

  const asyncWorker = pdfFiles
    .slice(row * ASYNC_POOL_SIZE, Math.min((row + 1) * ASYNC_POOL_SIZE, pdfFiles.length))
    .map(async (file) => {
      const convertFilesFolderPath = path.resolve(convertFolderPath, file.replace(/\.pdf$/, ''));
      const transformFilesFolderPath = path.resolve(
        transformFolderPath,
        file.replace(/\.pdf$/, ''),
      );

      const convertResult = await converter.pdf2jsonPages(
        path.resolve(originFolderPath, file),
        convertFilesFolderPath,
      );

      transformer.transform(convertFilesFolderPath, transformFolderPath);
      extractor.extractText(transformFilesFolderPath, extractFolderPath);
      return convertResult;
    });
  return await Promise.all(asyncWorker);
}, Promise.resolve([true]));
