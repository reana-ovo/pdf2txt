import * as fs from 'fs';
import * as path from 'path';
import * as jsdom from 'jsdom';
import * as files from './utils/files';

export const html2text = (inputFolderPath: string, textFolderPath: string) => {
  // copy dirs
  files.getDirs(inputFolderPath).forEach((dir) => {
    fs.mkdirSync(path.resolve(textFolderPath, dir), { recursive: true });
  });

  // Get all HTML files in the input folder
  const htmlFiles = [
    ...files.getFiles(inputFolderPath, '.html'),
    ...files.getFiles(inputFolderPath, '.htm'),
  ];

  // Extract every text from html files
  htmlFiles.forEach((htmlFile) => {
    const htmlContent = fs.readFileSync(path.resolve(inputFolderPath, htmlFile), 'utf-8');
    const htmlDom = new jsdom.JSDOM(htmlContent);
    let textContent = '';
    htmlDom.window.document.querySelectorAll('p').forEach((element) => {
      textContent += element.textContent?.trim() + '\n';
    });
    fs.writeFileSync(path.resolve(textFolderPath, htmlFile + '.txt'), textContent, 'utf-8');
  });
};
