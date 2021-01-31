import * as React from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import type { DialogProps } from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const CustomDialog: React.FC<
  DialogProps & {
    handleClose: () => void;
    title: string;
    textContent: string;
    handleAgree: () => void;
    handleDisagree: () => void;
    disagreeTextButton: string;
    agreeTextButton: string;
  }
> = ({
  open,
  handleClose,
  title,
  textContent,
  handleAgree,
  handleDisagree,
  disagreeTextButton,
  agreeTextButton,
}) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {textContent}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAgree} color="primary" autoFocus>
          {agreeTextButton}
        </Button>
        <Button onClick={handleDisagree} color="primary">
          {disagreeTextButton}
        </Button>
        <Button onClick={handleClose} color="primary" autoFocus>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;
