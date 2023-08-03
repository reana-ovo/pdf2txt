import * as fs from 'fs';
import * as path from 'path';
import * as jsdom from 'jsdom';
import * as files from './utils/files';

/**
 * Remove elements with styled classes from HTML files in a folder
 *
 * @param inputFolderPath directory of the input folder
 * @param unclassedFolderPath directory of the output folder
 */
export const unclass = (inputFolderPath: string, unclassedFolderPath: string) => {
  // copy dirs
  files.getDirs(inputFolderPath).forEach((dir) => {
    fs.mkdirSync(path.resolve(unclassedFolderPath, dir), { recursive: true });
  });

  // Get all CSS and HTML files in the input folder
  const cssFiles = files.getFiles(inputFolderPath, '.css');
  const htmlFiles = [
    ...files.getFiles(inputFolderPath, '.html'),
    ...files.getFiles(inputFolderPath, '.htm'),
  ];

  // Get all styled classnames in the CSS files
  let classArray: string[] = [];
  cssFiles.forEach((cssFile) => {
    const cssContent = fs.readFileSync(path.resolve(inputFolderPath, cssFile), 'utf-8');
    classArray.push(...(cssContent.match(/(?<=\s+[^{}]*)\.[^\s,]+(?=( |,)[^{}]*{)/g) || []));
  });

  // Remove elements with the styled classnames from the HTML files
  htmlFiles.forEach((htmlFile) => {
    const htmlContent = fs.readFileSync(path.resolve(inputFolderPath, htmlFile), 'utf-8');
    const htmlDom = new jsdom.JSDOM(htmlContent);
    classArray.forEach((className) => {
      htmlDom.window.document.querySelectorAll(className).forEach((element) => {
        element.remove();
      });
    });
    fs.writeFileSync(path.resolve(unclassedFolderPath, htmlFile), htmlDom.serialize(), 'utf-8');
  });
};
