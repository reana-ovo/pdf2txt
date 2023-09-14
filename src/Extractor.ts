import fs from 'fs';
import path from 'path';
import * as Logger from './utils/Logger.js';
import * as FileManager from './utils/FileManager.js';

export const extractText = (jsonFilesFolderPath: string, outputFolderPath: string) => {
  // Create output folder
  fs.mkdirSync(path.resolve(outputFolderPath, path.basename(jsonFilesFolderPath)), {
    recursive: true,
  });

  // Logger
  Logger.updateLog(path.basename(jsonFilesFolderPath), 'extracting');

  // Get all json files
  const jsonFilesPath = FileManager
    .getFiles(jsonFilesFolderPath, '.json')
    .map((jsonFile) => path.resolve(jsonFilesFolderPath, jsonFile));

  // Logger
  Logger.updateLog(path.basename(jsonFilesFolderPath), 'extracting', jsonFilesPath.length);

  // Read json file data
  jsonFilesPath.forEach((jsonFilePath) => {
    // Logger
    Logger.updateLog(path.basename(jsonFilesFolderPath));

    // Get grouped lines
    const groupedLines: GroupedLines = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // Main text
    const mainText =
      groupedLines.main?.reduce((text: string, curr) => {
        text += curr.text;
        curr.EOL && (text += '\n');
        return text;
      }, '') ?? '';

    // Output main text
    const mainFilePath = path.resolve(
      outputFolderPath,
      path.basename(jsonFilesFolderPath),
      path.basename(jsonFilesFolderPath) + '_MAIN.txt',
    );
    fs.existsSync(mainFilePath)
      ? fs.appendFileSync(mainFilePath, mainText, 'utf-8')
      : fs.writeFileSync(mainFilePath, mainText, 'utf-8');

    // Loop through sub texts
    groupedLines.sub?.forEach((subLines, index) => {
      // Sub Text
      const subText =
        subLines.reduce((text: string, curr) => {
          text += curr.text;
          curr.EOL && (text += '\n');
          return text;
        }, '') ?? '';

      // Output sub text
      const subFilePath = path.resolve(
        outputFolderPath,
        path.basename(jsonFilesFolderPath),
        path.basename(jsonFilesFolderPath) + '_SUB_' + index + '.txt',
      );
      fs.existsSync(subFilePath)
        ? fs.appendFileSync(subFilePath, subText, 'utf-8')
        : fs.writeFileSync(subFilePath, subText, 'utf-8');
    });

    // Trash
    const trashText =
      groupedLines.trash?.reduce((text: string, curr) => {
        text += curr.text + '\n';
        return text;
      }, '') ?? '';

    // Output trash text
    const trashFilePath = path.resolve(
      outputFolderPath,
      path.basename(jsonFilesFolderPath),
      path.basename(jsonFilesFolderPath) + '_TRASH.txt',
    );
    fs.existsSync(trashFilePath)
      ? fs.appendFileSync(trashFilePath, trashText, 'utf-8')
      : fs.writeFileSync(trashFilePath, trashText, 'utf-8');
  });
};