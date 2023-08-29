import fs from 'fs';
import path from 'path';
import pdfjs from 'pdfjs-dist';
import * as logger from './utils/logger.js';

const MAX_PDFDOC_FUNCS = 100;

export const pdf2jsonPages = async (pdfFilePath: string, outputFolderPath: string) => {
  // Logger
  logger.updateLog(path.basename(pdfFilePath, '.pdf'), 'converting');

  // Create output folder
  fs.mkdirSync(outputFolderPath, { recursive: true });

  // Get total pages number
  const pdfDocLoader = pdfjs.getDocument({
    url: pdfFilePath,
    // CMapReaderFactory,
    // cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist/cmaps/',
    // cMapPacked: true,
    useWorkerFetch: true,
    // fontExtraProperties: true,
  });
  const pdfDoc = await pdfDocLoader.promise;
  const pageAmount = pdfDoc.numPages;

  // Logger
  logger.updateLog(path.basename(pdfFilePath, '.pdf'), 'converting', pageAmount);

  // Convert every page of the pdf file to json
  return [...Array(Math.ceil(pageAmount / MAX_PDFDOC_FUNCS)).keys()].reduce(async (result, row) => {
    // Wait previous row to complete
    await result;

    // Divide task into rows to prevent exceeding the maximum of pdfDocLoader functions
    const rowResult = [
      ...Array(Math.min(pageAmount - row * MAX_PDFDOC_FUNCS, MAX_PDFDOC_FUNCS)).keys(),
    ].map(async (index) => {
      // Extract text content to json
      const page = row * MAX_PDFDOC_FUNCS + index + 1;
      const pdfPage = await pdfDoc.getPage(page);

      // Enable normalization
      const textContent = JSON.stringify(
        await pdfPage.getTextContent({ disableNormalization: false }),
      );
      const outputFilePath = path.resolve(outputFolderPath, page + '.json');
      fs.writeFileSync(outputFilePath, textContent);

      // Logging
      logger.updateLog(path.basename(pdfFilePath, '.pdf'));

      // Check if the output file is written correctly
      return fs.readFileSync(outputFilePath, 'utf-8') === textContent && result;
    }, Promise.resolve(true));
    return (await Promise.all(rowResult)).reduce((prev, curr) => prev && curr, true) && result;
  }, Promise.resolve(true));
};
