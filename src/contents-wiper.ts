import * as fs from 'fs';
import * as path from 'path';
import * as jsdom from 'jsdom';
import * as files from './utils/files';

export const decontentsFolder = (inputFolderPath: string, decontentedFolderPath) => {
  // copy css files
  const cssFiles = files.getFiles(inputFolderPath, '.css');
  cssFiles.forEach((cssFile) => {
    fs.copyFileSync(
      path.resolve(inputFolderPath, cssFile),
      path.resolve(decontentedFolderPath, cssFile),
    );
  });

  // delete files before contents
  const htmFiles = files.getFiles(inputFolderPath, '.htm');
  let contentsMatch = false;

  htmFiles.forEach((htmFile) => {
    if (contentsMatch) {
      fs.copyFileSync(
        path.resolve(inputFolderPath, htmFile),
        path.resolve(decontentedFolderPath, htmFile),
      );
    } else {
      const htmlContent = fs.readFileSync(path.resolve(inputFolderPath, htmFile), 'utf-8');
      const htmlDom = new jsdom.JSDOM(htmlContent);
      contentsMatch = !!htmlDom.window.document.title?.trim().match(/(Contents|contents|目录)/g);
    }
    console.log('wipping contents:' + htmFile);
  });
};

export const decontents = (inputFolderPath: string, decontentedFolderPath: string) => {
  // copy dirs
  files.getDirs(inputFolderPath).forEach((dir) => {
    fs.mkdirSync(path.resolve(decontentedFolderPath, dir), { recursive: true });
    decontentsFolder(path.resolve(inputFolderPath, dir), path.resolve(decontentedFolderPath, dir));
  });
};
