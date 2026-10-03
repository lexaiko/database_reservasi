'use client';

import React, { useState, useEffect } from 'react';
import { Reservasi, HppItem, MasterKategoriHpp, StatusPayment } from '@/lib/types';
import { formatRupiah, formatRibuan, parseCurrency, computeMargin } from '@/lib/formatters';
import { X, Plus, Trash2, CheckCircle, AlertCircle, DollarSign, Lock } from 'lucide-react';

interface ModalHppManagerProps {
  reservasi: Reservasi | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  isIntern?: boolean;
}

interface TempHppItem {
  id: string;
  kategori: string;
  vendor: string;
  nominalStr: string;
  catatan: string;
  isCustomVendor?: boolean;
}

export default function ModalHppManager({
  reservasi,
  isOpen,
  onClose,
  onSuccess,
  isIntern = false,
}: ModalHppManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [items, setItems] = useState<TempHppItem[]>([]);
  const [statusBayar, setStatusBayar] = useState<StatusPayment>('DP 1');
  const [masterKategori, setMasterKategori] = useState<MasterKategoriHpp>({
    Tiket: ['Ijen', 'Baluran', 'Djawatan', 'Mustika', 'Pulau Merah'],
    'Sewa Jeep': ['Hendrik', 'Sandi', 'Dio'],
    Penginapan: ['Illira', 'Ketapang Indah', 'Santika', 'Solong'],
    Kapal: ['Sandi', 'Bangsring'],
    'Fee Crew': ['Bagas', 'Kikik', 'Bobi', 'Dio'],
    'Sewa Hiace': ['Dio', 'Arif'],
    Lainnya: ['Parkir', 'Konsumsi', 'Air Mineral'],
  });

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load existing HPP data and master categories when modal opens
  useEffect(() => {
    if (isOpen && reservasi) {
      setIsLoading(true);
      setErrorMessage('');
      setStatusBayar((reservasi.statusPayment as StatusPayment) || 'DP 1');

      // Fetch existing HPP items and master categories
      Promise.all([
        fetch(`/api/hpp?kode=${encodeURIComponent(reservasi.kode)}`).then((r) => r.json()),
        fetch('/api/hpp?master=true').then((r) => r.json()),
      ])
        .then(([hppRes, masterRes]) => {
          if (masterRes.success && masterRes.data) {
            setMasterKategori((prev) => ({ ...prev, ...masterRes.data }));
          }

          if (hppRes.success && hppRes.data) {
            const rawItems: HppItem[] = hppRes.data.items || [];
            if (rawItems.length > 0) {
              setItems(
                rawItems.map((it, idx) => ({
                  id: String(idx + 1),
                  kategori: it.kategori,
                  vendor: it.vendor,
                  nominalStr: formatRibuan(it.nominal),
                  catatan: it.catatan || '',
                }))
              );
            } else {
              // Baris default jika kosong
              setItems([
                {
                  id: '1',
                  kategori: 'Tiket',
                  vendor: '',
                  nominalStr: '',
                  catatan: '',
                },
              ]);
            }
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorMessage('Gagal memuat rincian HPP.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, reservasi]);

  if (!isOpen || !reservasi) return null;

  // Hitung total live persis sesuai Google Sheet
  const totalHpp = items.reduce((sum, item) => sum + parseCurrency(item.nominalStr), 0);
  const profit = totalHpp > 0 ? Math.max(0, (reservasi.nilaiOrder || 0) - totalHpp) : 0;
  const margin = computeMargin(reservasi.nilaiOrder || 0, totalHpp);

  const handleAddItem = () => {
    const firstCat = Object.keys(masterKategori)[0] || 'Tiket';
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        kategori: firstCat,
        vendor: '',
        nominalStr: '',
        catatan: '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof TempHppItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === 'nominalStr') {
          const rawDigits = String(val).replace(/\D/g, '');
          if (!rawDigits) {
            return { ...it, nominalStr: '' };
          }
          const num = parseInt(rawDigits, 10);
          return { ...it, nominalStr: formatRibuan(num) };
        }
        return { ...it, [field]: val };
      })
    );
  };

  const handleSaveHpp = async () => {
    setErrorMessage('');
    setIsSaving(true);

    try {
      // Validasi baris
      const validItems = items
        .filter((it) => it.kategori && it.vendor && parseCurrency(it.nominalStr) > 0)
        .map((it) => ({
          kategori: it.kategori,
          vendor: it.vendor,
          nominal: parseCurrency(it.nominalStr),
          catatan: it.catatan,
        }));

      const res = await fetch('/api/hpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: reservasi.kode,
          namaTamu: reservasi.namaTamu,
          totalHpp,
          statusPayment: statusBayar,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menyimpan perubahan HPP.');
      }

      onSuccess(
        `HPP & Status Payment ${reservasi.kode} berhasil diperbarui (Total HPP: ${formatRupiah(totalHpp)})`
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3.5 sm:px-6 sm:py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-200/60 dark:border-orange-900/40">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-slate-100">
                Update Status Payment &amp; HPP Manager
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Kelola rincian biaya HPP dan status pembayaran tamu di Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Guest & Status Header Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Tamu Reservasi
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {reservasi.namaTamu} ({reservasi.kode})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Nilai Order: <strong className="text-slate-900 dark:text-slate-100">{formatRupiah(reservasi.nilaiOrder)}</strong>
              </p>
            </div>

            {/* Status Bayar Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Status Bayar:
              </label>
              <select
                value={statusBayar}
                onChange={(e) => setStatusBayar(e.target.value as StatusPayment)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500"
              >
                <option value="DP 1">DP 1</option>
                <option value="DP 2">DP 2</option>
                <option value="DP 3">DP 3</option>
                <option value="Lunas">Lunas</option>
                <option value="Cancel">Cancel</option>
              </select>
            </div>
          </div>

          {/* HPP Line Items Table */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Rincian Pengeluaran HPP
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data otomatis tersimpan ke tab &apos;RincianHPP&apos; dan merangkum kolom HPP utama
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200/60 dark:border-orange-900/40 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Biaya</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                Memuat data rincian HPP...
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                Belum ada rincian biaya. Klik &quot;Tambah Biaya&quot; untuk menginput.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => {
                  const vendorList = masterKategori[it.kategori] || [];

                  return (
                    <div
                      key={it.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/60 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center group"
                    >
                      {/* 1. Kategori */}
                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                          Kategori
                        </label>
                        <select
                          value={it.kategori}
                          onChange={(e) => {
                            handleUpdateItem(it.id, 'kategori', e.target.value);
                            handleUpdateItem(it.id, 'vendor', '');
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                        >
                          {Object.keys(masterKategori).map((kat) => (
                            <option key={kat} value={kat}>
                              {kat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Vendor / Keterangan */}
                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                          Vendor / Keterangan
                        </label>
                        {it.isCustomVendor ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Ketik vendor baru..."
                              value={it.vendor}
                              onChange={(e) => handleUpdateItem(it.id, 'vendor', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-orange-300 dark:border-orange-600 bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(it.id, 'isCustomVendor', false)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1"
                              title="Pilih dari daftar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              value={it.vendor}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  handleUpdateItem(it.id, 'isCustomVendor', true);
                                  handleUpdateItem(it.id, 'vendor', '');
                                } else {
                                  handleUpdateItem(it.id, 'vendor', e.target.value);
                                }
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                            >
                              <option value="">-- Pilih Vendor --</option>
                              {vendorList.map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                              <option value="__custom__">+ Input Manual...</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* 3. Nominal (Rp) */}
                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                          Nominal (Rp)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                            Rp
                          </span>
                          <input
                            type="text"
                            placeholder="0"
                            value={it.nominalStr}
                            onChange={(e) => handleUpdateItem(it.id, 'nominalStr', e.target.value)}
                            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* 4. Catatan */}
                      <div className="sm:col-span-2">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                          Catatan
                        </label>
                        <input
                          type="text"
                          placeholder="Catatan..."
                          value={it.catatan}
                          onChange={(e) => handleUpdateItem(it.id, 'catatan', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* 5. Delete Action */}
                      <div className="sm:col-span-1 flex justify-end pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="w-full sm:w-auto min-h-[36px] sm:min-h-[32px] px-2.5 py-1.5 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 sm:border-0 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="inline sm:hidden">Hapus Biaya</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary Footer Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total HPP Terhitung:
              </div>
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {formatRupiah(totalHpp)}
              </div>
              {isIntern ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Estimasi Profit &amp; Margin: Terkunci (Akses PIC &amp; Superadmin)</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Estimasi Profit: <strong className="text-emerald-700 dark:text-emerald-400">{formatRupiah(profit)}</strong> (Margin: {margin}%)
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveHpp}
              disabled={isSaving || isLoading}
              className="w-full sm:w-auto min-h-[44px] py-3 px-6 rounded-xl text-white font-extrabold text-xs sm:text-sm bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 shadow-md shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Sheet...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Simpan HPP &amp; Status Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
