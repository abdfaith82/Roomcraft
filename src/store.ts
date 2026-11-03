import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { FurnitureKind, Project, Pt, StylePick } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

type State = {
  projects: Project[];
  createProject: (name?: string) => string;
  deleteProject: (id: string) => void;
  addWall: (id: string, a: Pt, b: Pt) => void;
  undoWall: (id: string) => void;
  addItem: (id: string, kind: FurnitureKind, at: Pt) => string;
  moveItem: (id: string, itemId: string, at: Pt) => void;
  rotateItem: (id: string, itemId: string, by: number) => void;
  removeItem: (id: string, itemId: string) => void;
  setStyle: (id: string, style: StylePick | undefined) => void;
};

export const useProjects = create<State>()(
  persist(
    (set) => {
      const patch = (id: string, fn: (p: Project) => Project) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? fn(p) : p)) }));

      return {
        projects: [],
        createProject: (name) => {
          const id = uid();
          set((s) => ({
            projects: [
              {
                id,
                name: name ?? `Room ${s.projects.length + 1}`,
                createdAt: Date.now(),
                walls: [],
                items: [],
              },
              ...s.projects,
            ],
          }));
          return id;
        },
        deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
        addWall: (id, a, b) =>
          patch(id, (p) => ({ ...p, walls: [...p.walls, { id: uid(), a, b }] })),
        undoWall: (id) => patch(id, (p) => ({ ...p, walls: p.walls.slice(0, -1) })),
        addItem: (id, kind, at) => {
          const itemId = uid();
          patch(id, (p) => ({
            ...p,
            items: [...p.items, { id: itemId, kind, x: at.x, y: at.y, rot: 0 }],
          }));
          return itemId;
        },
        moveItem: (id, itemId, at) =>
          patch(id, (p) => ({
            ...p,
            items: p.items.map((i) => (i.id === itemId ? { ...i, x: at.x, y: at.y } : i)),
          })),
        rotateItem: (id, itemId, by) =>
          patch(id, (p) => ({
            ...p,
            items: p.items.map((i) =>
              i.id === itemId ? { ...i, rot: (i.rot + by + 360) % 360 } : i,
            ),
          })),
        removeItem: (id, itemId) =>
          patch(id, (p) => ({ ...p, items: p.items.filter((i) => i.id !== itemId) })),
        setStyle: (id, style) => patch(id, (p) => ({ ...p, style })),
      };
    },
    {
      name: 'roomcraft-projects',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
