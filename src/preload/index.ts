import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'electron',
  {
    sendMsg: (msg: string): Promise<string> => ipcRenderer.invoke('msg', msg),
    onReplyMsg: (cb: (msg: string) => any) => ipcRenderer.on('reply-msg', (_e, msg: string) => {
      cb(msg)
    }),
    onTurnosActualizados: (cb: () => void) => {
      const handler = () => cb();
      ipcRenderer.on('turnos:actualizados', handler);
      return () => ipcRenderer.removeListener('turnos:actualizados', handler);
    },
  },
)
