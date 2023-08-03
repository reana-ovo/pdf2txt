import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from '@cyber2024/pdf-parse-fixed';

export const pdfExtract = () => {
  let pdfBuffer = fs.readFileSync(path.resolve('./origin/阿特米斯3.pdf'));

  pdfParse(pdfBuffer).then((data) => {
    console.log(data.text);
  });
};
