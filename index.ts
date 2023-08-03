import * as path from 'path';
import * as formater from './src/formater';
import * as unclasser from './src/unclasser';
import * as converter from './src/converter';
import * as cleaner from './src/cleaner';

const originFolderPath = path.resolve('origin/');
const exportFolderPath = path.resolve('export/');
const tempFolderPath = path.resolve('.handling/');
const formattedFolderPath = path.resolve('.handling/formatted/');
const unclassedFolderPath = path.resolve('.handling/unclassed/');

// clean up temporary files
cleaner.cleanup(exportFolderPath);

// format files using prettier
formater.formatFolder(originFolderPath, formattedFolderPath);

// remove html elements with styled classes
unclasser.unclass(formattedFolderPath, unclassedFolderPath);

// convert html files to plain text
converter.html2text(unclassedFolderPath, exportFolderPath);

// clean up temporary files
cleaner.cleanup(tempFolderPath);
