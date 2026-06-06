declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string | null>
      printTicket: (data: any) => Promise<{ success: boolean; message: string }>
    }
  }
}

export {}
