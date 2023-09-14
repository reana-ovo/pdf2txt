import path from 'path';
import * as Logger from './src/utils/Logger.js';
import * as FileManager from './src/utils/FileManager.js';
import * as Converter from './src/Converter.js';
import * as Transformer from './src/Transformer.js';
import * as Extractor from './src/Extractor.js';

const logFolderPath = path.resolve('log/');
const originFolderPath = path.resolve('origin/');
const convertFolderPath = path.resolve('.handling/convert/');
const transformFolderPath = path.resolve('export/transform/');
const extractFolderPath = path.resolve('export/extract/');

// Async size
const ASYNC_POOL_SIZE = 4;

// Get PDF files
const pdfFiles = FileManager.getFiles(originFolderPath, '.pdf');

// Worker Size
const workerAmount: number = Math.ceil(pdfFiles.length / ASYNC_POOL_SIZE);

// Initialize logger
Logger.init(logFolderPath, workerAmount);

// TODO: Worker queue
// Process PDF files
[...Array(workerAmount).keys()].reduce(async (prev, row) => {
  await prev;

  // Update logger
  Logger.updateWorker(row + 1);

  // Create new worker
  const asyncWorker = pdfFiles
    .slice(row * ASYNC_POOL_SIZE, Math.min((row + 1) * ASYNC_POOL_SIZE, pdfFiles.length))
    .map(async (file) => {
      // Resolve file paths
      const convertFilesFolderPath = path.resolve(convertFolderPath, file.replace(/\.pdf$/, ''));
      const transformFilesFolderPath = path.resolve(
        transformFolderPath,
        file.replace(/\.pdf$/, ''),
      );

      // Convert pdf
      const convertResult = await Converter.pdf2jsonPages(
        path.resolve(originFolderPath, file),
        convertFilesFolderPath,
      );

      // Extract data
      convertResult &&
        (Transformer.transform(convertFilesFolderPath, transformFolderPath),
        Extractor.extractText(transformFilesFolderPath, extractFolderPath));

      return convertResult;
    });

  // TODO: Deal with failure and timeout
  return await Promise.all(asyncWorker);
}, Promise.resolve(<boolean[]>[]));
