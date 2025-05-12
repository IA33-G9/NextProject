import { ScreenSize } from '@/generated/prisma/client';
import { Cinema } from '@/type/cinema/cinema';

// Screen型を修正
export type Screen = {
  id: string;
  number: string;
  size: ScreenSize;
  rows: number;
  columns: number;
  capacity: number;
  cinema: Cinema;
};
