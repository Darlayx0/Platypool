# 🦆 Platypus: Clay Wings (Arcade Shmup) - 20 Stages Edition

Game arcade side-scrolling shoot 'em up yang terinspirasi langsung dari game klasik legendaris **Platypus**, dengan visual khas **Claymation (animasi tanah liat / plastisin)**, sistem senjata power-up seimbang, kampanye **20 Stage Penuh**, variasi musuh taktis, pertarungan Boss kolosal di setiap kelipatan 5 stage (Stage 5, 10, 15, dan Stage 20 Final Boss), serta synthesizer audio chiptune berbasis Web Audio API.

## 🌐 Mainkan Langsung Secara Online (Live Demo)

Game ini dapat langsung dimainkan di browser Anda tanpa instalasi:
👉 **[Mainkan Game di GitHub Pages](https://darlayx0.github.io/Platypool/)**

---

## 🎮 Cara Menjalankan Game Secara Lokal

Game ini dibuat dengan teknologi web modern (HTML5 Canvas 2D + ES Modules + Vite) dan telah disiapkan agar dapat dimainkan secara instan di browser apa pun:

### Opsi 1: Buka Langsung (Tanpa Perlu Terminal/Server)
- Buka berkas **`play.html`** atau **`index.html`** langsung dengan mengklik ganda (*double-click*) di File Explorer Windows atau buka dengan browser apa pun (Chrome, Edge, Firefox). File ini 100% *standalone* dan dapat langsung dimainkan.
- Anda dapat menekan **SPASI** atau **ENTER** di keyboard, atau klik tombol **"MULAI MAIN"** untuk langsung bertempur.

### Opsi 2: Menggunakan Local Dev Server (Vite)
Buka terminal PowerShell di folder proyek ini:
```powershell
npm run dev
```
Buka URL lokal yang muncul: **`http://localhost:5173`**

### Opsi 3: Build & Preview Versi Produksi
```powershell
npm run build
npm run preview
```

---

## 🗺️ Matriks Komparasi 4 World & Boss Tempur (20 Stages)

Perjalanan kampanye 20 stage dibagi menjadi 4 Dunia tematik dengan eskalasi ancaman formasi armada musuh, pengganda skor bertingkat (**1.0x – 4.0x**), maraton gauntlet intensif, dan pertarungan Boss kolosal multi-modul dengan fase amarah (*Rage Mode*).

### 🗺️ Tabel 1: Matriks World & Armada Musuh Secara Umum

Tabel ini merinci parameter perbandingan armada musuh, penskalaan atribut musuh (*HP multiplier*, *cooldown*, kecepatan peluru), serta dinamika tiap dunia:

| Parameter / Atribut Musuh | 🌄 WORLD 1: Clay Valley | 🏜️ WORLD 2: Sunset Canyon | 🌌 WORLD 3: Midnight Cyber | 🪐 WORLD 4: Cosmic Singularity |
| :--- | :--- | :--- | :--- | :--- |
| **Cakupan Stage** | **Stage 1 – 5** (5 Stage) | **Stage 6 – 10** (5 Stage) | **Stage 11 – 15** (5 Stage) | **Stage 16 – 20** (5 Stage) |
| **Biome & Visual Latar** | Lembah hijau cerah, pulau apel, serbuk sari emas | Ngarai senja tembaga sandstone, debu pasir hangat | Malam berbintang nebula, tebing obsidian & cyan | Singularitas ruang hampa, nebula magenta & void |
| **Pengganda HP Musuh** | `1.00x` *(Standar 100%)* | `1.40x` *(+40% Lebih Tebal)* | `1.80x` *(+80% Armor Berat)* | `2.50x` *(+150% Super Tanky)* |
| **Jeda Tembak Musuh (Cooldown)**| `0.88x` *(Standar Teratur)* | `0.70x` *(-30% Lebih Cepat)* | `0.52x` *(-48% Rapat & Cepat)* | `0.36x` *(-64% Badai Peluru Spam)* |
| **Kecepatan Peluru Musuh** | `1.00x` *(Standar Laju)* | `1.25x` *(+25% Cepat Menusuk)* | `1.50x` *(+50% Melesat Kencang)* | `1.80x` *(+80% Hyper-Speed)* |
| **Kecepatan Gerak Musuh** | `1.00x` *(Stabil Terukur)* | `1.00x` *(Terkalibrasi)* | `1.00x` *(Presisi Taktis)* | `1.00x` *(Terkunci Universal)* |
| **Pengganda Skor World** | `1.00x` | `2.00x` | `3.00x` | `4.00x` |
| **Intensitas Wave Stage** | 3 Wave *(Pelatihan Dasar)* | 3 Wave *(Eskalasi Taktis)* | 4 – 10 Wave *(St. 14: Gauntlet)* | 5 – 10 Wave *(St. 19: Barikade)* |
| **Armada & Formasi Flagship** | Scout Swarm, Beetle Drone, Gunship 3-Way, Blimp | Stinger Wasp, Sniper Laser Merah, Bomber, Spinner | Shield Cruiser (Kebal Depan), Mine Layer, Ace, Juggernaut | Vortex Drone (Gravitasi), Interceptor 3-Way, Star Fleet |
| **Gimmick Bahaya Armada** | Formasi V meliuk & semprotan peluru 3-arah | Garis bidik laser merah Sniper & hujan bom cluster | Perisai depan kebal peluru biasa & ranjau apung | Pusaran gravitasi Vortex & jet siluman berkecepatan tinggi |
| **Base Bonus Clear Stage** | `25k – 125k` *(x1.0x World)* | `300k – 500k` *(x2.0x World)* | `825k – 1.125M` *(x3.0x World)* | `1.6M – 2.0M` *(x4.0x World)* |
| **Senjata Counter Terbaik** | **SPREAD SHOT** & **LASER** | **HOMING MISSILES** & **FLAK** | **SONIC LASER** & **PLASMA ARC** | **PLASMA ARC** & **SPREAD** Overdrive |

---

### 👑 Tabel 2: Matriks Boss World Multi-Modul (Spesifikasi & Gimmick Boss)

Tabel ini merinci atribut, modul kerusakan (*breakable parts*), pola serangan, dan fase amarah (*Rage Mode*) dari seluruh 4 Boss penjaga dunia:

| Parameter Boss Tempur | 🌄 BOSS WORLD 1 (Stage 5) | 🏜️ BOSS WORLD 2 (Stage 10) | 🌌 BOSS WORLD 3 (Stage 15) | 🪐 FINAL CLIMAX BOSS (Stage 20) |
| :--- | :--- | :--- | :--- | :--- |
| **Nama Resmi Boss** | **The Iron Clay Dreadnought** | **The Clay Goliath Zeppelin** | **The Ultimate Clay Leviathan** | **The Omega Clay Colossus** |
| **Base Total HP Boss** | `600 HP` *(1.0x)* | `1.200 HP` *(2.0x)* | `1.800 HP` *(3.0x)* | `3.600 HP` *(6.0x Total!)* |
| **Rincian Modul & HP Bagian** | • Turret Atas: **110 HP**<br>• Turret Bawah: **110 HP**<br>• Inti Lambung: **380 HP** | • Baterai Mortir: **260 HP**<br>• Hanggar Drone: **240 HP**<br>• Lambung Balon: **700 HP** | • Sayap Atas: **300 HP**<br>• Sayap Bawah: **300 HP**<br>• Pod Rudal: **350 HP**<br>• Inti Naga: **850 HP** | • Railgun Atas/Bawah: **@400 HP**<br>• Drone Matrix: **500 HP**<br>• Colossus Hull: **1.100 HP**<br>• Fase 2 Apex Core: **1.200 HP** |
| **Pola Serangan Utama** | Meriam sudut terarah, shotgun 5-way & semprotan gelombang sinus | Mortir parabola area ledak, tembakan lambung broadside 5-way | Mega Sonic Laser Beam tebal, salvo 6 rudal & spiral plasma | Dual piercing railgun beams, gelombang gravitasi & spiral 360° |
| **Skill Khusus / Gimmick** | Panggilan kawanan Pink Scout berkala dari belakang arena | Hanggar meluncurkan Interceptor 3-way laser & Stinger rusher | Laser beam partikel tebal didahului telegraf merah pekat | Fase 2 Dash Rush menembus layar + Kinetic Barrier kebal 2.4s |
| **Mekanik Fase Rage** | Rage Overdrive saat HP &le; 30%: tembakan non-stop rapat | Modul pecah / HP &le; 30%: sortie ganda & triple mortar | Wing Overdrive: Charge laser 2x cepat & badai spiral | **Dual-Phase Evolution**: Hancurnya Colossus melahirkan Apex Core! |
| **Gaya Manuver di Arena** | Mengambang vertikal lembut di garis kanan | Melayang mantap steampunk di sisi kanan atas/bawah | Gerakan meliuk dinamis (bio-serpentine) | Fase 1: Titan stasioner kokoh; Fase 2: Dash Rush maju-mundur |
| **Base Bonus Kalahkan Boss** | `+250.000` *(x Diff Mult)* | `+600.000` *(x Diff Mult)* | `+1.200.000` *(x Diff Mult)* | `+3.500.000` *(FINAL VICTORY BONUS, s/d 17.5M)* |
| **Reward Transisi World** | `+1 Nyawa Ekstra` & Transisi Sunset | `+1 Nyawa Ekstra` & Transisi Cyber | `+1 Nyawa Ekstra` & Transisi Kosmis | 🏆 **VICTORY SCREEN** (Tamat 20 Stage) |
| **Taktik & Strategi Menang** | Rontokkan turet atas & bawah terlebih dahulu untuk membatasi sudut | Bungkam modul Hanggar lebih awal sebelum arena dipadati drone | Perhatikan telegraf laser merah tebal; segera hindari jalurnya | Jaga jarak saat Apex Core bersiap Dash Rush; serang saat perisai padam |

### 📖 Ulasan Mendalam Tiap Dunia & Formasi Stage

#### 🌄 World 1: Clay Valley (Stage 1 – 5)
- **Atmosfer**: Langit siang cerah dengan perbukitan hijau segar, pulau terapung berbuah apel, dan partikel serbuk sari keemasan.
- **Stage 1**: Lembah Tanah Liat (Pelatihan terbang & pengenalan formasi Scout V-shape)
- **Stage 2**: Serangan Kumbang (Kumbang Drone penukik cepat bermanuver kurva)
- **Stage 3**: Armada Meriam Biru (Gunship penembak 3 arah menyebar)
- **Stage 4**: Konvoi Balon Udara (Zeppelin lapis baja pengawal formasi)
- **Stage 5 (BOSS 1)**: **The Iron Clay Dreadnought** (Dreadnought berarmor 600 HP dengan turet atas/bawah independen dan salvo peluru gelombang sinus)

#### 🏜️ World 2: Sunset Canyon (Stage 6 – 10)
- **Atmosfer**: Langit senja tembaga sandstone yang hangat, tebing terjal bergradien, semak zaitun alami, dan partikel debu pasir gurun.
- **Stage 6**: Ngarai Tanah Senja (Serbuan cepat Tawon Stinger penusuk garis lurus)
- **Stage 7**: Lorong Penembak Jitu (Sniper dengan garis bidik laser merah presisi tinggi)
- **Stage 8**: Hujan Bom Tanah Liat (Pesawat Bomber menjatuhkan bom cluster dari atas)
- **Stage 9**: Badai Cakram Berputar (Cakram Spinner bergerigi yang memantul di dinding layar)
- **Stage 10 (BOSS 2)**: **The Clay Goliath Zeppelin** (Balon tempur steampunk raksasa 1.200 HP berbekal mortir parabola area dan hanggar peluncur Interceptor & Stinger)

#### 🌌 World 3: Midnight Cyber-Clay (Stage 11 – 15)
- **Atmosfer**: Langit malam berbintang (*starry nebula*), pegunungan obsidian kosmik, dan vegetasi cyber bercahaya neon cyan.
- **Stage 11**: Benteng Malam Cyber (Shield Cruiser berperisai energi kebal di bagian depan)
- **Stage 12**: Medan Ranjau Terapung (Drone Mine Layer penebar ladang ranjau berduri)
- **Stage 13**: Skuadron Elit Emas (Jet Ace akrobatik bermanuver loop-de-loop lincah)
- **Stage 14 (EXTENDED MARATHON)**: **Serangan Total: Gauntlet** (Stage maraton panjang berisi 10 gelombang intensif armada musuh gabungan)
- **Stage 15 (BOSS 3)**: **The Ultimate Clay Leviathan** (Titan naga tanah liat kosmik 1.800 HP dengan sayap plasma energi, peluncur rudal salvo 6-way, dan balok Mega Sonic Laser pemusnah)

#### 🪐 World 4: The Cosmic Singularity (Stage 16 – 20)
- **Atmosfer**: Hamparan angkasa kosmis yang dalam tanpa batas dengan awan nebula magenta-cyan, pulau kristal violet, dan debu partikel bintang berkilauan.
- **Stage 16**: Gerbang Ruang Kosmis (Pertempuran kecepatan tinggi melawan formasi *Stingers*, *Aces*, dan *Snipers*)
- **Stage 17**: Benteng Siber Berlapis Baja (Barikade tebal *Shield Cruisers*, ranjau apung dari *Mine Layers*, dan *Bombers*)
- **Stage 18**: Skuadron Badai Bintang (Skuadron pilot *Ace* elit dengan formasi akrobatik dan kawalan *Blimps*)
- **Stage 19 (EXTREME MARATHON)**: **Barikade Terakhir Singularitas** (Gauntlet maraton 10 gelombang spam bullet-hell terpadat)
- **Stage 20 (FINAL CLIMAX BOSS)**: **The Omega Clay Colossus** (Boss final tertangguh 3.600 Total HP! Fase 1: Titan Colossus ber-Railgun ganda & Drone Matrix; Fase 2: *Omega Apex Core* bertransformasi mandiri dengan manuver Dash Rush lincah, kinetic barrier kebal peluru, dan 360° spiral bullet-hell)

---

## 🕹️ Panduan Kontrol & Gameplay
 
| Kontrol | Aksi |
| :--- | :--- |
| **Mouse / Kursor** | Gerakkan pesawat mengikuti kursor dengan halus |
| **W, A, S, D** atau **Tombol Panah** | Gerakan pesawat 8 arah (Keyboard Mode) |
| **Panah ◀ / ▶ atau A / D** | Mengganti tingkat kesulitan di Menu Utama (Beginner ➔ Extreme) |
| **Spasi** atau **Klik Kiri** | Menembak peluru (atau tekan saat menu untuk mulai/lanjut) |
| **Tombol M** / **Klik Kanan** | Toggle **Auto-Fire** (tembakan otomatis berkelanjutan) |
| **Tombol U** | Toggle **Mode UHD Super Tajam** (Hi-DPI / Retina / 4K) |
| **Tombol F** | Toggle **Layar Penuh (Fullscreen)** |
| **Tombol O** | Buka Modal **Pengaturan (Settings)** saat bermain |
| **ESC** atau **P** | Menjeda game (Pause) / Melanjutkan game |
| **Quick HUD Bar (Atas)** | Akses cepat Auto-Fire, Kemudi Mouse/WASD, UHD, Audio Mute, Settings, Fullscreen, Pause |

---

## 💎 Fitur Visual UHD & Engine Claymorphism Modern

- **True UHD Hi-DPI Resolution Scaling**: Canvas secara dinamis meraster pada rasio resolusi fisik layar monitor Anda (hingga DPR 3.0x untuk layar Retina, 1440p, dan 4K), mempertahankan ketajaman vektor tanah liat yang sempurna tanpa mengorbankan performa 60 FPS.
- **Rendering Tanah Liat Organik (Plastisin)**: Pencahayaan plastisin prosedural 5-stop radial gradient, bayangan alas jatuh realistis, dan kilau ganda (*dual specular glint* - soft diffuse highlight + crisp specular bead) di setiap lekukan model pesawat dan musuh.
- **Plume Pendorong & Efek Aura Senjata**: Pesawat memiliki lidah api kembar bereaksi dinamis dengan inti putih-panas, pylon sayap bersinar aura energi sesuai senjata aktif (Merah untuk Spread, Sian untuk Laser, Hijau untuk Homing, Oranye untuk Flak, Ungu untuk Plasma), serta cakram baling-baling transparan berputar.
- **Micro-Interaction & Tactile Sound FX**: Setiap tombol UI dan pill card dilengkapi interaksi claymorphism responsif (squish tekan, melambung halus saat hover) dan umpan balik suara synthesizer Web Audio API dua-nada yang lembut dan memuaskan.
- **Visual Bebas Pusing (Rock-Solid Camera)**: Latar belakang perbukitan, pegunungan, pulau terapung, dan awan tetap kokoh tanpa guncangan layar berlebih, memberikan kenyamanan bermain maraton tingkat tinggi.

---

## 🔄 Sistem Power-Up & Balancing Bonus Skor

- **Bonus Nyawa Ekstra**: Setiap mencapai kelipatan skor tertentu (sesuai difficulty: **100.000** di Beginner, **500.000** di Easy, **2.000.000** di Normal, **10.000.000** di Hard, dan **50.000.000** di Extreme) atau berhasil mengalahkan Boss dunia (di mode Beginner, Easy, & Normal), pesawat Anda secara otomatis mendapatkan **+1 Nyawa** ekstra lengkap dengan nada kemenangan arcade yang merdu!
- **Balancing Bonus Skor Stage**: Bonus skor penyelesaian stage dinaikkan secara proporsional dan dihitung menggunakan sistem logika: Base Stage Bonus dikalikan **Multiplier Skor World (1.0x – 4.0x)** terlebih dahulu, lalu dikalikan dengan **Multiplier Skor Difficulty (0.25x – 5.0x)**.
