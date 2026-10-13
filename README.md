# DLS Bet Hub

<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>DLS BET SIM</title>

  <script src="https://cdn.tailwindcss.com"></script>

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <style>

    @import url('https://fonts.googleapis.com/css2?family=Teko:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap');

    

    body {

      font-family: 'Inter', sans-serif;

      background-color: #0b131e;

      color: #ffffff;

      -webkit-tap-highlight-color: transparent;

    }



    .font-teko {

      font-family: 'Teko', sans-serif;

    }



    /* Background Pitch Overlay */

    .pitch-bg {

      background-image: linear-gradient(rgba(11, 19, 30, 0.88), rgba(11, 19, 30, 0.94)), 

                        url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80');

      background-size: cover;

      background-position: center;

      background-attachment: fixed;

    }



    .glass-card {

      background: rgba(15, 23, 42, 0.75);

      backdrop-filter: blur(12px);

      -webkit-backdrop-filter: blur(12px);

      border: 1px solid rgba(34, 197, 94, 0.25);

    }



    .glass-card-glow {

      box-shadow: 0 0 15px rgba(34, 197, 94, 0.15);

    }



    /* Custom Ticker Animation */

    @keyframes ticker {

      0% { transform: translateY(100%); opacity: 0; }

      10% { transform: translateY(0); opacity: 1; }

      90% { transform: translateY(0); opacity: 1; }

      100% { transform: translateY(-100%); opacity: 0; }

    }



    .ticker-item {

      animation: ticker 4s infinite;

    }

  </style>

</head>

<body class="pitch-bg min-h-screen pb-24 text-slate-100 flex flex-col items-center">



  <div class="w-full max-w-md min-h-screen flex flex-col relative px-3 py-2">

    

    <!-- HEADER -->

    <header class="flex items-center justify-between py-3 px-2 mb-2">

      <div class="flex items-center gap-2">

        <div class="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">

          <i class="fa-solid fa-futbol text-lg"></i>

        </div>

        <h1 class="text-xl font-black tracking-wider font-teko uppercase text-white tracking-widest text-2xl leading-none pt-1">

          DLS BET SIM

        </h1>

      </div>

      <button id="adminToggleBtn" onclick="toggleAdminMode()" class="text-xs px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/80 text-slate-400 flex items-center gap-1.5 transition">

        <i class="fa-solid fa-user-gear"></i>

        <span id="adminStatusText">Admin: Off</span>

      </button>

    </header>



    <!-- VIEW 1: MAIN HOME (Matchday, Highlights, Setup) -->

    <main id="mainView" class="space-y-4 flex-1">



      <!-- 1. TOP SECTION — DLS HIGHLIGHTS VIDEO BANNER -->

      <section class="relative rounded-2xl overflow-hidden glass-card p-1 border-emerald-500/40 shadow-lg">

        <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">

          <!-- Video Element / Embedded Highlight -->

          <video id="dlsVideoPlayer" class="w-full h-full object-cover" autoplay loop muted playsinline poster="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80">

            <source src="https://assets.mixkit.co/videos/preview/mixkit-soccer-player-kicking-the-ball-41130-large.mp4" type="video/mp4">

            Your browser does not support video play.

          </video>



          <!-- Glass Overlay Header Title -->

          <div class="absolute top-2 left-2 z-10 px-3 py-1 rounded-lg bg-slate-900/60 backdrop-blur-md border border-white/10 flex items-center gap-2">

            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>

            <span class="text-xs font-bold tracking-wider text-slate-200">DLS HIGHLIGHTS</span>

          </div>



          <!-- Admin Quick Edit Overlay -->

          <div id="adminVideoOverlay" class="hidden absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20 p-4">

            <span class="text-xs font-semibold text-emerald-400"><i class="fa-solid fa-gear"></i> Update Video Link</span>

            <input type="text" id="adminVideoUrlInput" placeholder="Paste MP4 Video URL..." class="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500">

            <button onclick="updateVideoUrl()" class="w-full text-xs font-bold bg-emerald-500 text-slate-950 py-1.5 rounded-lg hover:bg-emerald-400">Save Highlight Video</button>

          </div>

        </div>

      </section>



      <!-- 2. MIDDLE SECTION — FEATURED MATCHDAY, COUNTDOWN & TOP WINNERS -->

      <section class="glass-card glass-card-glow rounded-2xl p-4 border-emerald-500/50 space-y-3 relative">

        

        <!-- Header -->

        <div class="flex items-center justify-between">

          <div class="flex items-center gap-1.5">

            <i class="fa-solid fa-trophy text-amber-400 text-sm"></i>

            <h2 class="text-sm font-bold tracking-wide uppercase text-slate-200">

              FEATURED MATCH: <span class="text-white font-black">Real Madrid vs Chelsea</span>

            </h2>

          </div>

        </div>



        <!-- Fixture Visual -->

        <div class="flex items-center justify-around py-2">

          <!-- Home Team -->

          <div class="flex flex-col items-center gap-1">

            <div class="w-14 h-14 rounded-full bg-slate-800/80 p-2 border border-slate-700 shadow-inner flex items-center justify-center">

              <img src="https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" alt="Real Madrid" class="w-10 h-10 object-contain">

            </div>

            <span class="text-xs font-bold text-slate-300">Real Madrid</span>

          </div>



          <!-- VS Badge & Extra Matches -->

          <div class="flex flex-col items-center">

            <span class="text-3xl font-black italic tracking-tighter text-emerald-400 drop-shadow">VS</span>

            <span class="text-[10px] font-extrabold text-slate-400 tracking-wider bg-slate-800/90 px-2 py-0.5 rounded-full border border-slate-700 mt-1">

              +8 MATCHES

            </span>

          </div>



          <!-- Away Team -->

          <div class="flex flex-col items-center gap-1">

            <div class="w-14 h-14 rounded-full bg-slate-800/80 p-2 border border-slate-700 shadow-inner flex items-center justify-center">

              <img src="https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" alt="Chelsea" class="w-10 h-10 object-contain">

            </div>

            <span class="text-xs font-bold text-slate-300">Chelsea</span>

          </div>

        </div>



        <!-- Live Sync Countdown Clock -->

        <div class="flex items-center justify-center gap-2 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800">

          <i class="fa-regular fa-clock text-slate-400 text-xs"></i>

          <span class="text-xs font-medium text-white">CLOSES IN:</span>

          <!-- RED COUNTDOWN TIMER AS REQUESTED -->

          <span id="countdownTimer" class="font-mono text-base font-black text-red-500 tracking-wider">00:14:32</span>

        </div>



        <!-- Winner Ticker Banner -->

        <div class="bg-slate-900/90 border border-slate-800 rounded-lg py-1.5 px-3 flex items-center justify-center gap-2 overflow-hidden h-8">

          <span class="text-xs">🔥</span>

          <div class="relative w-full h-full flex items-center justify-center overflow-hidden">

            <p id="winnerTickerText" class="text-xs text-slate-300 font-medium text-center transition-all duration-500">

              Top Winner: <span class="text-emerald-400 font-bold">@Alex</span> won <span class="text-amber-400 font-bold">₦15,000</span> on 12.50 Odds

            </p>

          </div>

        </div>



        <!-- High-Visibility CTA Button -->

        <button onclick="copyGameCode('RMCH8-GL-24')" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-[0.99] transition">

          <i class="fa-regular fa-copy text-base"></i>

          <span>COPY GAME CODE: RMCH8-GL-24</span>

        </button>



      </section>



      <!-- 3. LOWER SECTION — MATCHDAY SETUP / CREATOR -->

      <section class="glass-card rounded-2xl p-4 border-slate-800 space-y-3">

        

        <!-- Upload Card -->

        <div onclick="triggerFileUpload()" class="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/40 group">

          <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition">

            <i class="fa-solid fa-file-arrow-up text-xl"></i>

          </div>

          <span class="text-xs font-bold text-slate-200">Upload matches screenshot</span>

          <span class="text-[11px] text-slate-500 mt-0.5">PNG or JPG screenshot</span>

          <input type="file" id="screenshotInput" accept="image/png, image/jpeg" class="hidden" onchange="handleFileSelect(event)">

        </div>



        <!-- Uploaded Image Preview -->

        <div id="imagePreviewContainer" class="hidden relative rounded-xl overflow-hidden border border-emerald-500/40">

          <img id="imagePreview" src="" alt="Screenshot preview" class="w-full h-auto max-h-48 object-cover">

          <button onclick="clearImagePreview()" class="absolute top-2 right-2 bg-slate-950/80 text-red-400 w-7 h-7 rounded-full flex items-center justify-center border border-red-500/30">

            <i class="fa-solid fa-xmark text-xs"></i>

          </button>

        </div>



        <!-- Manual Entry Toggle Link -->

        <div class="text-center pt-1">

          <button onclick="toggleManualEntry()" class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline tracking-wide inline-flex items-center gap-1">

            <span id="manualToggleText">type in match manually &rarr;</span>

          </button>

        </div>



        <!-- Hidden Manual Entry Input Fields -->

        <div id="manualEntryFields" class="hidden space-y-3 pt-2 border-t border-slate-800">

          <div class="grid grid-cols-2 gap-2">

            <div>

              <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Home Team</label>

              <input type="text" id="homeTeamInput" placeholder="e.g. Barcelona" class="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500">

            </div>

            <div>

              <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Away Team</label>

              <input type="text" id="awayTeamInput" placeholder="e.g. Liverpool" class="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500">

            </div>

          </div>

          <button onclick="addManualMatch()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-lg border border-emerald-500/30">

            + Add Custom Fixture

          </button>

        </div>



      </section>



    </main>



    <!-- VIEW 2: DLS HUB & DOWNLOADS (APK / KIT TAB) -->

    <main id="dlsHubView" class="hidden space-y-4 flex-1">

      

      <!-- HUB LANDING VIEW -->

      <div id="hubLanding" class="space-y-4">

        <div class="flex items-center justify-between pb-1">

          <h2 class="text-lg font-black tracking-wider font-teko uppercase text-white">DLS HUB & DOWNLOADS</h2>

          <span class="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">OFFICIAL MODS</span>

        </div>



        <!-- Card 1: DLS APK Mods -->

        <div onclick="openSubView('apkView')" class="glass-card hover:border-emerald-400 rounded-2xl overflow-hidden cursor-pointer transition group relative shadow-lg">

          <div class="relative h-36 w-full overflow-hidden">

            <img id="apkCoverImg" src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80" alt="DLS APK" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">

            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

            

            <div class="absolute bottom-3 left-3 right-3">

              <span class="text-[10px] font-extrabold uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-mono">MOD APK</span>

              <h3 class="text-base font-black text-white mt-1 group-hover:text-emerald-400 transition">Dream League Soccer APK Mods</h3>

              <p class="text-[11px] text-slate-300">Tap to view available APK mods & direct downloads</p>

            </div>

          </div>



          <!-- Admin Edit Cover -->

          <button onclick="event.stopPropagation(); editHubCover('apk')" class="admin-only hidden absolute top-2 right-2 bg-slate-900/90 text-xs px-2.5 py-1 rounded-md border border-slate-700 text-amber-400 font-bold">

            <i class="fa-solid fa-pen"></i> Edit Cover

          </button>

        </div>



        <!-- Card 2: DLS Kits & Logos -->

        <div onclick="openSubView('kitView')" class="glass-card hover:border-emerald-400 rounded-2xl overflow-hidden cursor-pointer transition group relative shadow-lg">

          <div class="relative h-36 w-full overflow-hidden">

            <img id="kitCoverImg" src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80" alt="DLS Kits" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">

            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>



            <div class="absolute bottom-3 left-3 right-3">

              <span class="text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-mono">KITS & CRESTS</span>

              <h3 class="text-base font-black text-white mt-1 group-hover:text-emerald-400 transition">Dream League Soccer Kit / Logo</h3>

              <p class="text-[11px] text-slate-300">Tap to copy official club jersey & logo codes</p>

            </div>

          </div>



          <!-- Admin Edit Cover -->

          <button onclick="event.stopPropagation(); editHubCover('kit')" class="admin-only hidden absolute top-2 right-2 bg-slate-900/90 text-xs px-2.5 py-1 rounded-md border border-slate-700 text-amber-400 font-bold">

            <i class="fa-solid fa-pen"></i> Edit Cover

          </button>

        </div>

      </div>



      <!-- SUB-VIEW 1: APK MODS GALLERY -->

      <div id="apkSubView" class="hidden space-y-3">

        <button onclick="closeSubView()" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mb-1">

          <i class="fa-solid fa-arrow-left"></i> Back to DLS Hub

        </button>



        <div class="flex items-center justify-between">

          <h3 class="text-base font-black text-white">DLS MOD APK GALLERY</h3>

          <span class="text-xs text-slate-400">Direct High-Speed Links</span>

        </div>



        <!-- APK Item List Container -->

        <div id="apkListContainer" class="space-y-3">

          <!-- Rendered dynamically -->

        </div>



        <!-- Admin Add New Button -->

        <button onclick="openAddApkModal()" class="admin-only hidden w-full py-2.5 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">

          <i class="fa-solid fa-plus"></i> + Add New APK Mod

        </button>

      </div>



      <!-- SUB-VIEW 2: KITS & LOGOS GALLERY -->

      <div id="kitSubView" class="hidden space-y-3">

        <button onclick="closeSubView()" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mb-1">

          <i class="fa-solid fa-arrow-left"></i> Back to DLS Hub

        </button>



        <div class="flex items-center justify-between">

          <h3 class="text-base font-black text-white">DLS KITS & LOGO CODES</h3>

          <span class="text-xs text-slate-400">2025/2026 Season</span>

        </div>



        <!-- Kit Item List Container -->

        <div id="kitListContainer" class="space-y-3">

          <!-- Rendered dynamically -->

        </div>



        <!-- Admin Add New Button -->

        <button onclick="openAddKitModal()" class="admin-only hidden w-full py-2.5 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">

          <i class="fa-solid fa-plus"></i> + Add New Kit & Logo

        </button>

      </div>



    </main>



    <!-- OTHER TAB PLACEHOLDERS -->

    <main id="placeholderView" class="hidden flex-1 flex flex-col items-center justify-center text-center py-16 space-y-3 glass-card rounded-2xl">

      <i id="placeholderIcon" class="fa-solid fa-ticket text-4xl text-emerald-400/60"></i>

      <h2 id="placeholderTitle" class="text-lg font-bold text-white">Bet Slip Section</h2>

      <p class="text-xs text-slate-400 max-w-xs">Selected match selections and active betting slips will appear here.</p>

    </main>



    <!-- 4. BOTTOM NAVIGATION -->

    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-2">

      <div class="max-w-md mx-auto grid grid-cols-5 gap-1">

        

        <!-- Tab 1: Matchday -->

        <button onclick="switchTab('matchday')" id="nav-matchday" class="flex flex-col items-center justify-center py-1 px-1 text-emerald-400 transition">

          <i class="fa-solid fa-trophy text-lg mb-0.5"></i>

          <span class="text-[10px] font-bold tracking-tight">Matchday</span>

        </button>



        <!-- Tab 2: Bet Slip -->

        <button onclick="switchTab('betslip')" id="nav-betslip" class="flex flex-col items-center justify-center py-1 px-1 text-slate-400 hover:text-slate-200 transition">

          <i class="fa-solid fa-money-bill-wave text-lg mb-0.5"></i>

          <span class="text-[10px] font-bold tracking-tight">Bet Slip</span>

        </button>



        <!-- Tab 3: Game Code -->

        <button onclick="switchTab('gamecode')" id="nav-gamecode" class="flex flex-col items-center justify-center py-1 px-1 text-slate-400 hover:text-slate-200 transition">

          <i class="fa-solid fa-key text-lg mb-0.5"></i>

          <span class="text-[10px] font-bold tracking-tight">Game Code</span>

        </button>



        <!-- Tab 4: DLS ⚽/👕 -->

        <button onclick="switchTab('dlshub')" id="nav-dlshub" class="flex flex-col items-center justify-center py-1 px-1 text-slate-400 hover:text-slate-200 transition">

          <i class="fa-solid fa-shirt text-lg mb-0.5"></i>

          <span class="text-[10px] font-bold tracking-tight">DLS ⚽/👕</span>

        </button>



        <!-- Tab 5: History -->

        <button onclick="switchTab('history')" id="nav-history" class="flex flex-col items-center justify-center py-1 px-1 text-slate-400 hover:text-slate-200 transition">

          <i class="fa-solid fa-clock-rotate-left text-lg mb-0.5"></i>

          <span class="text-[10px] font-bold tracking-tight">History</span>

        </button>



      </div>

    </nav>



    <!-- TOAST NOTIFICATION -->

    <div id="toast" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl opacity-0 pointer-events-none transition-all

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/768acdfa-ac0c-44c7-9ad5-66d17c8ec54a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
