/** All plan coordinates and sizes are in centimetres. */
export type Pt = { x: number; y: number };

export type Wall = { id: string; a: Pt; b: Pt };

export type FurnitureKind =
  | 'sofa'
  | 'bed'
  | 'table'
  | 'chair'
  | 'desk'
  | 'wardrobe'
  | 'plant'
  | 'rug';

export type Item = {
  id: string;
  kind: FurnitureKind;
  x: number;
  y: number;
  /** Rotation in degrees. */
  rot: number;
};

export type StylePick = {
  name: string;
  /** [wall, floor, accent, dark] as hex colours. */
  palette: [string, string, string, string];
  notes: string[];
};

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  walls: Wall[];
  items: Item[];
  style?: StylePick;
};

export type Tool = 'wall' | 'move' | 'place';
