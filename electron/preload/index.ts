import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:open'),
  printTicket: (data: any) => ipcRenderer.invoke('print:ticket', data),
})
