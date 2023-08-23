type Counter<T> = { value: T; count: number }[];

interface TextStyle {
  size: number;
  dir: TextDirection;
  font: string;
}

interface MainStyle {
  textStyle: TextStyle;
  lineHeight: number;
}

interface TextStat {
  textHeight: number;
  lineHeight: number;
  indent: number;
}

type TextStats = TextStat[];

interface TextContent {
  items: TextContentItem[];
  styles: { [fontName: string]: TextContentStyle };
}

interface TextContentItem {
  str: string;
  dir: TextDirection;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
}

interface TextContentStyle {
  fontFamily: string;
  ascent: number;
  descent: number;
  vertical: boolean;
}

type TextDirection = 'ltr' | 'ttb';

// TODO: Vertical alignment type check
type VerticalTextDirection = 'ttb';

interface LineItem {
  text: string;
  pos: ItemPosition;
  EOL: boolean;
}

interface SubLineItem extends LineItem {
  mainPos: number;
}

interface TrashItem extends SubLineItem {
  inline: boolean;
  textStyle: TextStyle;
}

interface ItemPosition {
  start: number;
  end: number;
  baseLine: number;
}

interface IntegratedLineItem {
  lineItem: LineItem | SubLineItem;
  trashItems: TrashItem[];
}

interface IntegratedLine extends IntegratedLineItem {
  styleIndex: number;
}

interface GroupedLines {
  main: LineItem[];
  sub: SubLineItem[][];
  trash: TrashItem[];
}
