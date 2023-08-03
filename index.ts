import * as path from 'path';
import * as formater from './src/formater';
import * as unclasser from './src/unclasser';
import * as acrobat from './src/acrobat';

// const originFolderPath = path.resolve('origin/');
// const formattedFolderPath = path.resolve('.handling/formatted/');
// const unclassedFolderPath = path.resolve('.handling/unclassed/');

// // format files using prettier
// formater.formatFolder(originFolderPath, formattedFolderPath);

// // remove html elements with styled classes
// unclasser.unclass(formattedFolderPath, unclassedFolderPath);

acrobat.extractTextWithStyles();
