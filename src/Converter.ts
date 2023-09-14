import fs from 'fs';
import path from 'path';
import pdfjs from 'pdfjs-dist';
import * as Logger from './utils/Logger.js';

const MAX_PDFDOC_FUNCS = 100;

export const pdf2jsonPages = async (pdfFilePath: string, outputFolderPath: string) => {
  // Logger
  Logger.updateLog(path.basename(pdfFilePath, '.pdf'), 'converting');

  // Create output folder
  fs.mkdirSync(outputFolderPath, { recursive: true });

  try {
    // Create PDF loader
    const pdfDocLoader = pdfjs.getDocument({
      url: pdfFilePath,
      // Fix issue with foxit fonts
      cMapUrl: './node_modules/pdfjs-dist/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: './node_modules/pdfjs-dist/standard_fonts/',
      // useWorkerFetch: true,
      // disableFontFace: true,
      // useSystemFonts: true,
      // fontExtraProperties: true,
    });
    const pdfDoc = await pdfDocLoader.promise;

    // Get total pages number
    const pageAmount = pdfDoc.numPages;

    // Logger
    Logger.updateLog(path.basename(pdfFilePath, '.pdf'), 'converting', pageAmount);

    // Convert every page of the pdf file to json
    return [...Array(Math.ceil(pageAmount / MAX_PDFDOC_FUNCS)).keys()].reduce(
      async (result, row) => {
        // Wait previous row to complete
        await result;

        // Divide task into rows to prevent exceeding the maximum of pdfDocLoader functions
        const rowResult = [
          ...Array(Math.min(pageAmount - row * MAX_PDFDOC_FUNCS, MAX_PDFDOC_FUNCS)).keys(),
        ].map(async (index) => {
          try {
            // Extract text content to json
            const page = row * MAX_PDFDOC_FUNCS + index + 1;
            const pdfPage = await pdfDoc.getPage(page);

            // Enable normalization
            const textContent = JSON.stringify(
              await pdfPage.getTextContent({ disableNormalization: false }),
            );

            // Output json to file
            const outputFilePath = path.resolve(outputFolderPath, page + '.json');
            fs.writeFileSync(outputFilePath, textContent);

            // Logging
            Logger.updateLog(path.basename(pdfFilePath, '.pdf'));

            // Check if the output file is written correctly
            return fs.readFileSync(outputFilePath, 'utf-8') === textContent && result;
          } catch (err) {
            console.error(err);
            return false;
          }
        }, Promise.resolve(true));
        return (await Promise.all(rowResult)).reduce((prev, curr) => prev && curr, true) && result;
      },
      Promise.resolve(true),
    );
  } catch (err) {
    console.error(err);
    return false;
  }
};
