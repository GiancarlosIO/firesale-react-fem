/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/label-has-associated-control */
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

import { remote } from 'electron';

import * as React from 'react';

import marked from 'marked';
import DOMPurify from 'dompurify';

import Dialog from '../../Components/Dialog';
import Alert from '../../Components/Alert';

import type { Utils } from '../../utils';
import { getDraggedFile, getDroppedFile, fileTypeIsSupported } from './utils';

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
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isUsingTmpFile, setIsUsingTmpFile] = React.useState(true);
  const [currentFileOpened, setCurretFileOpened] = React.useState<
    File | undefined
  >(undefined);
  const [rawHTML, setRawHTML] = React.useState('');
  const [htmlRendered, setHTMLRendered] = React.useState('');
  const [unsavedChanges, setUnsavedChanges] = React.useState(false);

  // dialogs states
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);

  /** We have 3 handlers that changes the rawHTML, thats why I preffer to use a single useEffect
   * Instead of calling setHTMLRendered in each of these handlers
   */
  React.useEffect(() => {
    if (rawHTML) {
      setHTMLRendered(markedAndPurify(rawHTML));
    } else {
      setHTMLRendered('');
    }
    textAreaRef.current?.focus();
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

  // React.useEffect(() => {
  //   document.addEventListener('dragstart', () => {});
  //   document.addEventListener('dragover', () => {});
  //   document.addEventListener('dragleave', () => {});
  //   document.addEventListener('drop', () => {});

  //   textAreaRef.current?.addEventListener('dragover', (event) => {
  //     const file = getDraggedFile(event);

  //     if (fileTypeIsSupported(file)) {
  //     }
  //   });
  // }, []);

  const temporalFileHasChanges = isUsingTmpFile && rawHTML.length > 0;

  const resetToInitialState = () => {
    setCurretFileOpened(undefined);
    setUnsavedChanges(false);
    setRawHTML('');
    setIsUsingTmpFile(true);
  };

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

  const saveContent = async () => {
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

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const onClickNewFile = () => {
    if (unsavedChanges || temporalFileHasChanges) {
      setDialogOpen(true);
    } else {
      resetToInitialState();
      handleCloseDialog();
    }
  };

  const handleAgree = () => {
    saveContent();
    handleCloseDialog();
    resetToInitialState();
  };

  const handleDisagree = () => {
    handleCloseDialog();
    resetToInitialState();
  };

  const onClickSaveHTML = async () => {
    const newFile = await utils.openSaveDialog([
      {
        name: 'HTML Files',
        extensions: ['html'],
      },
    ]);

    if (!newFile.canceled && newFile.filePath) {
      await writeFile(newFile.filePath, htmlRendered, { encoding: 'utf-8' });
      setAlertOpen(true);
    }
  };

  return (
    <div>
      <section className="controls">
        <button type="button" id="new-file" onClick={onClickNewFile}>
          New File
        </button>
        <button type="button" id="open-file" onClick={onClickOpenFile}>
          Open File
        </button>
        <button
          type="button"
          id="save-markdown"
          disabled={!(unsavedChanges || temporalFileHasChanges)}
          onClick={saveContent}
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
        <button
          type="button"
          id="save-html"
          disabled={!htmlRendered}
          onClick={onClickSaveHTML}
        >
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
          ref={textAreaRef}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <div
          className="rendered-html"
          id="html"
          dangerouslySetInnerHTML={{
            __html: htmlRendered,
          }}
        />
      </section>
      <Dialog
        title="Do you want to save the changes you made to the current file?"
        textContent="Your changes will be lost if you don't save them"
        open={dialogOpen}
        handleClose={handleCloseDialog}
        agreeTextButton="Save"
        disagreeTextButton="Don't save"
        handleAgree={handleAgree}
        handleDisagree={handleDisagree}
      />
      <Alert
        open={alertOpen}
        handleClose={() => setAlertOpen(false)}
        type="success"
        message="¡Successfully saved!"
      />
    </div>
  );
};

export default Editor;
