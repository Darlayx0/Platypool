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

## 🗺️ Kampanye 20 Stage & 4 Biome Latar Belakang

Permainan dibagi menjadi 4 Dunia tematik dengan perubahan palet dan latar visual tanah liat:

### 🌄 World 1: Clay Valley (Stage 1 – 5)
- Langit siang cerah dengan perbukitan hijau dan pulau terapung berpohon apel.
- **Stage 1**: Lembah Tanah Liat (Pelatihan terbang & pengenalan formasi Scout)
- **Stage 2**: Serangan Kumbang (Kumbang Drone penukik cepat)
- **Stage 3**: Armada Meriam Biru (Gunship penembak 3 arah)
- **Stage 4**: Konvoi Balon Udara (Zeppelin berlapis baja)
- **Stage 5 (BOSS 1)**: **The Iron Clay Dreadnought** (Dreadnought raksasa berturret atas/bawah dan inti amarah)

### 🏜️ World 2: Sunset Canyon (Stage 6 – 10)
- Langit senja tembaga lembut (*twilight sandstone*), ngarai hangat bergradien, dan vegetasi olive alami.
- **Stage 6**: Ngarai Tanah Senja (Serbuan cepat Tawon Stinger)
- **Stage 7**: Lorong Penembak Jitu (Sniper dengan garis bidik laser merah presisi)
- **Stage 8**: Hujan Bom Tanah Liat (Pesawat Bomber menjatuhkan bom cluster dari atas)
- **Stage 9**: Badai Cakram Berputar (Cakram Spinner bergerigi yang memantul di dinding)
- **Stage 10 (BOSS 2)**: **The Clay Goliath Zeppelin** (Balon tempur steampunk raksasa dengan meriam mortir dan hanggar peluncur drone)

### 🌌 World 3: Midnight Cyber-Clay (Stage 11 – 15)
- Langit malam berbintang (*starry nebula*), pegunungan obsidian kosmik, dan punggung bukit bercahaya neon cyan.
- **Stage 11**: Benteng Malam Cyber (Shield Cruiser berperisai energi di bagian depan)
- **Stage 12**: Medan Ranjau Terapung (Drone Mine Layer penebar ranjau berduri)
- **Stage 13**: Skuadron Elit Emas (Jet Ace akrobatik bermanuver loop-de-loop)
- **Stage 14 (EXTENDED MARATHON)**: **Serangan Total: Gauntlet** (Stage maraton panjang berisi 7 wave intensif gabungan seluruh armada musuh)
- **Stage 15 (BOSS 3)**: **The Ultimate Clay Leviathan** (Titan naga tanah liat kosmik dengan sayap plasma energi, peluncur rudal salvo, dan balok laser sonik pemusnah)

### 🪐 World 4: The Cosmic Singularity (Stage 16 – 20)
- Hamparan angkasa kosmis yang dalam dengan awan nebula magenta-cyan dan partikel bintang berkedip.
- **Stage 16**: Gerbang Ruang Kosmis (Pertempuran kecepatan tinggi melawan formasi *Stingers*, *Aces*, dan *Snipers*)
- **Stage 17**: Benteng Siber Berlapis Baja (Barikade tebal *Shield Cruisers*, ranjau apung dari *Mine Layers*, dan *Bombers*)
- **Stage 18**: Skuadron Badai Bintang (Skuadron pilot *Ace* elit dengan formasi akrobatik dan kawalan *Blimps*)
- **Stage 19**: Barikade Terakhir Singularitas (Gauntlet maraton 5 gelombang musuh intensitas tinggi)
- **Stage 20 (FINAL CLIMAX BOSS)**: **The Omega Clay Colossus** (Boss final tertangguh dengan 500 HP, sepasang Railgun ganda atas & bawah, Drone Matrix Core peluncur bala bantuan, dan Omega Singularity Core ber-Rage Overload)

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
