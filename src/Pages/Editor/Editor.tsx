/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/label-has-associated-control */
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

import * as React from 'react';
import marked from 'marked';
import DOMPurify from 'dompurify';
import { remote } from 'electron';

import type { Utils } from '../../utils';

const writeFile = promisify(fs.writeFile);
const utils: Utils = remote.require('./utils.ts').default;
const currentWindow = remote.getCurrentWindow();

type File = {
  content: string;
  filename: string;
  filePath: string;
  // temporal tells if the current file is not a "real" file. Therefore, the user is just writting in the default textarea
  temporal?: boolean;
};

const markedAndPurify = (markdown: string): string => {
  const html = marked(markdown);
  const sanitizeHTML = DOMPurify.sanitize(html);
  return sanitizeHTML;
};

const Editor = () => {
  const [isUsingTmpFile, setIsUsingTmpFile] = React.useState(true);
  const [currentFileOpened, setCurretFileOpened] = React.useState<
    File | undefined
  >(undefined);
  const [rawHTML, setRawHTML] = React.useState('');
  const [htmlRendered, setHTMLRendered] = React.useState('');
  const [unsavedChanges, setUnsavedChanges] = React.useState(false);

  /** We have 3 handlers that changes the rawHTML, thats why I preffer to use a single useEffect
   * Instead of calling setHTMLRendered in each of these handlers
   */
  React.useEffect(() => {
    if (rawHTML) {
      setHTMLRendered(markedAndPurify(rawHTML));
    }
  }, [rawHTML]);

  /**
   * This useEffect compares the original text from the file and the current editor.
   * If those are differente then we add the "(unsaved)" in the current window title
   */
  React.useEffect(() => {
    let title = '';

    if (currentFileOpened) {
      title = `${currentFileOpened.filename} - Firesale`;

      if (currentFileOpened.content !== rawHTML) {
        setUnsavedChanges(true);
        title = `${title} (unsaved)`;
      } else {
        setUnsavedChanges(false);
        // title = `${currentFileOpened.filename} - Firesale`;
      }

      currentWindow.setRepresentedFilename(currentFileOpened.filePath);
    }

    currentWindow.setTitle(title);
  }, [currentFileOpened, rawHTML, unsavedChanges]);

  React.useEffect(() => {
    if (currentFileOpened) {
      currentWindow.setDocumentEdited(unsavedChanges);
    }
  }, [unsavedChanges, currentFileOpened]);

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const {
      target: { value },
    } = event;
    setRawHTML(value);
  };

  const onClickOpenFile = async () => {
    const result = await utils.getFileFromUser();

    if (result) {
      const { content, filePath } = result;
      const filename = path.basename(filePath);
      setCurretFileOpened({
        content,
        filename,
        filePath,
      });
      setRawHTML(content);
      setIsUsingTmpFile(false);
    }
  };

  const onClickRevert = () => {
    if (currentFileOpened) {
      setRawHTML(currentFileOpened.content);
    }
  };

  const onClickSave = async () => {
    if (currentFileOpened) {
      // 1. save the new content file to the original file
      await writeFile(currentFileOpened?.filePath, rawHTML);

      // 2. update the currentFileOpened state
      setCurretFileOpened({
        ...currentFileOpened,
        content: rawHTML,
      });
    } else {
      // 3. if there is not file opened, just tell the user where he wants to save the file
      const newFile = await utils.openSaveDialog();
      if (!newFile.canceled && newFile.filePath) {
        await writeFile(newFile.filePath, rawHTML);
        setCurretFileOpened({
          content: rawHTML,
          filePath: newFile.filePath,
          filename: path.basename(newFile.filePath),
        });
        setIsUsingTmpFile(false);
      }
    }
  };

  return (
    <div>
      <section className="controls">
        <button type="button" id="new-file">
          New File
        </button>
        <button type="button" id="open-file" onClick={onClickOpenFile}>
          Open File
        </button>
        <button
          type="button"
          id="save-markdown"
          disabled={!(unsavedChanges || (isUsingTmpFile && rawHTML.length > 0))}
          onClick={onClickSave}
        >
          Save File
        </button>
        <button
          type="button"
          id="revert"
          disabled={!unsavedChanges}
          onClick={onClickRevert}
        >
          Revert
        </button>
        <button type="button" id="save-html">
          Save HTML
        </button>
        <button type="button" id="show-file" disabled>
          Show File
        </button>
        <button type="button" id="open-in-default" disabled>
          Open in Default Application
        </button>
      </section>

      <section className="content">
        <label htmlFor="markdown" hidden>
          Markdown Content
        </label>
        <textarea
          className="raw-markdown"
          id="markdown"
          value={rawHTML}
          onChange={onChange}
        />
        <div
          className="rendered-html"
          id="html"
          dangerouslySetInnerHTML={{
            __html: htmlRendered,
          }}
        />
      </section>
    </div>
  );
};

export default Editor;
