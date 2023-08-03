import * as fs from 'fs';
import * as path from 'path';
import * as jsdom from 'jsdom';
import * as files from './utils/files';

export const html2text = (inputFolderPath: string, textFolderPath: string) => {
  // copy dirs
  // files.getDirs(inputFolderPath).forEach((dir) => {
  //   fs.mkdirSync(path.resolve(textFolderPath, dir), { recursive: true });
  // });

  // Get all HTM files in the input folder
  const htmFiles = files.getFiles(inputFolderPath, '.htm');

  // Extract every text from html files
  htmFiles.forEach((htmFile) => {
    const htmlContent = fs.readFileSync(path.resolve(inputFolderPath, htmFile), 'utf-8');
    const htmlDom = new jsdom.JSDOM(htmlContent);
    let textContent = '';
    htmlDom.window.document.querySelectorAll('p').forEach((element) => {
      textContent += element.textContent?.trim() + '\n';
    });
    fs.appendFileSync(
      path.dirname(path.resolve(textFolderPath, htmFile)) + '.txt',
      textContent,
      'utf-8',
    );
  });
};