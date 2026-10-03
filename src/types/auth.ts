export type UserRole = 'superadmin' | 'admin' | 'intern';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  assignedPic?: string; // PIC yang dipegang (admin) atau yang didampingi (intern)
  createdAt?: string | Date;
}

