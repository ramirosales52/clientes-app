declare global {
  interface Window {
    electron: {
      sendMsg: (msg: string) => Promise<string>
      onReplyMsg: (cb: (msg: string) => any) => void
      onTurnosActualizados: (cb: () => void) => () => void
    }
  }
}

export { }
