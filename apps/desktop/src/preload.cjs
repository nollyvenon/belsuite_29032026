/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, shell } = require('electron');

contextBridge.exposeInMainWorld('belsuiteDesktop', {
  openExternal: (url) => shell.openExternal(url),
  preferredModule: 'video',
});