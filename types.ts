
export enum OrderStatus {
  PENDING = 'PENDING',
  PICKING = 'PICKING',
  COMPLETED = 'COMPLETED'
}

export interface PickingItem {
  id: string;
  line: string;
  location: string;
  article: string;
  quantity: number;
  unit: string;
  serials: string[];
  scannedCount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  palletNumber: string;
  status: OrderStatus;
  createdAt: string;
  items: PickingItem[];
  imageUrl?: string;
}

export type ViewType = 'ADMIN' | 'OPERATOR';
