import fs from 'fs';
import path from 'path';
import util from 'util';
import * as logUpdate from 'log-update';

const FRAME_UPDATE_INTERVAL = 100;

const logUpdateStream = logUpdate.createLogUpdate(process.stdout);
const frames = ['⠁', '⠉', '⠙', '⠹', '⢹', '⣸', '⣴', '⣦', '⣇', '⡇', '⠇', '⠃'];

let logText = '';
let frameIndex = 0;
let lastFrameUpdate: number;
let start: number;
let workerTotal: number;
let workerCurr: number;

export const init = (logFolderPath: string, workerAmount: number) => {
  // Create timer
  start = Date.now();

  // Set worker amount
  workerTotal = workerAmount;

  // Create log folder if it doesn't exist
  fs.mkdirSync(logFolderPath, { recursive: true });

  // Create log stream
  const logFile = fs.createWriteStream(
    path.resolve(logFolderPath, new Date().toISOString().replaceAll(/:/g, '-') + '.log'),
    { flags: 'a' },
  );

  // Rewrite console.log
  console.log = (...data: any[]) => {
    logFile.write('[' + new Date().toISOString() + ']<LOG>: ');
    logFile.write(util.format.apply(null, data) + '\n');
  };

  // Rewrite console.info
  console.info = (...data: any[]) => {
    logFile.write('[' + new Date().toISOString() + ']<INFO>: ');
    logFile.write(util.format.apply(null, data) + '\n');
  };

  // TODO: zip and delete oversizing logs
};

export const updateWorker = (row: number) => {
  // Update current worker row
  workerCurr = row;

  // Clear logText
  logText = '';
};

export const updateLog = (name: string, state?: string, number?: number) => {
  // First update
  lastFrameUpdate ??= Date.now();

  // Increase the frame index
  frameIndex =
    Date.now() - lastFrameUpdate > FRAME_UPDATE_INTERVAL
      ? ++frameIndex % frames.length
      : frameIndex;

  // Update the log
  const logNameRegex = new RegExp(
    `^${name}\\s+(?<state>\\w+)(?:\\s+\\((?<working>\\d+)\\/(?<total>\\d+)\\))?.*$`,
    'md',
  );
  const matcher = logText.match(logNameRegex);
  logText = matcher
    ? logText.replace(
        logNameRegex,
        `${name} ${state ?? '$<state>'}${
          // If has argument `number`
          number
            ? ' (0/' + number + ')'
            : state || (matcher?.groups?.total?.length ?? 0) === 0 // If total number not exsist or has argument `state`
            ? ''
            : ' (' +
              // Increase number
              (Number.parseInt(logText.match(logNameRegex)?.groups?.working ?? '0') + 1) +
              '/$<total>)'
        }`,
      )
    : logText.concat(`${name} ${state}${number ? ' (0/' + number + ')' : ''}\n`);
  logUpdateStream(
    logText +
      `${frames.at(frameIndex)} Processing(${workerCurr}/${workerTotal}) ${
        (Date.now() - start) / 1000
      }s`,
  );
  // TODO: Remove useless file log
  // console.info(logText.match(logNameRegex)?.[0] ?? 'Update log failed');

  // Update frame change timer
  lastFrameUpdate =
    Date.now() - lastFrameUpdate > FRAME_UPDATE_INTERVAL ? Date.now() : lastFrameUpdate;
};
