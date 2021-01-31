import * as React from 'react';

import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

export type Color = 'success' | 'info' | 'warning' | 'error';

const InnerAlert: React.FC<{
  handleClose: () => void;
  severity: Color;
  children: string;
}> = ({ handleClose, severity, children }) => {
  return (
    <MuiAlert
      elevation={6}
      variant="filled"
      onClose={handleClose}
      severity={severity}
    >
      {children}
    </MuiAlert>
  );
};

type AlertProps = {
  type: 'success';
  open: boolean;
  handleClose: () => void;
  message: string;
};

const Alert: React.FC<AlertProps> = ({ type, open, handleClose, message }) => {
  if (type === 'success') {
    return (
      <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
        <InnerAlert handleClose={handleClose} severity="success">
          {message}
        </InnerAlert>
      </Snackbar>
    );
  }
  return null;
};

export default Alert;
