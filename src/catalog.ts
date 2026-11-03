import type { FurnitureKind } from './types';

export const CATALOG: Record<
  FurnitureKind,
  { label: string; w: number; d: number; h: number; color: string }
> = {
  sofa: { label: 'Sofa', w: 200, d: 90, h: 85, color: '#8d99ae' },
  bed: { label: 'Bed', w: 160, d: 200, h: 50, color: '#a8c3b0' },
  table: { label: 'Table', w: 140, d: 80, h: 75, color: '#c9a27e' },
  chair: { label: 'Chair', w: 45, d: 45, h: 90, color: '#b08968' },
  desk: { label: 'Desk', w: 120, d: 60, h: 75, color: '#bfa48a' },
  wardrobe: { label: 'Wardrobe', w: 120, d: 55, h: 200, color: '#9c8b7a' },
  plant: { label: 'Plant', w: 40, d: 40, h: 110, color: '#6a994e' },
  rug: { label: 'Rug', w: 200, d: 140, h: 2, color: '#e5b8a5' },
};

export const KINDS = Object.keys(CATALOG) as FurnitureKind[];
export const WALL_HEIGHT = 250;
