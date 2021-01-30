/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/label-has-associated-control */
import path from 'path';

import * as React from 'react';
import marked from 'marked';
import DOMPurify from 'dompurify';
import { remote } from 'electron';

import type { Utils } from '../../utils';

const utils: Utils = remote.require('./utils.ts').default;
const currentWindow = remote.getCurrentWindow();

const markedAndPurify = (markdown: string): string => {
  const html = marked(markdown);
  const sanitizeHTML = DOMPurify.sanitize(html);
  return sanitizeHTML;
};

const Editor = () => {
  const [rawHTML, setRawHTML] = React.useState('');
  const [htmlRendered, setHTMLRendered] = React.useState('');

  React.useEffect(() => {
    if (rawHTML) {
      setHTMLRendered(markedAndPurify(rawHTML));
    }
  }, [rawHTML]);

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const {
      target: { value },
    } = event;
    setRawHTML(value);
  };

  const onClickOpenFile = async () => {
    const result = await utils.getFileFromUser();

    if (result) {
      const { content, pathfile } = result;
      setRawHTML(content);
      const relativePathfile = path.basename(pathfile);
      currentWindow.setTitle(`${relativePathfile} - Firesale`);
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
        <button type="button" id="save-markdown" disabled>
          Save File
        </button>
        <button type="button" id="revert" disabled>
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
