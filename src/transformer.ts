import fs from 'fs';
import path from 'path';
import lodash from 'lodash';
import * as logger from './utils/logger.js';
import * as scanner from './utils/scanner.js';
import * as fileManager from './utils/fileManager.js';
import * as tracker from './utils/tracker.js';

// TODO: Testing value (Default: 0.01)
const BASELINE_BIAS_FACT_THLD = 0.01;
const LINEHEIGHT_BIAS_FACT_THLD = 0.05;
const LINEEND_BIAS_FACT_THLD = 0.9;
const LINESTART_BIAS_FACT_THLD = 0.9;
const EMPTY_ITEM_WIDTH_FACT_THLD = 0.75;

export const transform = (jsonFilesFolderPath: string, outputFolderPath: string) => {
  // Create output folder
  const outputFilesFolderPath = path.resolve(outputFolderPath, path.basename(jsonFilesFolderPath));
  fs.mkdirSync(outputFilesFolderPath, {
    recursive: true,
  });

  // Get main text style
  const mainStyles = scanner.scanMainTextStyle(jsonFilesFolderPath);

  // Logger
  logger.updateLog(path.basename(jsonFilesFolderPath), 'transforming');

  // Get all json files
  const jsonFilesPath = fileManager
    .getFiles(jsonFilesFolderPath, '.json')
    .map((jsonFile) => path.resolve(jsonFilesFolderPath, jsonFile));

  // Logger
  logger.updateLog(path.basename(jsonFilesFolderPath), 'transforming', jsonFilesPath.length);

  // Transform json pages into line data
  jsonFilesPath.forEach((jsonFile) => {
    // Logger
    logger.updateLog(path.basename(jsonFilesFolderPath));

    // Get page number
    const pageNumber = Number.parseInt(jsonFile.match(/(\d+)\..*$/)?.at(1));

    // Get page line data from text content
    const textContentLines: [number, ...TextContentItem[]][] = [];
    // Init the first line with group trash
    textContentLines.push([mainStyles.length]);
    scanner.textContentReader([jsonFile], (textContentItem, _prev, textContentStyles) => {
      // Push text content item into the last line
      textContentLines[textContentLines.length - 1].push({
        ...textContentItem,
        // Remove the align spaces
        str: textContentItem.str.match(
          /^\s*(?:[^\p{Unified_Ideograph}]*\p{Unified_Ideograph}[^\p{Unified_Ideograph}]*(?:\s|[^\p{Unified_Ideograph}])+)+[^\p{Unified_Ideograph}]*\p{Unified_Ideograph}[^\p{Unified_Ideograph}]*\s*$/u,
        )
          ? textContentItem.str.replaceAll(
              /((?:\p{S}|\p{M}|\p{P})*(?:\p{Unified_Ideograph}|\p{S}|\p{M}|\p{P})(?:\p{S}|\p{M}|\p{P})*)(?:\s+|(\p{S}|\p{M}|\p{P}+))/gu,
              '$1$2',
            )
          : textContentItem.str,
        // Parse font name into font family
        fontName: textContentStyles[textContentItem.fontName].fontFamily,
      });

      // Change the group of the line if the item matches any main style
      mainStyles.forEach((mainStyle, index) => {
        // If the style matches
        lodash.isEqual(
          scanner.getItemTextStyle(textContentItem, textContentStyles),
          mainStyle.textStyle,
        ) &&
          // Change the group number if it is smaller
          (textContentLines[textContentLines.length - 1][0] = Math.min(
            index,
            textContentLines[textContentLines.length - 1][0],
          ));
      });

      // If item has a EOL then create a new line with group trash
      textContentItem.hasEOL && textContentLines.push([mainStyles.length]);
    });

    // TODO (Problem): No end of page (Only for main styles)
    // textContentLines.at(-1).at(-1) !== mainStyles.length &&
    //   tracker.alertIssue(jsonFilesFolderPath, 'No End of Page', pageNumber);

    // Integrate line data
    let mainIndex = 0;
    let integratedLines: IntegratedLine[] = [];
    textContentLines.forEach((textContentLine) => {
      // Deconstruct the line data
      const [styleIndex, ...textContentLineItems] = textContentLine;

      // TODO: Remove if necessarys
      // Remove empty lines
      if (textContentLineItems.length === 1 && textContentLineItems.at(0).str.trim().length === 0) {
        return;
      }

      // Get baseline
      const baseline = textContentLineItems.reduce(
        (baseline: number | undefined, textContentLineItem) => {
          const itemBaseline = textContentLineItem.transform.at(
            // Get the dir of the style
            textContentLineItem.dir === 'ltr' ? 5 : 4,
          );
          return lodash.isEqual(
            scanner.getItemTextStyle(textContentLineItem),
            mainStyles.at(styleIndex)?.textStyle,
          ) && // Empty item not considered
            textContentLineItem.str.trim().length !== 0
            ? baseline
              ? // Check if the baseline is valid
                Math.abs(baseline - itemBaseline) <
                BASELINE_BIAS_FACT_THLD * mainStyles.at(styleIndex).textStyle.size
                ? baseline
                : 0
              : itemBaseline
            : baseline;
        },
        undefined,
      );

      // Integrate items into line item
      const integratedLine = textContentLineItems.reduce(
        (result: IntegratedLineItem, textContentLineItem) => {
          // Get the baseline of the item
          const itemBaseline =
            styleIndex < mainStyles.length
              ? textContentLineItem.transform.at(
                  mainStyles.at(styleIndex).textStyle.dir === 'ltr' ? 5 : 4,
                )
              : undefined;

          // Check if the item matches the baseline or matches the style
          itemBaseline &&
          (Math.abs(baseline - itemBaseline) <
            BASELINE_BIAS_FACT_THLD * mainStyles.at(styleIndex).textStyle.size ||
            lodash.isEqual(
              scanner.getItemTextStyle(textContentLineItem),
              mainStyles.at(styleIndex).textStyle,
            ))
            ? styleIndex === 0
              ? // Main line
                result.lineItem
                ? (result.lineItem = appendLineItem(
                    result.lineItem,
                    textContentLineItem,
                    mainStyles.at(styleIndex).textStyle.dir === 'ltr',
                  ))
                : (result.lineItem = createLineItem(
                    textContentLineItem,
                    baseline,
                    mainStyles.at(styleIndex).textStyle.dir === 'ltr',
                  ))
              : // Sub line
              result.lineItem
              ? (result.lineItem = appendSubLineItem(
                  <SubLineItem>result.lineItem,
                  textContentLineItem,
                  mainStyles.at(styleIndex).textStyle.dir === 'ltr',
                ))
              : (result.lineItem = createSubLineItem(
                  textContentLineItem,
                  baseline,
                  mainStyles.at(styleIndex).textStyle.dir === 'ltr',
                  mainIndex,
                ))
            : // Baseline and style not match
              // TODO: Update line end if matches the line height
              result.trashItems.push(
                createTrashItem(
                  textContentLineItem,
                  mainIndex,
                  styleIndex !== mainStyles.length && mainStyles.length !== 0,
                ),
              );

          return result;
        },
        { lineItem: undefined, trashItems: [] },
      );

      // Add line item to the integrated lines
      integratedLines.push({
        styleIndex,
        ...integratedLine,
      });

      // Accumulate the main index
      mainIndex += styleIndex === 0 && mainStyles.length !== 0 ? 1 : 0;
    });

    // Calculate the connection of those lines
    const mainLineItems: LineItem[] = mainStyles.length === 0 ? undefined : [];
    const subLineItems: SubLineItem[][] = mainStyles.length - 1 > 0 ? [] : undefined;
    mainStyles.length - 1 > 0 &&
      [...Array(mainStyles.length - 1).keys()].forEach(() => subLineItems.push([]));
    const trashItems: TrashItem[] = [];
    integratedLines.reduce((_prevLine, integratedLine) => {
      // Get the previous line of the same style, and ignore the empty line
      const prevLineOfSameStyle: LineItem | SubLineItem =
        integratedLine.styleIndex === 0 && mainStyles.length !== 0
          ? mainLineItems.findLast((lineItem) => lineItem.text.trim().length !== 0)
          : integratedLine.styleIndex === mainStyles.length
          ? undefined
          : subLineItems[integratedLine.styleIndex - 1]?.findLast(
              (subLineItem) => subLineItem.text.trim().length !== 0,
            );

      // Trash lines
      trashItems.push(...integratedLine.trashItems);

      // First of page in style or empty line
      if (!prevLineOfSameStyle || integratedLine.lineItem.text.trim().length === 0) {
        integratedLine.styleIndex === 0 && mainStyles.length !== 0
          ? mainLineItems.push(integratedLine.lineItem)
          : integratedLine.styleIndex === mainStyles.length
          ? null
          : subLineItems[integratedLine.styleIndex - 1].push(<SubLineItem>integratedLine.lineItem);
      } else {
        // TODO: These codes are meant to be refactored in the future
        const lineHeightMatch =
          Math.abs(prevLineOfSameStyle.pos.baseLine - integratedLine.lineItem.pos.baseLine) -
            mainStyles.at(integratedLine.styleIndex).lineHeight <
          LINEHEIGHT_BIAS_FACT_THLD * mainStyles.at(integratedLine.styleIndex).textStyle.size;
        const lineStartMatch =
          Math.abs(prevLineOfSameStyle.pos.start - integratedLine.lineItem.pos.start) <
          LINESTART_BIAS_FACT_THLD * mainStyles.at(integratedLine.styleIndex).textStyle.size;
        const lineEndMatch =
          Math.abs(prevLineOfSameStyle.pos.end - integratedLine.lineItem.pos.end) <
          LINEEND_BIAS_FACT_THLD * mainStyles.at(integratedLine.styleIndex).textStyle.size;
        const positiveIndent =
          integratedLine.lineItem.pos.start - prevLineOfSameStyle.pos.start > 0;
        const longerLine = integratedLine.lineItem.pos.end - prevLineOfSameStyle.pos.end > 0;
        const currentLineItem = integratedLine.lineItem;
        typeof prevLineOfSameStyle.EOL === 'undefined' // Find a start line of a paragraph
          ? // Cannot handle paragraph without indent
            lineHeightMatch && !lineStartMatch && !positiveIndent
            ? lineEndMatch
              ? (prevLineOfSameStyle.EOL = false)
              : longerLine
              ? ((prevLineOfSameStyle.EOL = true), (currentLineItem.EOL = undefined))
              : ((prevLineOfSameStyle.EOL = false), (currentLineItem.EOL = true))
            : ((prevLineOfSameStyle.EOL = true), (currentLineItem.EOL = undefined))
          : lineHeightMatch
          ? lineStartMatch
            ? lineEndMatch
              ? null
              : longerLine
              ? (prevLineOfSameStyle.EOL = true)
              : (currentLineItem.EOL = true)
            : positiveIndent
            ? prevLineOfSameStyle.EOL === true
              ? (currentLineItem.EOL = undefined)
              : lineEndMatch // Probable faulty construct
              ? null
              : (currentLineItem.EOL = undefined)
            : prevLineOfSameStyle.EOL === true // Probable faulty construct
            ? (currentLineItem.EOL = undefined)
            : null
          : lineStartMatch && !lineEndMatch && longerLine && prevLineOfSameStyle.EOL === true
          ? null
          : ((prevLineOfSameStyle.EOL = true), (currentLineItem.EOL = undefined));

        // Save previous line
        integratedLine.styleIndex === 0 && mainStyles.length !== 0
          ? (mainLineItems[
              mainLineItems.findLastIndex((lineItem) => lineItem.text.trim().length !== 0)
            ] = prevLineOfSameStyle)
          : integratedLine.styleIndex === mainStyles.length
          ? null
          : (subLineItems[integratedLine.styleIndex - 1][
              subLineItems[integratedLine.styleIndex - 1].findLastIndex(
                (subLineItem) => subLineItem.text.trim().length !== 0,
              )
            ] = <SubLineItem>prevLineOfSameStyle);

        // Save current line
        integratedLine.styleIndex === 0 && mainStyles.length !== 0
          ? mainLineItems.push(currentLineItem)
          : integratedLine.styleIndex === mainStyles.length
          ? null
          : subLineItems[integratedLine.styleIndex - 1].push(<SubLineItem>currentLineItem);
      }

      return integratedLine;
    }, undefined);

    const groupedLines: GroupedLines = {
      main: mainLineItems,
      sub: subLineItems,
      trash: trashItems,
    };

    // Convert to json text
    const transformedJson = JSON.stringify(groupedLines);

    // Output json to files
    const outputFilePath = path.resolve(
      outputFolderPath,
      path.basename(jsonFilesFolderPath),
      path.basename(jsonFile),
    );
    fs.writeFileSync(outputFilePath, transformedJson, 'utf-8');
  });

  // Copy issues file
  fs.existsSync(path.resolve(jsonFilesFolderPath, 'issues.json5')) &&
    fs.writeFileSync(
      path.resolve(outputFolderPath, path.basename(jsonFilesFolderPath), 'issues.json5'),
      fs.readFileSync(path.resolve(jsonFilesFolderPath, 'issues.json5'), 'utf-8'),
    );
};

const createLineItem = (
  textContentLineItem: TextContentItem,
  baseLine: number,
  horizontal: boolean,
) => {
  // Alert issue
  const issues: string[] = [];
  // Empty chunk item
  textContentLineItem.str.match(/^\s+$/) !== null && issues.push('Empty Chunk Item?');
  // TODO: (Issue) Empty line not considered
  (!baseLine || baseLine === 0) && issues.push('Invalid Baseline');
  return <LineItem>{
    // TODO: Remove align spaces
    text: textContentLineItem.str,
    pos: horizontal
      ? {
          start: textContentLineItem.transform.at(4),
          end: textContentLineItem.transform.at(4) + textContentLineItem.width,
          baseLine: baseLine,
        }
      : {
          start: textContentLineItem.transform.at(5),
          // TODO: Check if the height value works properly with vertical direction
          end: textContentLineItem.transform.at(5) + textContentLineItem.height,
          baseLine: baseLine,
        },
    // TODO: Check if there's more info about the EOP
    EOL: false,
    issues: issues.length === 0 ? undefined : issues,
  };
};

const appendLineItem = (
  lineItem: LineItem,
  textContentLineItem: TextContentItem,
  horizontal: boolean,
) => {
  const prevLineEnd = lineItem.pos.end;

  lineItem.text += textContentLineItem.str;
  lineItem.pos.end = horizontal
    ? Math.max(textContentLineItem.transform.at(4) + textContentLineItem.width, lineItem.pos.end)
    : // TODO: Check if the height value works properly with vertical direction
      Math.max(textContentLineItem.transform.at(5) + textContentLineItem.height, lineItem.pos.end);

  // Check empty chunk item
  lineItem.issues?.find((issue) => issue === 'Empty Chunk Item?') &&
    (lineItem.issues =
      // Whether the empty item length greater than threshold
      Math.abs(
        (horizontal ? textContentLineItem.transform.at(4) : textContentLineItem.transform.at(5)) -
          prevLineEnd,
      ) >
      // TODO: Use style data of size
      EMPTY_ITEM_WIDTH_FACT_THLD * textContentLineItem.transform.at(0)
        ? // Confirm the issue
          lineItem.issues.map((issue) => issue.replaceAll('Empty Chunk Item?', 'Empty Chunk Item'))
        : // Remove the issue
          lineItem.issues.filter((issue) => issue !== 'Empty Chunk Item?'));

  // Invalid empty item
  (textContentLineItem.str.match(/^\s+$/) !== null &&
    (lineItem.issues ?? (lineItem.issues = ['Empty Chunk Item?']))?.find((issue) =>
      issue.includes('Empty Chunk Item'),
    )) ??
    lineItem.issues.push('Empty Chunk Item?');
  return lineItem;
};

const createSubLineItem = (
  textContentLineItem: TextContentItem,
  baseLine: number,
  horizontal: boolean,
  mainIndex: number,
) => {
  const lineItem = createLineItem(textContentLineItem, baseLine, horizontal);
  return <SubLineItem>{ mainPos: mainIndex, ...lineItem };
};

const appendSubLineItem = (
  subLineItem: SubLineItem,
  textContentLineItem: TextContentItem,
  horizontal: boolean,
) => {
  let { mainPos, ...lineItem } = subLineItem;
  lineItem = appendLineItem(lineItem, textContentLineItem, horizontal);
  return <SubLineItem>{ mainPos, ...lineItem };
};

const createTrashItem = (
  textContentLineItem: TextContentItem,
  mainIndex: number,
  inline: boolean,
) => {
  return <TrashItem>{
    mainPos: mainIndex,
    inline,
    text: textContentLineItem.str,
    textStyle: scanner.getItemTextStyle(textContentLineItem),
    pos:
      textContentLineItem.dir === 'ltr'
        ? {
            start: textContentLineItem.transform.at(4),
            end: textContentLineItem.transform.at(4) + textContentLineItem.width,
            baseLine: textContentLineItem.transform.at(5),
          }
        : {
            start: textContentLineItem.transform.at(5),
            // TODO: Check if the height value works properly with vertical direction
            end: textContentLineItem.transform.at(5) + textContentLineItem.height,
            baseLine: textContentLineItem.transform.at(4),
          },
    EOL: textContentLineItem.hasEOL,
  };
};
