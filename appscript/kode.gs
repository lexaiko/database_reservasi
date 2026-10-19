// ==========================================================================
// 1. AKSES WEB APP (Pintu Masuk Link Form Reservasi)
// ==========================================================================
function doGet() { 
  return HtmlService.createHtmlOutputFromFile('Index') 
    .setTitle('Sistem Database Reservasi 2026') 
    .addMetaTag('viewport', 'width=device-width, initial-scale=1') 
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
}

function formatTanggal(tgl) { 
  if (!tgl) return ""; 
  var parts = tgl.split("-"); 
  if (parts.length === 3) { 
    var yy = parts[0].substring(2); 
    return parts[2] + "/" + parts[1] + "/" + yy; 
  } 
  return tgl; 
}

// ==========================================================================
// 2. SIMPAN DATA RESERVASI & AUTO-SYNC GOOGLE CALENDAR
// ==========================================================================
function simpanData(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Database Reservasi");
    
    var startTrip = formatTanggal(data.start_trip);
    var finishTrip = formatTanggal(data.finish_trip);
    var tglDp = formatTanggal(data.tgl_dp);

    var columnB = sheet.getRange("B:B").getValues();
    var lastRow = 0;
    for (var i = 1; i < columnB.length; i++) {
      if (columnB[i][0] === "") { lastRow = i + 1; break; }
    }
    if (lastRow === 0) lastRow = sheet.getLastRow() + 1;

    var rowData = [
      data.kode, data.nama_tamu, data.whatsapp, data.instagram, data.tiktok, 
      startTrip, finishTrip, data.pax, data.trip, data.paket,
      data.day1, data.day2, data.day3, data.day4, data.mepo,
      data.hotel, data.crew, data.catatan, data.pic_agen, data.sumber_leads,
      "On Schedule (Not Ready)", data.link_review, data.link_foto,
      data.nilai_order, data.dp, tglDp
    ];

    sheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);
    sheet.getRange(lastRow, 29).setValue("DP 1"); 
    // Catatan: Kolom AA (27: Sisa), AF (32: Profit), dan AG (33: Margin %)
    // sengaja TIDAK diisi manual agar ARRAYFORMULA di Sheet baris 2 menghitung otomatis tanpa error #REF!

    // Eksekusi Auto-Sync Kalender (Anti-Double Super Akurat)
    try {
      if (data.start_trip && data.kode) {
        var calId = '4cb4f6315cb72fb557342155498d7ac9e72a8c265075bab1721120900be49fdc@group.calendar.google.com';
        var cal = CalendarApp.getCalendarById(calId);
        
        if (cal) {
          // RADAR PENGHAPUS DUPLIKAT YANG DIPERBARUI
          var searchStart = new Date("2024-01-01");
          var searchEnd = new Date("2030-12-31");
          var eventsLama = cal.getEvents(searchStart, searchEnd, {search: data.kode});
          
          for (var e = 0; e < eventsLama.length; e++) {
            var descLama = eventsLama[e].getDescription() || "";
            // Cukup cari eksistensi KODE unik di deskripsi (Abaikan mau format lama/baru/HTML)
            if (descLama.indexOf(data.kode) !== -1) { 
              eventsLama[e].deleteEvent(); 
            }
          }

          var judul = data.nama_tamu + " - " + data.pax + " Pax [" + data.paket + "]";
          
          var deskripsi = "➖➖➖➖➖➖➖➖➖➖➖➖➖➖\n" +
                          "🚗 DETAIL OPERASIONAL TRIP 🚗\n" +
                          "➖➖➖➖➖➖➖➖➖➖➖➖➖➖\n\n" +
                          "👤 NAMA\u2003\u2003: " + data.nama_tamu.toUpperCase() + "\n" +
                          "👥 JUMLAH\u2002: " + data.pax + " Orang\n" +
                          "📦 PAKET\u2003\u2002: " + data.paket + "\n\n" +
                          "📅 START\u2003\u2002: " + startTrip + "\n" +
                          "🏁 FINISH\u2003: " + (finishTrip || "-") + "\n\n" +
                          "📍 DESTINASI :\n" +
                          "▫️ Day 1\u2002: " + (data.day1 || "-") + "\n" +
                          "▫️ Day 2\u2002: " + (data.day2 || "-") + "\n" +
                          "▫️ Day 3\u2002: " + (data.day3 || "-") + "\n" +
                          "▫️ Day 4\u2002: " + (data.day4 || "-") + "\n\n" +
                          "🤵 PIC\u2003\u2003\u2003: " + (data.pic_agen || "-") + "\n\n" +
                          "----------------------------------------------------------\n" +
                          "ID KODE : " + data.kode;

          var tglMulai = new Date(data.start_trip);
          if (data.finish_trip) {
            var tglSelesai = new Date(data.finish_trip);
            tglSelesai.setDate(tglSelesai.getDate() + 1); 
            cal.createAllDayEvent(judul, tglMulai, tglSelesai, {description: deskripsi});
          } else {
            cal.createAllDayEvent(judul, tglMulai, {description: deskripsi});
          }
        }
      }
    } catch (errCal) {
      Logger.log("Calendar Error: " + errCal.message);
    }

    return "✅ Reservasi atas nama " + data.nama_tamu + " berhasil disimpan!";
  } catch (e) {
    throw new Error(e.message); 
  }
}

// ==========================================================================
// 3. MENU ERP (Navigasi ERP Mahkota Gandrung)
// ==========================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🌟 ERP TripBanyuwangi')
    .addItem('✨ Input Reservasi Baru', 'bukaFormReservasi') 
    .addSeparator()
    .addItem('📝 Update Status Payment & HPP', 'bukaFormHPP')
    .addItem('👀 Lihat Detail HPP', 'bukaViewHPP')
    .addSeparator() 
    .addItem('📅 Sync Jadwal ke Google Kalender', 'syncKalenderManual')
    .addToUi();
}

function bukaFormReservasi() {
  var html = HtmlService.createHtmlOutputFromFile('FormReservasi') 
      .setWidth(850)  
      .setHeight(650); 
  SpreadsheetApp.getUi().showModalDialog(html, 'Form Input Reservasi Baru');
}

function bukaFormHPP() {
  var html = HtmlService.createHtmlOutputFromFile('FormHPP').setWidth(800).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'Form HPP Manager');
}

function bukaViewHPP() {
  var html = HtmlService.createHtmlOutputFromFile('ViewHPP').setWidth(750).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Detail HPP (Read Only)');
}

// ==========================================================================
// 4. MESIN PENDUKUNG ERP & MASTER KATEGORI
// ==========================================================================
function getMasterKategoriHPP() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KategoriHPP");
  if(!sheet) return {}; 
  
  var data = sheet.getDataRange().getValues();
  var master = {};
  
  for(var i = 1; i < data.length; i++) {
    var kat = data[i][0].toString().trim();
    var ven = data[i][1].toString().trim();
    if(kat !== "") {
      if(!master[kat]) master[kat] = [];
      if(ven !== "") master[kat].push(ven);
    }
  }
  return master;
}

function getBarisAktif() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var baris = sheet.getActiveCell().getRow();
  if(baris === 1) return { error: "Pilih baris data tamu dulu!" };

  var kode = sheet.getRange(baris, 1).getValue().toString().trim(); 
  var nama = sheet.getRange(baris, 2).getValue().toString().trim();
  var status = sheet.getRange(baris, 29).getValue().toString().trim(); 
  
  if(!kode) return { error: "Kode tidak ditemukan di Kolom A!" };
  return cariDataHPP(kode, nama, status, baris);
}

function getHPPReadOnly() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var baris = sheet.getActiveCell().getRow();
  if(baris === 1) return { error: "Pilih baris data tamu dulu!" };

  var kode = sheet.getRange(baris, 2).getValue().toString().trim(); 
  var nama = sheet.getRange(baris, 3).getValue().toString().trim();
  
  if(!kode) return { error: "Kode tidak ditemukan di Kolom B!" };
  return cariDataHPP(kode, nama, null, baris);
}

function cariDataHPP(kode, nama, status, baris) {
  var sheetHPP = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RincianHPP');
  var dataHPP = sheetHPP.getDataRange().getValues();
  var rincianLama = [];
  var total = 0;
  for(var i = 1; i < dataHPP.length; i++) {
    if(dataHPP[i][1] == kode) { 
      rincianLama.push({
        kategori: dataHPP[i][3], 
        vendor: dataHPP[i][4], 
        nominal: dataHPP[i][5],
        catatan: dataHPP[i][6] || "" 
      });
      total += parseInt(dataHPP[i][5]) || 0;
    }
  }
  return { baris: baris, kode: kode, nama: nama, status: status, rincian: rincianLama, total: total };
}

// ==========================================================================
// 5. MESIN SIMPAN HPP & AUTO-SAVE MASTER DATA
// ==========================================================================
function simpanDataKeSheet(dataForm) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetHPP = ss.getSheetByName('RincianHPP');
  var sheetUtama = ss.getSheetByName('Database Reservasi');
  var sheetMaster = ss.getSheetByName('KategoriHPP'); 
  
  var dataMaster = sheetMaster.getDataRange().getValues();
  var existingMaster = {};
  for(var m = 1; m < dataMaster.length; m++) {
    var mKat = dataMaster[m][0].toString().trim();
    var mVen = dataMaster[m][1].toString().trim();
    if(!existingMaster[mKat]) existingMaster[mKat] = [];
    existingMaster[mKat].push(mVen);
  }

  var dataHPP = sheetHPP.getDataRange().getValues();
  for(var i = dataHPP.length - 1; i >= 1; i--) {
    if(dataHPP[i][1] == dataForm.kode) { sheetHPP.deleteRow(i + 1); }
  }
  
  var waktuSekarang = new Date();
  var totalHPP = 0;
  if(dataForm.rincian.length > 0) {
    for(var j = 0; j < dataForm.rincian.length; j++) {
      var item = dataForm.rincian[j];
      sheetHPP.appendRow([waktuSekarang, dataForm.kode, dataForm.nama, item.kategori, item.vendor, item.nominal, item.catatan]);
      totalHPP += parseInt(item.nominal);

      if(item.kategori && item.vendor) {
        if(!existingMaster[item.kategori]) existingMaster[item.kategori] = [];
        if(existingMaster[item.kategori].indexOf(item.vendor) === -1) {
          sheetMaster.appendRow([item.kategori, item.vendor]);
          existingMaster[item.kategori].push(item.vendor); 
        }
      }
    }
  }
  
  var dataUtama = sheetUtama.getDataRange().getValues();
  var barisTarget = -1;
  for(var k = 0; k < dataUtama.length; k++){
    if(dataUtama[k][0] == dataForm.kode){ barisTarget = k + 1; break; }
  }
  
  if(barisTarget > 0) {
    sheetUtama.getRange(barisTarget, 29).setValue(dataForm.status); 
    var headerUtama = dataUtama[0];
    var colHPP = headerUtama.indexOf("HPP") + 1;
    if(colHPP > 0) sheetUtama.getRange(barisTarget, colHPP).setValue(totalHPP);
  }
  return "Sukses";
}

// ==========================================================================
// 6. SYNC KALENDER MANUAL (Versi Rapi Titik Dua)
// ==========================================================================
function syncKalenderManual() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if(sheet.getName() !== "Database Reservasi") {
    ui.alert("⚠️ Gunakan menu ini saat berada di sheet 'Database Reservasi'!");
    return;
  }

  var baris = sheet.getActiveCell().getRow();
  if (baris === 1) {
    ui.alert("⚠️ Pilih baris data tamu dulu (klik nama tamunya)!");
    return;
  }

  var dataBaris = sheet.getRange(baris, 1, 1, 20).getValues()[0]; 

  var kode = dataBaris[0];           
  var nama = dataBaris[1];           
  var startTripRaw = dataBaris[5];   
  var finishTripRaw = dataBaris[6];  
  var pax = dataBaris[7];            
  var paket = dataBaris[9];          
  var day1 = dataBaris[10];          
  var day2 = dataBaris[11];          
  var day3 = dataBaris[12];          
  var day4 = dataBaris[13];          
  var pic = dataBaris[18];           

  if (!kode || !nama || !startTripRaw) {
    ui.alert("⚠️ Data tidak lengkap! Kode, Nama, dan Start Trip wajib diisi.");
    return;
  }

  var response = ui.alert('Konfirmasi Sinkronisasi', 'Kirim/Update jadwal ' + nama + ' ke Kalender?', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.YES) {
    try {
      var calId = '4cb4f6315cb72fb557342155498d7ac9e72a8c265075bab1721120900be49fdc@group.calendar.google.com';
      var cal = CalendarApp.getCalendarById(calId);

      if (cal) {
        // RADAR PENGHAPUS DUPLIKAT YANG DIPERBARUI
        var searchStart = new Date("2024-01-01");
        var searchEnd = new Date("2030-12-31");
        var eventsLama = cal.getEvents(searchStart, searchEnd, {search: kode});
        
        for (var i = 0; i < eventsLama.length; i++) {
          var desc = eventsLama[i].getDescription() || "";
          // Cukup cari eksistensi KODE unik di deskripsi
          if (desc.indexOf(kode) !== -1) { 
            eventsLama[i].deleteEvent(); 
          }
        }

        var judul = nama + " - " + pax + " Pax [" + paket + "]";

        function formatTgl(d) {
          if(!d) return "-";
          if(d instanceof Date) {
             var tgl = ("0" + d.getDate()).slice(-2);
             var bln = ("0" + (d.getMonth() + 1)).slice(-2);
             var thn = d.getFullYear().toString().substring(2);
             return tgl + "/" + bln + "/" + thn;
          }
          return d;
        }

        var deskripsi = "➖➖➖➖➖➖➖➖➖➖➖➖➖➖\n" +
                        "🚗 DETAIL OPERASIONAL TRIP 🚗\n" +
                        "➖➖➖➖➖➖➖➖➖➖➖➖➖➖\n\n" +
                        "👤 NAMA\u2003\u2003: " + nama.toUpperCase() + "\n" +
                        "👥 JUMLAH\u2002: " + pax + " Orang\n" +
                        "📦 PAKET\u2003\u2002: " + paket + "\n\n" +
                        "📅 START\u2003\u2002: " + formatTgl(startTripRaw) + "\n" +
                        "🏁 FINISH\u2003: " + formatTgl(finishTripRaw) + "\n\n" +
                        "📍 DESTINASI :\n" +
                        "▫️ Day 1\u2002: " + (day1 || "-") + "\n" +
                        "▫️ Day 2\u2002: " + (day2 || "-") + "\n" +
                        "▫️ Day 3\u2002: " + (day3 || "-") + "\n" +
                        "▫️ Day 4\u2002: " + (day4 || "-") + "\n\n" +
                        "🤵 PIC\u2003\u2003\u2003: " + (pic || "-") + "\n\n" +
                        "----------------------------------------------------------\n" +
                        "ID KODE : " + kode;

        var tglMulai = new Date(startTripRaw);
        if (finishTripRaw) {
          var tglSelesai = new Date(finishTripRaw);
          tglSelesai.setDate(tglSelesai.getDate() + 1); 
          cal.createAllDayEvent(judul, tglMulai, tglSelesai, {description: deskripsi});
        } else {
          cal.createAllDayEvent(judul, tglMulai, {description: deskripsi});
        }
        ui.alert("✅ Sukses sinkronisasi kalender!");
      }
    } catch (e) {
      ui.alert("❌ Gagal: " + e.message);
    }
  }
}

// ==========================================================================
// 7. FUNGSI LANJUTAN UNTUK WEB PORTAL (INDEX.HTML)
// ==========================================================================

// Ambil data dengan sistem limit & offset (Anti Baris Kosong!)
function getRingkasanData(limit, offset) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Database Reservasi");
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var range = sheet.getRange(2, 1, lastRow - 1, 29); 
  var values = range.getDisplayValues();
  
  // Saring hanya baris yang ada kodenya (Hilangkan baris hantu)
  var validData = [];
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] !== "") { 
      validData.push({
        baris: i + 2, // Hitung baris asli di Excel (mulai dari baris ke-2)
        kode: values[i][0], 
        nama: values[i][1], 
        pax: values[i][7], 
        paket: values[i][9], 
        status: values[i][28] || "Pending"
      });
    }
  }
  
  // Balik data agar yang terbaru (di bawah) muncul paling atas di Web
  validData.reverse();
  
  // Potong untuk fitur "Load More"
  var start = offset || 0;
  var end = start + (limit || 10);
  return validData.slice(start, end);
}

// Ambil data SATU BARIS LENGKAP (Pengaman Anti-Null)
function getDataLengkapByBaris(baris) {
  var b = parseInt(baris, 10);
  if (isNaN(b) || b < 2) {
    throw new Error("Nomor baris tidak terbaca atau data kosong.");
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Database Reservasi");
  var rowData = sheet.getRange(b, 1, 1, 29).getDisplayValues()[0];
  
  return {
    baris: b,
    kode: rowData[0], nama: rowData[1], wa: rowData[2], ig: rowData[3], tiktok: rowData[4],
    start: rowData[5], finish: rowData[6], pax: rowData[7], trip: rowData[8], paket: rowData[9],
    day1: rowData[10], day2: rowData[11], day3: rowData[12], day4: rowData[13],
    mepo: rowData[14], hotel: rowData[15], crew: rowData[16], catatan: rowData[17],
    pic: rowData[18], sumber: rowData[19], status: rowData[28],
    nilai: rowData[23], dp: rowData[24], tgl_dp: rowData[25]
  };
}

// Simpan hasil Edit dari Form Modal (VERSI FULL KOLOM)
function simpanEditLengkap(d) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Database Reservasi");
  var baris = parseInt(d.baris, 10);
  
  if (isNaN(baris) || baris < 2) {
    throw new Error("Gagal menyimpan: Sistem kehilangan jejak nomor baris.");
  }
  
  // Update per kolom sesuai struktur FormReservasi
  sheet.getRange(baris, 1).setValue(d.kode);
  sheet.getRange(baris, 2).setValue(d.nama_tamu);
  sheet.getRange(baris, 3).setValue(d.whatsapp);
  sheet.getRange(baris, 4).setValue(d.instagram); 
  sheet.getRange(baris, 5).setValue(d.tiktok); 
  sheet.getRange(baris, 6).setValue(formatTanggal(d.start_trip)); 
  sheet.getRange(baris, 7).setValue(formatTanggal(d.finish_trip));
  sheet.getRange(baris, 8).setValue(d.pax);
  sheet.getRange(baris, 9).setValue(d.trip);
  sheet.getRange(baris, 10).setValue(d.paket);
  sheet.getRange(baris, 11).setValue(d.day1);
  sheet.getRange(baris, 12).setValue(d.day2);
  sheet.getRange(baris, 13).setValue(d.day3);
  sheet.getRange(baris, 14).setValue(d.day4);
  sheet.getRange(baris, 16).setValue(d.hotel);
  sheet.getRange(baris, 18).setValue(d.catatan); 
  sheet.getRange(baris, 19).setValue(d.pic_agen); 
  sheet.getRange(baris, 20).setValue(d.sumber_leads); 
  sheet.getRange(baris, 24).setValue(d.nilai_order);
  sheet.getRange(baris, 25).setValue(d.dp);
  sheet.getRange(baris, 26).setValue(formatTanggal(d.tgl_dp)); 
  sheet.getRange(baris, 29).setValue(d.status);

  return "✅ Data " + d.kode + " Berhasil diperbarui!";
}

// ==========================================================================
// 8. FUNGSI UNTUK KALENDER BULANAN WEB
// ==========================================================================
function getJadwalKalender() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Jadwal");
  if (!sheet) return {}; // Kalau sheet belum ada, kembalikan kosong

  var data = sheet.getDataRange().getValues();
  var kalender = {};

  // Kita mulai dari baris 0 atau 1 tergantung ada header atau tidak
  // Asumsi saya baris 1 (index 0) adalah header, jadi mulai dari i=1. Kalau datamu tanpa header, ganti i=0.
  for (var i = 1; i < data.length; i++) {
    var tglRaw = data[i][0];
    if (!tglRaw || tglRaw === "") continue;

    var d = new Date(tglRaw);
    if (isNaN(d.getTime())) continue; // Lewati kalau bukan format tanggal

    // Format jadi YYYY-MM-DD sebagai Kunci (Key)
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var key = yyyy + "-" + mm + "-" + dd;

    if (!kalender[key]) kalender[key] = [];

    kalender[key].push({
      nama: data[i][1],
      pax: data[i][2],
      dest: data[i][3]
    });
  }
  
  return kalender;
}

// ==========================================================================
// 9. FUNGSI UNTUK DASHBOARD STATISTIK (CHART.JS)
// ==========================================================================
function getStatistikDashboard() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Database Reservasi");
  if (!sheet) return null;
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  
  // Mencari kolom HPP secara dinamis dari header
  var hppIndex = -1;
  for (var j = 0; j < headers.length; j++) {
    if (headers[j].toString().toUpperCase() === "HPP") { hppIndex = j; break; }
  }

  // Wadah Penampung Data Grafik
  var kpi = { penjualan: 0, pax: 0, revenue: 0, hpp: 0 };
  var paketCount = {};
  var clientRev = {};
  var picData = {}; 
  var srcData = {}; 
  var trenBulan = {}; 

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] || row[0] === "") continue;

    var status = (row[28] || "").toString().trim();
    if (status === "Cancel" || status === "Cancel / Refund") continue; // Abaikan yang cancel

    var startRaw = row[5]; 

    // =========================================================
    // 🛑 FILTER: HANYA AMBIL DATA SAMPAI BULAN JUNI
    // =========================================================
    if (startRaw) {
      var dObj = new Date(startRaw);
      if (!isNaN(dObj.getTime())) {
        // Di JavaScript, bulan dimulai dari 0 (Januari = 0, Juni = 5).
        // Jika bulannya lebih besar dari 5 (Juli dan seterusnya), maka LEWATI!
        if (dObj.getMonth() > 5) {
          continue; 
        }
      }
    }
    // =========================================================

    var pax = parseInt(row[7]) || 0;
    var paket = (row[9] || "Lainnya").toString().trim();
    var nama = (row[1] || "Tanpa Nama").toString().trim();
    var pic = (row[18] || "Belum Ada PIC").toString().trim();
    var src = (row[19] || "Belum Tahu").toString().trim();
    var nilai = parseInt(row[23]) || 0;
    var hppVal = hppIndex >= 0 ? (parseInt(row[hppIndex]) || 0) : 0;

    // Kalkulasi KPI Utama
    kpi.penjualan++;
    kpi.pax += pax;
    kpi.revenue += nilai;
    kpi.hpp += hppVal;

    // Paket Terlaris
    if (paket !== "") paketCount[paket] = (paketCount[paket] || 0) + 1;

    // Top Client (Revenue)
    if (nama !== "") clientRev[nama] = (clientRev[nama] || 0) + nilai;

    // AOV PIC
    if (pic !== "") {
      if (!picData[pic]) picData[pic] = { rev: 0, count: 0 };
      picData[pic].rev += nilai; picData[pic].count++;
    }

    // AOV Source
    if (src !== "") {
      if (!srcData[src]) srcData[src] = { rev: 0, count: 0 };
      srcData[src].rev += nilai; srcData[src].count++;
    }

    // Tren Penjualan (Bulanan)
    if (startRaw) {
      try {
         var d = new Date(startRaw);
         if (!isNaN(d.getTime())) {
            var m = String(d.getMonth() + 1).padStart(2, '0');
            var y = d.getFullYear();
            var bm = y + "-" + m; // Format: 2026-05
            trenBulan[bm] = (trenBulan[bm] || 0) + nilai;
         }
      } catch(e) {}
    }
  }

  // --- SORTING & FORMATTING UNTUK CHART.JS ---
  
  var sortedPaket = Object.keys(paketCount).map(function(k) { return {name: k, val: paketCount[k]}; })
    .sort(function(a,b) { return b.val - a.val; }).slice(0, 5);

  var sortedClient = Object.keys(clientRev).map(function(k) { return {name: k, val: clientRev[k]}; })
    .sort(function(a,b) { return b.val - a.val; }).slice(0, 10);

  var aovPic = Object.keys(picData).map(function(k) { return {name: k, val: Math.round(picData[k].rev / picData[k].count)}; })
    .sort(function(a,b) { return b.val - a.val; });

  var aovSrc = Object.keys(srcData).map(function(k) { return {name: k, val: Math.round(srcData[k].rev / srcData[k].count)}; })
    .sort(function(a,b) { return b.val - a.val; });

  var sortedTrenKeys = Object.keys(trenBulan).sort();
  var tren = sortedTrenKeys.map(function(k) { 
    var p = k.split("-");
    var namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    var labelCantik = namaBulan[parseInt(p[1])-1] + " " + p[0].substring(2);
    return {label: labelCantik, val: trenBulan[k]}; 
  });

  var grossProfit = kpi.revenue - kpi.hpp;
  var grossMargin = kpi.revenue > 0 ? (grossProfit / kpi.revenue) * 100 : 0;

  return {
    kpi: {
        penjualan: kpi.penjualan,
        pax: kpi.pax,
        revenue: kpi.revenue,
        gprofit: grossProfit,
        gmargin: grossMargin.toFixed(1)
    },
    paket: sortedPaket,
    client: sortedClient,
    aovPic: aovPic,
    aovSrc: aovSrc,
    tren: tren
  };
}

/**
 * Menghitung total nominal pembayaran ke crew tertentu berdasarkan bulan & tahun Finish Trip.
 * @param {"Bagas"} nama Nama crew yang ingin dicari (Cth: "Bagas", "Kikik").
 * @param {4} bulan Angka bulan yang dicari (1 = Januari, 4 = April, 12 = Desember).
 * @param {2026} tahun [Opsional] Angka tahun, jika dikosongkan otomatis menghitung tahun 2026.
 * @return {Number} Total nominal fee crew tersebut.
 * @customfunction
 */
function HITUNG_FEE_CREW(nama, bulan, tahun) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetReservasi = ss.getSheetByName("Database Reservasi");
  var sheetHPP = ss.getSheetByName("RincianHPP");
  
  if (!sheetReservasi || !sheetHPP) return "Sheet Tidak Ditemukan";
  if (!nama || !bulan) return "Nama & Bulan Harus Diisi!";
  
  var dataReservasi = sheetReservasi.getDataRange().getValues();
  var dataHPP = sheetHPP.getDataRange().getValues();
  
  // Pengaturan Target Saringan
  var thnTarget = tahun ? parseInt(tahun, 10) : 2026;
  var blnTarget = parseInt(bulan, 10) - 1; // JavaScript: Januari = 0, April = 3
  var namaTarget = nama.toString().toLowerCase().trim();
  
  // 1. Filter & Catat Kode Reservasi yang lolos saringan waktu Finish Trip
  var listKodeLolos = {};
  for (var i = 1; i < dataReservasi.length; i++) {
    var kode = dataReservasi[i][0]; // Kolom A (Kode Reservasi)
    var finishRaw = dataReservasi[i][6]; // Kolom G (Finish Trip)
    var status = dataReservasi[i][28] ? dataReservasi[i][28].toString().trim() : "";
    
    if (!kode || status === "Cancel" || status === "Cancel / Refund") continue;
    
    if (finishRaw) {
      var dObj = new Date(finishRaw);
      if (!isNaN(dObj.getTime())) {
        if (dObj.getMonth() === blnTarget && dObj.getFullYear() === thnTarget) {
          listKodeLolos[kode] = true;
        }
      }
    }
  }
  
  // 2. Hitung total nominal di sheet RincianHPP
  var totalNominal = 0;
  for (var j = 1; j < dataHPP.length; j++) {
    var kodeHPP = dataHPP[j][1]; // Kolom B (Kode Reservasi)
    var keterangan = (dataHPP[j][4] || "").toString().toLowerCase(); // Kolom E (Keterangan)
    var nominal = parseInt(dataHPP[j][5], 10) || 0; // Kolom F (Nominal)
    
    // Jika kodenya bagian dari trip yang lolos DAN keterangan mengandung nama crew target
    if (listKodeLolos[kodeHPP] && keterangan.indexOf(namaTarget) !== -1) {
      totalNominal += nominal;
    }
  }
  
  return totalNominal;
}