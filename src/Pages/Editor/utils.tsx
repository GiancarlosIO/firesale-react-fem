export const getDraggedFile = (event) => event.dataTransfer.items[0];
export const getDroppedFile = (event) => event.dataTransfer.files[0];
export const fileTypeIsSupported = (file) => {
  if (!file.type) {
    return file.name.includes('.md') || file.name.includes('.markdown');
  }
  return ['text/plain', 'text/markdown', 'text/md'].includes(file.type);
};
