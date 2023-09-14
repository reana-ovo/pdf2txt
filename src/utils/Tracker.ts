import fs from 'fs';
import path from 'path';

export const alertIssue = (
  docFilesFolder: string,
  name: string,
  page?: number,
  mainIndex?: number,
  columnIndex?: number,
) => {
  // Read the existing issues
  const issues: Issue[] = fs.existsSync(path.resolve(docFilesFolder, 'issues.json5'))
    ? JSON.parse(fs.readFileSync(path.resolve(docFilesFolder, 'issues.json5'), 'utf-8'))
    : [];

  // Create issue object
  const issue: Issue = {
    name,
    page: page ?? undefined,
    mainPos: mainIndex ?? undefined,
    columnIndex: columnIndex ?? undefined,
  };

  // Append the issue object
  issues.push(issue);

  // Write the issues back to the files
  fs.writeFileSync(path.resolve(docFilesFolder, 'issues.json5'), JSON.stringify(issues));
};