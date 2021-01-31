export const getDraggedFile = (event) => event.dataTransfer.items[0];
export const getDroppedFile = (event) => event.dataTransfer.files[0];
export const fileTypeIsSupported = (file) => {
  return ['text/plain', 'text/markdown'].includes(file.type);
};
