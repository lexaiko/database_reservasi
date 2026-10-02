export type StatusTrip =
  | 'On Schedule (Not Ready)'
  | 'On Schedule (Ready)'
  | 'On Going'
  | 'Finish (Un Review)'
  | 'Finish (On Review)'
  | 'Finish (Review)'
  | 'Cancel'
  | string;

export type StatusPayment = 'DP 1' | 'DP 2' | 'DP 3' | 'Lunas' | 'Cancel' | string;

export interface Reservasi {
  rowNumber: number;
  kode: string;               // Col A (1)
  namaTamu: string;           // Col B (2)
  whatsapp: string;           // Col C (3)
  instagram: string;          // Col D (4)
  tiktok: string;             // Col E (5)
  startTrip: string;          // Col F (6)
  finishTrip: string;         // Col G (7)
  pax: number;                // Col H (8)
  trip: string | number;      // Col I (9)
  paket: string;              // Col J (10)
  day1: string;               // Col K (11)
  day2: string;               // Col L (12)
  day3: string;               // Col M (13)
  day4: string;               // Col N (14)
  mepo: string;               // Col O (15)
  hotel: string;              // Col P (16)
  crew: string;               // Col Q (17)
  catatan: string;            // Col R (18)
  picAgen: string;            // Col S (19)
  sumberLeads: string;        // Col T (20)
  statusTrip: StatusTrip;     // Col U (21)
  linkReview: string;         // Col V (22)
  linkFoto: string;           // Col W (23)
  nilaiOrder: number;         // Col X (24)
  dp: number;                 // Col Y (25)
  tglDp: string;              // Col Z (26)
  sisaPelunasan: number;      // Col AA (27)
  tglPelunasan: string;       // Col AB (28)
  statusPayment: StatusPayment; // Col AC (29)
  notesPayment: string;       // Col AD (30)
  hpp: number;                // Col AE (31)
  profit: number;             // Col AF (32)
  margin: number;             // Col AG (33)
  
  // Computed / helpers
  computedStatusTrip?: StatusTrip;
  needsHppUpdate?: boolean;   // if payment > nilai order or flag triggered
}

export interface ReservasiInput {
  kode: string;
  namaTamu: string;
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  startTrip: string;
  finishTrip: string;
  pax: number;
  trip?: string | number;
  paket: string;
  day1?: string;
  day2?: string;
  day3?: string;
  day4?: string;
  mepo?: string;
  hotel?: string;
  crew?: string;
  catatan?: string;
  picAgen: string;
  sumberLeads: string;
  nilaiOrder: number;
  dp: number;
  tglDp: string;
  linkReview?: string;
  linkFoto?: string;
  statusPayment?: StatusPayment;
  statusTrip?: StatusTrip;
}

export interface HppItem {
  id?: string;
  timestamp?: string;
  kode: string;
  nama: string;
  kategori: string;
  vendor: string;
  nominal: number;
  catatan?: string;
  tanggalTrip?: string;
}

export interface MasterKategoriHpp {
  [kategori: string]: string[];
}

export interface DashboardKpi {
  totalPenjualan: number;      // Jumlah transaksi trip finish diakui
  totalPax: number;
  totalRevenue: number;        // Nilai Order diakui (finish trip)
  totalHpp: number;
  grossProfit: number;
  grossMargin: number;         // dalam %
  totalBelumLunas: number;     // Piutang
  countBelumLunas: number;
}

export interface SalesFilterOptions {
  month?: string;              // 1-12 or 'all'
  year?: string;               // 2026 or 'all'
  pic?: string;
  statusPayment?: string;
  statusTrip?: string;
  paket?: string;
  search?: string;
}
