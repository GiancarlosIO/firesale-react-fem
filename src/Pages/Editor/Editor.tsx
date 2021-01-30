/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/label-has-associated-control */
import * as React from 'react';
import marked from 'marked';
import DOMPurify from 'dompurify';

const Editor = (props) => {
  const [rawHTML, setRawHTML] = React.useState('');
  const [htmlRendered, setHTMLRendered] = React.useState('');

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const {
      target: { value },
    } = event;
    setRawHTML(value);
    const html = marked(value);
    const sanitizeHTML = DOMPurify.sanitize(html);
    setHTMLRendered(sanitizeHTML);
  };

  return (
    <div>
      <section className="controls">
        <button type="button" id="new-file">
          New File
        </button>
        <button type="button" id="open-file">
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
