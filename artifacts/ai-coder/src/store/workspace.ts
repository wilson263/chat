import { create } from 'zustand';
import { ProjectFile } from '@workspace/api-client-react';

interface WorkspaceState {
  activeProjectId: number | null;
  activeFileId: number | null;
  openFiles: ProjectFile[];
  githubToken: string | null;
  setActiveProject: (id: number | null) => void;
  setActiveFile: (id: number | null) => void;
  openFile: (file: ProjectFile) => void;
  closeFile: (id: number) => void;
  updateFileContent: (id: number, content: string) => void;
  setGithubToken: (token: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeProjectId: null,
  activeFileId: null,
  openFiles: [],
  githubToken: localStorage.getItem('github_token'),

  setActiveProject: (id) => set({ activeProjectId: id, openFiles: [], activeFileId: null }),
  
  setActiveFile: (id) => set({ activeFileId: id }),
  
  openFile: (file) => set((state) => {
    const exists = state.openFiles.find(f => f.id === file.id);
    if (!exists) {
      return { 
        openFiles: [...state.openFiles, file],
        activeFileId: file.id
      };
    }
    return { activeFileId: file.id };
  }),

  closeFile: (id) => set((state) => {
    const newFiles = state.openFiles.filter(f => f.id !== id);
    let newActiveId = state.activeFileId;
    if (state.activeFileId === id) {
      newActiveId = newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null;
    }
    return { openFiles: newFiles, activeFileId: newActiveId };
  }),

  updateFileContent: (id, content) => set((state) => ({
    openFiles: state.openFiles.map(f => f.id === id ? { ...f, content } : f)
  })),

  setGithubToken: (token) => {
    if (token) {
      localStorage.setItem('github_token', token);
    } else {
      localStorage.removeItem('github_token');
    }
    set({ githubToken: token });
  }
}));
