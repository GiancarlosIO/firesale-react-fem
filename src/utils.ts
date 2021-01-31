/* eslint-disable import/prefer-default-export */
import fs from 'fs';
import { promisify } from 'util';

import { dialog, app, FileFilter, remote } from 'electron';

const readFile = promisify(fs.readFile);

const currentWindow = remote.getCurrentWindow();

const openFile = async (filepath: string) => {
  const content = await readFile(filepath, { encoding: 'utf-8' });
  return content;
};

const filters = [
  {
    name: 'Markdown files',
    extensions: ['md', 'mdown', 'markdown', 'marcdown'],
  },
  {
    name: 'Text files',
    extensions: ['txt', 'text'],
  },
];

const getFileFromUser = async () => {
  const files = await dialog.showOpenDialog(currentWindow, {
    properties: ['openFile'],
    buttonLabel: 'Open!!!',
    title: 'Open Fire Sale Document',
    filters,
  });
  if (!files.canceled) {
    const mdFilePath = files.filePaths[0];
    const content = await openFile(mdFilePath);
    return { content, filePath: mdFilePath };
  }
  return undefined;
};

const openSaveDialog = async (_filters?: FileFilter[]) => {
  const file = await dialog.showSaveDialog(currentWindow, {
    title: 'Save Markdown',
    defaultPath: app.getPath('desktop'),
    filters: _filters || [filters[0]],
  });

  return file;
};

const utils = {
  getFileFromUser,
  openFile,
  openSaveDialog,
};

export type Utils = typeof utils;

export default utils;
