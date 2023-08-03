import * as path from 'path';
import * as formater from './src/formater';
import * as contentsWiper from './src/contents-wiper';
import * as unclasser from './src/unclasser';
import * as converter from './src/converter';
import * as trimer from './src/trimer';
import * as cleaner from './src/cleaner';

const originFolderPath = path.resolve('origin/');
const exportFolderPath = path.resolve('export/');
const tempFolderPath = path.resolve('.handling/');
const formattedFolderPath = path.resolve('.handling/formatted/');
const decontentsFolderPath = path.resolve('.handling/decontents/');
const unclassedFolderPath = path.resolve('.handling/unclassed/');
const textFolderPath = path.resolve('.handling/text/');

// clean up temporary files
cleaner.cleanup(exportFolderPath);

// format files using prettier
formater.formatFolder(originFolderPath, formattedFolderPath);

// remove files of contents
contentsWiper.decontents(formattedFolderPath, decontentsFolderPath);

// remove html elements with styled classes
unclasser.unclass(decontentsFolderPath, unclassedFolderPath);

// convert html files to plain text
converter.html2text(unclassedFolderPath, textFolderPath);

// trim text files
trimer.trim(textFolderPath, exportFolderPath);

// clean up temporary files
// cleaner.cleanup(tempFolderPath);
