import fs from 'fs';
import path from 'path';
import lodash from 'lodash';
import * as Logger from './Logger.js';
import * as FileManager from './FileManager.js';
import * as Tracker from './Tracker.js';

// TODO: Testing value (default 3);
const FREQ_PER_PAGE_THLD = 3;

export const scanMainTextStyle = (jsonFilesFolderPath: string) => {
  // Logger
  Logger.updateLog(path.basename(jsonFilesFolderPath), 'scanning');

  // Get all json files
  const jsonFilesPath = FileManager
    .getFiles(jsonFilesFolderPath, '.json')
    .map((jsonFile) => path.resolve(jsonFilesFolderPath, jsonFile));
  const pageAmount = jsonFilesPath.length;

  // Count for text styles
  const textStyles = textContentCounter(jsonFilesPath, (item, _prev, styles) => {
    // Get text styles with chinese characters
    return item.str.match(/\p{Unified_Ideograph}/u) !== null
      ? getItemTextStyle(item, styles)
      : // Return undefined if not match
        undefined;
  });

  // TODO (Problem): No text style
  textStyles?.length !== 0 || Tracker.alertIssue(jsonFilesFolderPath, 'No Possible Main Style');

  // Get possible main text styles
  const possibleTextStyles: TextStyle[] = textStyles
    // Filter frequencies to remove unvalid styles
    ?.filter((height) => height.count / pageAmount > FREQ_PER_PAGE_THLD)
    // Sort in descending order
    ?.sort((a, b) => b.count - a.count)
    // Convert to array
    ?.flatMap((textStyles) => textStyles.value);

  // TODO (Problem): No text styles matches the frequency threshold
  possibleTextStyles?.length !== 0 ||
    (textStyles?.length !== 0 &&
      Tracker.alertIssue(jsonFilesFolderPath, 'Invalid Possible Main Style'));

  // Get possible line height for every main styles
  const mainStyles: MainStyle[] = possibleTextStyles?.map((style) => {
    const lineHeights = textContentCounter(jsonFilesPath, (item, prev, styles) => {
      // Matches the style and is a complete line
      return prev &&
        prev.hasEOL &&
        item.hasEOL &&
        lodash.isEqual(style, getItemTextStyle(prev as TextContentItem, styles)) &&
        lodash.isEqual(style, getItemTextStyle(item, styles))
        ? // Return the width if the text is vertical
          prev.dir === 'ltr'
          ? Math.abs(prev.transform.at(5) - item.transform.at(5))
          : Math.abs(prev.transform.at(4) - item.transform.at(4))
        : // Return undefined if not match
          undefined;
    });

    // TODO (Problem): No line heights
    lineHeights?.length !== 0 || Tracker.alertIssue(jsonFilesFolderPath, 'No Possible Line Height');

    // Get possible line height
    const possibleLineHeight = lineHeights
      // Line height value must greater than the text size
      ?.filter((lineHeight) => lineHeight.count > style.size)
      // Get the most frequently existed line height
      ?.reduce((max, lineHeight) => {
        // Return current value if the max doesn't exist
        return !max || lineHeight.count > max.count ? lineHeight : max;
      }, undefined)?.value;

    // TODO (Problem): No valid line heights
    possibleLineHeight ??
      (lineHeights?.length !== 0 &&
        Tracker.alertIssue(jsonFilesFolderPath, 'Invalid Possible Line Height'));

    return { textStyle: style, lineHeight: possibleLineHeight };
  });

  // Return empty array if no valid style
  return mainStyles ?? [];
};

export const getItemTextStyle = (
  item: TextContentItem,
  styles?: { [fontName: string]: TextContentStyle },
): TextStyle => {
  return {
    size: item.transform.at(0),
    dir: item.dir,
    // Use font name if style info not provided
    font: styles?.[item.fontName]?.fontFamily ?? item.fontName,
  };
};

const textContentCounter = <T>(
  jsonFilesPath: string[],
  callbackfn: (
    item: TextContentItem,
    prev: TextContentItem & { prevEOL: boolean },
    styles: { [fontName: string]: TextContentStyle },
  ) => T | undefined,
  perCharacter: boolean = false,
) => {
  const counter: Counter<T> = [];
  textContentReader(jsonFilesPath, (item, prev, styles) => {
    // Get the value from the fallback function
    const value = callbackfn(item, prev, styles);

    // Count the value if exists
    value &&
      (counter.find((counter) => lodash.isEqual(counter.value, value))
        ? counter.map((counter) =>
            lodash.isEqual(counter.value, value)
              ? ((counter.count += perCharacter ? item.str.length : 1), counter)
              : counter,
          )
        : counter.push({ value: value, count: 1 }));
  });
  return counter;
};

export const textContentReader = (
  jsonFilesPath: string[],
  callbackfn: (
    item: TextContentItem,
    prev: TextContentItem & { prevEOL: boolean },
    styles: { [fontName: string]: TextContentStyle },
  ) => void,
) => {
  jsonFilesPath.map((jsonFile) => {
    const jsonTextContent: TextContent = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

    // TODO (Error): Broken JSON

    // Count frequency of values
    jsonTextContent.items.reduce((prev: TextContentItem & { prevEOL: boolean }, item) => {
      callbackfn(item, prev, jsonTextContent.styles);

      // TODO: Delete previous of previous EOL if not neccessary
      return { ...item, prevEOL: prev?.hasEOL ?? false };
    }, undefined);
  });
};
