/* eslint-disable import/prefer-default-export */
import fs from 'fs';
import { promisify } from 'util';

import { dialog } from 'electron';

const readFile = promisify(fs.readFile);

const openFile = async (filepath: string) => {
  const content = await readFile(filepath, { encoding: 'utf-8' });
  return content;
};

const getFileFromUser = async () => {
  const files = await dialog.showOpenDialog({
    properties: ['openFile'],
    buttonLabel: 'Open!!!',
    title: 'Open Fire Sale Document',
    filters: [
      {
        name: 'Markdown files',
        extensions: ['md', 'mdown', 'markdown', 'marcdown'],
      },
      {
        name: 'Text files',
        extensions: ['txt', 'text'],
      },
    ],
  });
  if (!files.canceled) {
    const mdFilePath = files.filePaths[0];
    const content = await openFile(mdFilePath);
    return { content, pathfile: mdFilePath };
  }
  return undefined;
};

const utils = {
  getFileFromUser,
  openFile,
};

export type Utils = typeof utils;

export default utils;
