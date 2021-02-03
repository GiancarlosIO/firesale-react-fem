/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/label-has-associated-control */
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

import { remote, shell } from 'electron';

import * as React from 'react';

import marked from 'marked';
import DOMPurify from 'dompurify';

import MuiAlert from '@material-ui/lab/Alert';

import Dialog from '../../Components/Dialog';
import Alert from '../../Components/Alert';
import type { Color } from '../../Components/Alert';

import type { Utils } from '../../utils';
import { getDraggedFile, getDroppedFile, fileTypeIsSupported } from './utils';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const utils: Utils = remote.require('./utils.ts').default;
const currentWindow = remote.getCurrentWindow();

type File = {
  content: string;
  filename: string;
  filePath: string;
  // temporal tells if the current file is not a "real" file. Therefore, the user is just writting in the default textarea
  temporal?: boolean;
};

type FileDragEvent = {
  lastModified: number;
  lastModifiedDate: Date;
  name: string;
  path: string;
  size: number;
  type: string;
  webkitRelativePath: '';
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
  const [alertStatus, setAlertStatus] = React.useState<{
    open: boolean;
    message: string;
    type: Color;
  }>({
    open: false,
    message: '',
    type: 'success',
  });

  const [dragStatus, setDragStatus] = React.useState<{
    dragClassName: 'drag-over' | 'drag-error' | '';
  }>({
    dragClassName: '',
  });

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

  React.useEffect(() => {
    const textAreaNode = textAreaRef.current;
    document.addEventListener('dragstart', () => {});
    document.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    document.addEventListener('dragleave', () => {});
    document.addEventListener('drop', () => {});

    const textAreaDragOver = (event) => {
      event.preventDefault();
      event.stopPropagation();

      // const file = getDroppedFile(event);
      // console.log({
      //   file,
      //   files: event.dataTransfer.files,
      //   items: event.dataTransfer.items,
      // });
      // setDragStatus({
      //   dragClassName: fileTypeIsSupported(file) ? 'drag-over' : 'drag-error',
      // });
    };

    const drop = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const file: FileDragEvent = getDroppedFile(event);

      console.log({
        file,
      });

      const isSupported = fileTypeIsSupported(file);
      if (isSupported) {
        const content = await readFile(file.path, { encoding: 'utf-8' });

        setRawHTML(content);
        setCurretFileOpened({
          // I don't know why but the content of a opened file always has a breakline at the end
          // remove the breakLine from the end
          content,
          filename: file.name,
          filePath: file.path,
          temporal: false,
        });
        setIsUsingTmpFile(false);
      } else {
        setAlertStatus({
          open: true,
          type: 'error',
          message: `The ${file.type} is not supported :(`,
        });
      }
    };

    textAreaNode?.addEventListener('dragover', textAreaDragOver);
    textAreaNode?.addEventListener('drop', drop);
    return () => {
      console.log('Unmouting editor');

      // todo remove the others drag-drop event listeners
      textAreaNode?.removeEventListener('dragover', textAreaDragOver);
      textAreaNode?.removeEventListener('drop', drop);
    };
  }, []);

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
      setAlertStatus((prev) => ({
        type: 'success',
        open: true,
        message: '¡Successfully saved!',
      }));
    }
  };

  const showFileClick = () => {
    if (!currentFileOpened?.filePath) {
      setAlertStatus({
        message: 'There is not file to open',
        open: true,
        type: 'error',
      });
      return;
    }
    shell.showItemInFolder(currentFileOpened.filePath);
  };

  const openInDefaultClick = () => {
    if (!currentFileOpened?.filePath) {
      setAlertStatus({
        message: 'There is not file to open',
        open: true,
        type: 'error',
      });
      return;
    }
    shell.openPath(currentFileOpened.filePath);
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
        <button
          type="button"
          id="show-file"
          onClick={showFileClick}
          disabled={!(currentFileOpened && currentFileOpened.filePath)}
        >
          Show File
        </button>
        <button
          type="button"
          id="open-in-default"
          onClick={openInDefaultClick}
          disabled={!(currentFileOpened && currentFileOpened.filePath)}
        >
          Open in Default Application
        </button>
      </section>

      <section className="content">
        {/* <label htmlFor="markdown" hidden>
          Markdown Content
        </label> */}
        <textarea
          className={`raw-markdown ${dragStatus.dragClassName}`}
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
        open={alertStatus.open}
        handleClose={() =>
          setAlertStatus({
            open: false,
            message: '',
            type: 'error',
          })
        }
        type={alertStatus.type}
        message={alertStatus.message}
      />
    </div>
  );
};

export default Editor;
