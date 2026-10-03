import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '@/types/auth';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database Firestore belum terinisialisasi.' },
        { status: 500 }
      );
    }

    const snap = await getDocs(collection(db, 'users'));
    const users: UserProfile[] = [];

    snap.forEach((d) => {
      const data = d.data();
      users.push({
        uid: d.id,
        email: data.email || '',
        name: data.name || '',
        role: (data.role === 'superadmin' ? 'superadmin' : data.role === 'intern' ? 'intern' : 'admin') as UserRole,
        status: data.status === 'inactive' ? 'inactive' : 'active',
        assignedPic: data.assignedPic || '',
        createdAt: data.createdAt,
      });
    });

    return NextResponse.json({
      ok: true,
      users,
    });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal mengambil data user' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, name, role, status, assignedPic } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { ok: false, error: 'Alamat email tidak valid.' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Nama pengguna wajib diisi.' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database Firestore belum terinisialisasi.' },
        { status: 500 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    // Gunakan UID yang diberikan, atau fallback ke email sebagai document ID
    const targetDocId = (uid && typeof uid === 'string' && uid.trim().length > 0)
      ? uid.trim()
      : cleanEmail;

    const validatedRole: UserRole =
      role === 'superadmin' ? 'superadmin' : role === 'intern' ? 'intern' : 'admin';

    const payload: Omit<UserProfile, 'uid'> = {
      email: cleanEmail,
      name: name.trim(),
      role: validatedRole,
      status: (status === 'inactive' ? 'inactive' : 'active'),
      assignedPic: (typeof assignedPic === 'string' ? assignedPic.trim() : ''),
      createdAt: body.createdAt || new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', targetDocId), payload, { merge: true });

    return NextResponse.json({
      ok: true,
      message: 'Data pengguna berhasil disimpan.',
      user: {
        uid: targetDocId,
        ...payload,
      },
    });
  } catch (err: any) {
    console.error('Error saving admin user:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal menyimpan data user' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { ok: false, error: 'UID user wajib disertakan.' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database Firestore belum terinisialisasi.' },
        { status: 500 }
      );
    }

    await deleteDoc(doc(db, 'users', uid));

    return NextResponse.json({
      ok: true,
      message: 'Pengguna berhasil dihapus dari whitelist.',
    });
  } catch (err: any) {
    console.error('Error deleting admin user:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal menghapus user' },
      { status: 500 }
    );
  }
}
