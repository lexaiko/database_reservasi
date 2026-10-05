export type UserRole = 'superadmin' | 'admin' | 'intern';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  isPic?: boolean; // True jika admin adalah PIC tunggal (default true), false jika admin non-PIC
  assignedPic?: string; // PIC yang dipegang (admin PIC) atau yang didampingi (intern)
  allowedPics?: string[]; // Daftar sekat data PIC yang boleh diakses jika admin non-PIC
  accountPassword?: string; // Menyimpan kredensial sinkronisasi password akun
  passwordUpdatedAt?: string;
  createdAt?: string | Date;
}

