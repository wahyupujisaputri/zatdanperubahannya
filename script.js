// --- STATE APLIKASI ---
let activeMeeting = null;
let currentStep = 0;       // 0 sampai 14 (Total 15 langkah)
let activeSubStep = 1;     // 1 sampai 4 (Misi Eksplorasi)
let userStars = 0;
let maxStepReached = 0;
let userAnswers = {};
const studentNamesList = [
    "GURU",
    "AHMAD ZAKI RAIHAN GUCHI",
    "AHSAN HUSAINI AL ISLAMY",
    "AL JAVAN WIRANANTA RUDHIRA",
    "ALBERT VERLYO",
    "ALDEBARAN RAFIF AL AYYUBI",
    "ARKAN XAQUIL ATHALLAH",
    "AYDIN KHALFANI",
    "AYRA LITUHAYU NAVISA",
    "BRIANNA RAYA ARDAFFI",
    "CALYA NABIGHAH PASCA",
    "DAVENDRA ANANTA PRASETYA",
    "DENANDRA IQBAL ALVANO RASYA",
    "FLAVIA SEKAR AQEELA ADITYA",
    "GHINA MUFIDAH DWIHANA",
    "GWEN SYAREEFA ANINDITA HARJANTO",
    "KHANZA MAHIRA GANA",
    "KRISTOFORUS TRALOWA RAKYANJALU",
    "MARIA KANA SATRIO",
    "MAYYASA KALEA",
    "MUHAMMAD ZAFRAN ALIFANDRA",
    "NADINE KIRANA MAHARANI",
    "NAFIS ARFA AKMAL",
    "NARARYA ABQARY KUSUMA",
    "NATHIFA WIJARENI",
    "PRAMA MADA OZORA",
    "RAPHAEL AIDEN ROMMEL BANCIN KRISTANTO",
    "REYGAN KHALFANI PUSOKO",
    "SHAVIRA ARDINTA ZAHIDA",
    "SYAFIQ RAFI'UL HIMAM",
    "TRISTAN SAKTYANUGRA MASJHOER",
    "VERONIKA DEWA PURNAMA",
    "ZAHEEN ZAIMA REIZA"
];
let studentName = "";
let onlineClassroomData = [];
let pretestAnalysis = [];
let posttestAnalysis = [];
let posttestCorrectCount = 0;
let activeParticles = [];
let particleInterval = null;
let activeAnimationId = null;
let missionInterval = null;

// --- LEADERBOARD & KOMPETISI STATE ---
let compActive = false;
let compPlayerScore = 0;
let compTimerVal = 20; // 20 detik per soal
let compTimerInterval = null;
let compBots = [
    { name: "Siti", score: 0, accuracy: 0.85, thinkTime: 0, hasAnswered: false },
    { name: "Andi", score: 0, accuracy: 0.72, thinkTime: 0, hasAnswered: false },
    { name: "Roni", score: 0, accuracy: 0.60, thinkTime: 0, hasAnswered: false },
    { name: "Budi", score: 0, accuracy: 0.78, thinkTime: 0, hasAnswered: false }
];

function initializeCompBots() {
    const availableNames = studentNamesList.filter(name => name !== studentName);
    const shuffled = [...availableNames].sort(() => Math.random() - 0.5);
    const selectedNames = shuffled.slice(0, 4);

    compBots = [
        { name: selectedNames[0] || "Siti", score: 0, accuracy: 0.85, thinkTime: 0, hasAnswered: false },
        { name: selectedNames[1] || "Andi", score: 0, accuracy: 0.72, thinkTime: 0, hasAnswered: false },
        { name: selectedNames[2] || "Roni", score: 0, accuracy: 0.60, thinkTime: 0, hasAnswered: false },
        { name: selectedNames[3] || "Budi", score: 0, accuracy: 0.78, thinkTime: 0, hasAnswered: false }
    ];
}
let activeLeaderboardTab = "p1";

// --- AUDIO SYNTHESIZER UTILITY (Web Audio API) ---
let audioCtx = null;

function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    } catch (e) {
        console.warn("AudioContext not supported or blocked by security policy", e);
        audioCtx = null;
    }
}

const SoundEffects = {
    playClick() {
        initAudio();
        if (!audioCtx) return;
        
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    },
    
    playCorrect() {
        initAudio();
        if (!audioCtx) return;
        
        let t = audioCtx.currentTime;
        
        let playNote = (freq, delay, duration) => {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, t + delay);
            
            gain.gain.setValueAtTime(0.15, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, t + delay + duration);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(t + delay);
            osc.stop(t + delay + duration);
        };
        
        playNote(523.25, 0, 0.12); // C5
        playNote(659.25, 0.06, 0.2); // E5
    },
    
    playWrong() {
        initAudio();
        if (!audioCtx) return;
        
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    },
    
    playStar() {
        initAudio();
        if (!audioCtx) return;
        
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.22);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.22);
    },
    
    playFanfare() {
        initAudio();
        if (!audioCtx) return;
        
        let t = audioCtx.currentTime;
        let notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        let duration = 0.18;
        
        notes.forEach((freq, idx) => {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, t + idx * 0.12);
            
            let noteLen = idx === 3 ? 0.5 : duration;
            gain.gain.setValueAtTime(0.15, t + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.12 + noteLen);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(t + idx * 0.12);
            osc.stop(t + idx * 0.12 + noteLen);
        });
    }
};

// --- CONFIGURASI UTAMA MATERI PERTEMUAN 1-4 (SOAL CERITA LITERASI & NUMERASI) ---
const meetingsConfig = {
    p1: {
        title: "Pertemuan 1: Wujud Zat & Model Partikel",
        badgeName: "Ahli Partikel Level 1",
        badgeEmoji: "🔬",
        pretest: [
            {
                q: "Raka memasukkan batu ke dalam gelas yang berisi air. Setelah itu, ia menuangkan air ke dalam botol yang berbeda bentuk. Ia mengamati bahwa batu tetap memiliki bentuk yang sama, sedangkan bentuk air mengikuti wadahnya.\n\nBerdasarkan percobaan tersebut, kesimpulan yang paling tepat adalah ....",
                a: [
                    "batu dan air memiliki volume yang selalu berubah",
                    "batu memiliki partikel yang lebih bebas bergerak daripada air",
                    "partikel penyusun batu lebih terikat dibandingkan partikel penyusun air",
                    "partikel air tidak memiliki gaya tarik-menarik"
                ],
                c: 2
            },
            {
                q: "Tiga kelompok siswa mengamati partikel suatu zat.\n\nZat P: partikel sangat rapat dan hanya bergetar di tempat\nZat Q: partikel berdekatan tetapi dapat berpindah\nZat R: partikel berjauhan dan bergerak bebas\n\nJika ketiga zat dimasukkan ke dalam wadah tertutup, prediksi yang paling tepat adalah ....",
                a: [
                    "P dan Q mempertahankan bentuk, sedangkan R mengikuti bentuk wadah",
                    "P mempertahankan bentuk dan volume, Q mempertahankan volume, sedangkan R mengisi seluruh ruang wadah",
                    "P, Q, dan R semuanya mengikuti bentuk wadah",
                    "Q mempertahankan bentuk dan R mempertahankan volume"
                ],
                c: 1
            },
            {
                q: "Sebuah balon yang telah ditiup kemudian ditekan dengan tangan. Meskipun volumenya mengecil, balon masih dapat mengembang kembali ketika tekanan dilepaskan.\n\nPeristiwa tersebut menunjukkan bahwa ....",
                a: [
                    "partikel gas tidak memiliki massa",
                    "partikel gas dapat dimampatkan karena memiliki jarak antarpartikel",
                    "partikel gas tidak bergerak",
                    "gas tidak menempati ruang"
                ],
                c: 1
            },
            {
                q: "Dua buah gelas berisi air dengan volume yang sama. Gelas A diletakkan di ruangan bersuhu 20°C, sedangkan gelas B di ruangan bersuhu 35°C. Beberapa jam kemudian, volume air dalam gelas B lebih sedikit.\n\nPenjelasan yang paling tepat adalah ....",
                a: [
                    "partikel air pada gelas B berubah menjadi partikel baru",
                    "partikel air pada gelas B bergerak lebih cepat sehingga lebih banyak meninggalkan permukaan",
                    "air pada gelas A tidak memiliki energi",
                    "suhu tidak memengaruhi gerak partikel zat"
                ],
                c: 1
            },
            {
                q: "Seorang siswa menyemprotkan parfum di sudut kelas. Beberapa menit kemudian, siswa yang duduk cukup jauh dari sumber parfum dapat mencium aromanya.\n\nPeristiwa tersebut terjadi karena ....",
                a: [
                    "partikel parfum bergerak dari daerah berkonsentrasi tinggi menuju daerah berkonsentrasi lebih rendah",
                    "udara menarik parfum secara langsung menuju hidung",
                    "partikel parfum berubah menjadi oksigen",
                    "hidung menghasilkan zat yang menarik parfum"
                ],
                c: 0
            },
            {
                q: "Perhatikan dua kondisi berikut.\n\nKondisi 1: Parfum disemprotkan di ruangan yang tenang.\nKondisi 2: Parfum disemprotkan di ruangan yang memiliki kipas angin menyala.\n\nAroma parfum pada kondisi 2 cenderung lebih cepat tercium di bagian ruangan yang jauh dari sumber.\n\nAlasan yang paling tepat adalah ....",
                a: [
                    "kipas angin mengubah parfum menjadi gas baru",
                    "aliran udara membantu perpindahan partikel parfum",
                    "kipas angin meningkatkan massa partikel parfum",
                    "partikel parfum berhenti berdifusi ketika terkena udara"
                ],
                c: 1
            },
            {
                q: "Ketika ibu membuka tutup botol minyak kayu putih, seseorang yang berada di dekatnya dapat mencium aroma minyak tersebut. Agar aroma dapat terdeteksi oleh tubuh, urutan proses yang paling tepat adalah ....",
                a: [
                    "aroma → hidung → udara → reseptor penciuman",
                    "molekul aroma → udara → rongga hidung → reseptor penciuman → impuls saraf → otak",
                    "udara → otak → molekul aroma → hidung",
                    "molekul aroma → paru-paru → lambung → otak"
                ],
                c: 1
            },
            {
                q: "Dua siswa melakukan percobaan difusi menggunakan teh celup.\n\nGelas A berisi air dingin.\nGelas B berisi air panas.\n\nTeh celup dimasukkan tanpa diaduk. Warna air pada gelas B menyebar lebih cepat.\n\nKesimpulan yang paling sesuai dengan teori partikel adalah ....",
                a: [
                    "partikel air panas berukuran lebih kecil",
                    "suhu yang lebih tinggi menyebabkan gerak partikel lebih cepat",
                    "air panas memiliki massa lebih besar",
                    "partikel teh hanya dapat bergerak dalam air panas"
                ],
                c: 1
            },
            {
                q: "Seorang siswa mengatakan, \"Gas tidak mempunyai volume karena gas tidak terlihat.\"\n\nTanggapan yang paling tepat untuk membantah pernyataan tersebut adalah ....",
                a: [
                    "gas memiliki warna sehingga dapat dilihat",
                    "gas memiliki volume karena menempati ruang, meskipun tidak selalu dapat dilihat",
                    "gas tidak memiliki volume tetapi memiliki massa",
                    "gas hanya memiliki volume jika berada di dalam air"
                ],
                c: 1
            },
            {
                q: "Ketika seseorang mencium aroma makanan yang sedang dimasak dari ruangan lain, molekul aroma harus bergerak melalui udara hingga mencapai hidung.\n\nJika semua partikel udara tiba-tiba berhenti bergerak, kemungkinan yang paling tepat adalah ....",
                a: [
                    "aroma akan lebih cepat mencapai hidung",
                    "aroma tetap mencapai hidung dengan kecepatan yang sama",
                    "penyebaran aroma melalui difusi akan sangat terhambat",
                    "molekul aroma langsung berubah menjadi cairan"
                ],
                c: 2
            }
        ],
        posttest: [],
        latihan: [
            { q: "Budi memiliki kubus besi bermassa 2 kg and volume 0,001 m³. Jika kubus tersebut diletakkan di lantai kelas atau dimasukkan ke dalam ember kosong, volume kubus besi tersebut tetap 0,001 m³. Mengapa zat padat mempertahankan volumenya?", a: ["Partikel zat padat bebas mengalir keluar wadah", "Partikel zat padat tersusun sangat rapat and teratur dengan gaya tarik kuat", "Partikel zat padat menyusut", "Kubus besi mencair di lantai"], c: 1 },
            { q: "Guru IPA membagikan data hasil percobaan menekan suntikan berisi udara, air, dan pasir. Hasilnya: udara dapat ditekan 8 ml, air ditekan 0,5 ml, pasir ditekan 0 ml. Berdasarkan data numerasi ini, wujud zat manakah yang kompresibilitasnya paling tinggi?", a: ["Pasir (Padat)", "Air (Cair)", "Udara (Gas)", "Semua sama"], c: 2 },
            { q: "Siti meneteskan 1 tetes sirup merah ke dalam segelas air bening. Setelah 5 menit, seluruh air berubah menjadi kemerahan secara merata tanpa diaduk. Proses penyebaran partikel sirup ini dinamakan...", a: ["Difusi zat cair", "Kondensasi", "Membeku", "Menyublim"], c: 0 },
            { q: "Mengapa aroma kopi hangat ayah tercium sampai ke teras rumah yang berjarak 10 meter?", a: ["Partikel kopi ditarik gravitasi bumi", "Partikel gas aroma kopi menyebar bebas secara difusi di udara", "Partikel kopi berwujud padat keras", "Aroma kopi didorong kipas angin"], c: 1 },
            { q: "Budi mempelajari data indera penciuman: Manusia memiliki 350 gen pembau, anjing 1100 gen, gajah Afrika 2000 gen. Berapa kali lipat jumlah gen pembau gajah Afrika dibandingkan dengan gen pembau manusia?", a: ["Sekitar 2 kali lipat", "Sekitar 5,7 kali lipat", "Sekitar 10 kali lipat", "Sekitar 20 kali lipat"], c: 1 },
            { q: "Zat padat memiliki partikel yang hanya bergetar karena gaya tarik antarpartikelnya sangat kuat.", a: ["Benar", "Salah"], c: 0 },
            { q: "Difusi partikel gas (seperti parfum) berlangsung lebih lambat dibandingkan difusi zat cair (seperti tinta di air).", a: ["Benar", "Salah"], c: 1 },
            { q: "Suntikan yang berisi udara (gas) tidak dapat ditekan sama sekali karena partikelnya keras.", a: ["Benar", "Salah"], c: 1 },
            { q: "Berdasarkan Gambar 2.1 buku, wortel dan lilin digolongkan sebagai wujud zat padat.", a: ["Benar", "Salah"], c: 0 },
            { q: "Setiap butiran gula pasir memiliki bentuk tetap, sehingga gula pasir termasuk zat padat.", a: ["Benar", "Salah"], c: 0 }
        ]
    },
    p2: {
        title: "Pertemuan 2: Perubahan Wujud Zat, Titik Didih & Leleh",
        badgeName: "Master Perubahan & Suhu Zat",
        badgeEmoji: "🔥",
        pretest: [
            {
                q: "Es batu diletakkan di atas meja. Setelah beberapa saat, es berubah menjadi air. Jika air tersebut terus dibiarkan, lama-kelamaan jumlahnya berkurang.\n\nPerubahan yang terjadi secara berurutan adalah ....",
                a: [
                    "membeku kemudian mengembun",
                    "mencair kemudian menguap",
                    "menyublim kemudian mencair",
                    "menguap kemudian membeku"
                ],
                c: 1
            },
            {
                q: "Saat memasak air, seorang siswa melihat adanya titik-titik air pada bagian bawah tutup panci. Ia menyimpulkan bahwa air dari panci berubah menjadi air baru pada tutup panci.\n\nAnalisis yang paling tepat terhadap kesimpulan tersebut adalah ....",
                a: [
                    "benar, karena air dapat terbentuk dari tutup panci",
                    "benar, karena air pada panci hilang",
                    "kurang tepat, karena uap air mengalami pendinginan dan mengembun menjadi titik-titik air",
                    "salah, karena air tidak dapat berubah menjadi gas"
                ],
                c: 2
            },
            {
                q: "Pada pagi hari, bagian luar gelas yang berisi es menjadi basah. Seorang siswa mengatakan bahwa air tersebut berasal dari es yang merembes melalui dinding gelas.\n\nBerdasarkan konsep perubahan wujud, pernyataan yang lebih tepat adalah ....",
                a: [
                    "air berasal dari uap air di udara yang mengalami pengembunan",
                    "air berasal dari es yang menembus dinding gelas",
                    "air berasal dari gelas yang mencair",
                    "air terbentuk karena udara berubah menjadi es"
                ],
                c: 0
            },
            {
                q: "Pakaian yang dijemur di bawah sinar matahari biasanya lebih cepat kering dibandingkan pakaian yang dijemur di tempat teduh.\n\nFaktor yang paling berpengaruh terhadap peristiwa tersebut adalah ....",
                a: [
                    "cahaya matahari mengubah air menjadi zat lain",
                    "peningkatan suhu mempercepat penguapan air",
                    "pakaian di bawah matahari memiliki massa lebih kecil",
                    "air hanya dapat menguap jika terkena cahaya"
                ],
                c: 1
            },
            {
                q: "Seorang siswa ingin mempercepat proses pengeringan pakaian basah. Ia memiliki tiga pilihan:\n\n1) melipat pakaian menjadi lebih kecil,\n2) membentangkan pakaian,\n3) menyimpan pakaian dalam lemari tertutup.\n\nPilihan yang paling efektif adalah ....",
                a: [
                    "1, karena air terperangkap di dalam pakaian",
                    "2, karena memperluas permukaan yang terkena udara",
                    "3, karena udara dalam lemari mempercepat penguapan",
                    "semua sama efektif"
                ],
                c: 1
            },
            {
                q: "Kamper yang diletakkan di dalam lemari lama-kelamaan semakin kecil hingga habis tanpa terlihat menjadi cair terlebih dahulu.\n\nPerubahan wujud yang terjadi adalah ....",
                a: [
                    "mencair",
                    "menguap",
                    "menyublim",
                    "mengembun"
                ],
                c: 2
            },
            {
                q: "Di daerah pegunungan, seseorang dapat melihat embun pada daun pada pagi hari. Pada malam sebelumnya, udara menjadi semakin dingin.\n\nHubungan yang paling tepat antara suhu and pembentukan embun adalah ....",
                a: [
                    "udara yang mendingin menyebabkan uap air kehilangan energi dan mengembun",
                    "udara yang mendingin menyebabkan air menguap lebih cepat",
                    "daun menghasilkan air ketika suhu turun",
                    "uap air berubah langsung menjadi es pada semua kondisi"
                ],
                c: 0
            },
            {
                q: "Seorang siswa memasukkan air ke dalam freezer. Beberapa jam kemudian, air berubah menjadi es.\n\nJika proses tersebut ditinjau berdasarkan gerak partikel, maka ....",
                a: [
                    "partikel air memperoleh energi sehingga bergerak semakin bebas",
                    "partikel air kehilangan energi sehingga geraknya menjadi lebih terbatas",
                    "partikel air berubah menjadi partikel baru",
                    "jumlah partikel air bertambah"
                ],
                c: 1
            },
            {
                q: "Pada pembuatan garam, air laut dibiarkan di tambak hingga sebagian besar airnya hilang dan tersisa kristal garam.\n\nPerubahan wujud yang paling berperan dalam proses tersebut adalah ....",
                a: [
                    "pembekuan",
                    "pengembunan",
                    "penguapan",
                    "penyubliman"
                ],
                c: 2
            },
            {
                q: "Dua es batu memiliki ukuran sama. Es A diletakkan di ruangan bersuhu 30°C, sedangkan Es B diletakkan di ruangan bersuhu 15°C. Es A mencair lebih cepat.\n\nKesimpulan yang paling tepat adalah ....",
                a: [
                    "suhu lingkungan yang lebih tinggi meningkatkan perpindahan energi ke es",
                    "es A memiliki partikel yang lebih sedikit",
                    "suhu tidak memengaruhi pencairan",
                    "es B memiliki massa yang selalu lebih besar"
                ],
                c: 0
            }
        ],
        posttest: [],
        latihan: [
            { q: "Mengapa pakaian basah yang dijemur di bawah terik matahari dapat mengering?", a: ["Air meresap masuk serat kain lalu hilang", "Air di kain menyerap panas matahari lalu menguap menjadi gas uap air", "Air membeku jadi es padat", "Serat kain memakan partikel air"], c: 1 },
            { q: "Kapur barus menyublim karena menyerap energi panas dari udara sekitar.", a: ["Benar", "Salah"], c: 0 },
            { q: "Proses mengkristal adalah perubahan wujud zat dari cair menjadi padat.", a: ["Benar", "Salah"], c: 1 },
            { q: "Membeku terjadi dengan cara melepaskan energi panas ke lingkungan dingin.", a: ["Benar", "Salah"], c: 0 },
            { q: "Menguap hanya terjadi pada suhu titik didih zat cair saja.", a: ["Benar", "Salah"], c: 1 },
            { q: "Mendidih ditandai dengan munculnya gelembung gas di seluruh bagian cairan air.", a: ["Benar", "Salah"], c: 0 },
            { q: "Es kering (dry ice) menyublim melepaskan energi panas ke lingkungan sekitar.", a: ["Benar", "Salah"], c: 1 },
            { q: "Saat mengembun, uap air gas melepaskan energi panas dan berubah wujud menjadi cair.", a: ["Benar", "Salah"], c: 0 },
            { q: "Perubahan wujud zat padat menjadi cair disebut membeku.", a: ["Benar", "Salah"], c: 1 },
            { q: "Ketika air mendidih di panci, seluruh air suhunya tertahan konstan di 100°C.", a: ["Benar", "Salah"], c: 0 }
        ]
    },
    p3: {
        title: "Pertemuan 3: Perubahan Fisika, Kimia & Siklus Air",
        badgeName: "Ahli Perubahan Zat",
        badgeEmoji: "💧",
        pretest: [
            {
                q: "Perhatikan beberapa peristiwa berikut.\n\n1) Kertas dipotong menjadi beberapa bagian.\n2) Kayu dibakar menjadi abu.\n3) Es mencair menjadi air.\n4) Besi berkarat.\n\nPeristiwa yang menunjukkan perubahan kimia adalah ....",
                a: [
                    "1 dan 3",
                    "2 dan 4",
                    "1 dan 2",
                    "3 dan 4"
                ],
                c: 1
            },
            {
                q: "Siti mencampurkan gula ke dalam air hingga gula tidak terlihat. Ia mengatakan bahwa gula telah mengalami perubahan kimia karena bentuk gula berubah.\n\nPenilaian yang paling tepat terhadap pernyataan Siti adalah ....",
                a: [
                    "benar, karena gula tidak dapat dipisahkan lagi",
                    "benar, karena gula menghasilkan zat baru",
                    "kurang tepat, karena gula larut dan masih dapat diperoleh kembali melalui penguapan air",
                    "salah, karena gula tidak mengalami perubahan apa pun"
                ],
                c: 2
            },
            {
                q: "Sebuah apel yang telah dipotong dibiarkan di udara terbuka. Beberapa waktu kemudian, permukaan apel berubah menjadi kecokelatan.\n\nPeristiwa tersebut lebih tepat dikategorikan sebagai perubahan kimia karena ....",
                a: [
                    "ukuran apel berubah",
                    "terbentuk sifat atau zat baru akibat reaksi dengan oksigen",
                    "apel kehilangan air",
                    "apel menjadi lebih dingin"
                ],
                c: 1
            },
            {
                q: "Seorang siswa membakar selembar kertas. Setelah terbakar, tersisa abu dan asap. Ketika abu tersebut dicampur dengan air, kertas tidak dapat kembali seperti semula.\n\nBerdasarkan ciri tersebut, pembakaran kertas merupakan ....",
                a: [
                    "perubahan fisika karena hanya mengubah bentuk",
                    "perubahan fisika karena kertas tetap menjadi kertas",
                    "perubahan kimia karena menghasilkan zat baru dan sulit dikembalikan",
                    "perubahan wujud karena kertas berubah menjadi gas"
                ],
                c: 2
            },
            {
                q: "Perhatikan kegiatan berikut:\n\nA: lilin dipotong menjadi beberapa bagian\nB: lilin dinyalakan hingga terbakar\nC: es batu dibiarkan mencair\nD: air dibekukan menjadi es\n\nKegiatan yang menghasilkan zat baru adalah ....",
                a: [
                    "A dan C",
                    "B saja",
                    "B dan D",
                    "A, C, dan D"
                ],
                c: 1
            },
            {
                q: "Ketika cuka dicampurkan dengan soda kue, muncul banyak gelembung gas. Suhu campuran juga mengalami perubahan.\n\nBerdasarkan pengamatan tersebut, alasan paling kuat bahwa terjadi perubahan kimia adalah ....",
                a: [
                    "kedua zat bercampur",
                    "volume campuran berubah",
                    "terbentuk gas dan terjadi perubahan energi yang menunjukkan terbentuknya zat baru",
                    "warna wadah berubah"
                ],
                c: 2
            },
            {
                q: "Seorang siswa mengamati proses berikut:\n\nAir laut → menguap → awan → hujan → sungai → laut\n\nJika suhu lingkungan meningkat secara signifikan, perubahan yang paling mungkin terjadi pada bagian awal siklus tersebut adalah ....",
                a: [
                    "penguapan air cenderung meningkat",
                    "air laut langsung membeku",
                    "pembentukan awan berhenti sepenuhnya",
                    "air hujan tidak dapat kembali ke laut"
                ],
                c: 0
            },
            {
                q: "Hujan turun di daerah pegunungan. Sebagian air mengalir melalui sungai menuju laut, sedangkan sebagian lainnya meresap ke dalam tanah.\n\nPeristiwa tersebut menunjukkan bahwa ....",
                a: [
                    "semua air hujan langsung menguap",
                    "air hanya bergerak melalui sungai",
                    "air dapat berpindah melalui berbagai proses dalam siklus air",
                    "air tanah tidak berhubungan dengan siklus air"
                ],
                c: 2
            },
            {
                q: "Pembangunan gedung dan jalan beton di kota menyebabkan semakin sedikit tanah yang dapat menyerap air hujan. Saat hujan deras, wilayah tersebut lebih mudah mengalami banjir.\n\nHubungan yang paling tepat dengan siklus air adalah ....",
                a: [
                    "permukaan kedap air mengurangi infiltrasi sehingga lebih banyak air menjadi aliran permukaan",
                    "beton meningkatkan infiltrasi air ke tanah",
                    "pembangunan gedung menghentikan proses evaporasi",
                    "beton menyebabkan semua air hujan langsung menguap"
                ],
                c: 0
            },
            {
                q: "Sebuah daerah mengalami penebangan hutan secara besar-besaran. Beberapa tahun kemudian, masyarakat mengamati bahwa saat hujan deras, banjir lebih mudah terjadi dan setelah hujan tanah menjadi lebih cepat kering.\n\nKesimpulan yang paling logis adalah ....",
                a: [
                    "pohon tidak memiliki hubungan dengan siklus air",
                    "berkurangnya vegetasi dapat mengurangi penyerapan air ke tanah dan memengaruhi keseimbangan air di lingkungan",
                    "pohon menyebabkan semua air hujan tertahan di daun",
                    "penebangan hutan menghentikan siklus air secara keseluruhan"
                ],
                c: 1
            }
        ],
        posttest: [],
        latihan: [
            { q: "Kelompok peristiwa manakah yang semuanya tergolong perubahan kimia?", a: ["Beras ditumbuk menjadi tepung terigu, es mencair", "Gula dilarutkan ke dalam teh, air menguap", "Menyalakan kembang api, besi berkarat, and pembusukan nasi", "Kaca jendela pecah, lilin meleleh"], c: 2 },
            { q: "Paku besi berkarat di udara lembap menghasilkan karat besi. Karat besi termasuk perubahan kimia karena...", a: ["Besi mengecil ukurannya", "Terbentuk zat baru karat besi yang berbeda sifatnya dengan besi semula", "Besi mencair menjadi air", "Hanya bentuk luarnya saja yang berubah"], c: 1 },
            { q: "Dalam siklus air, proses meresapnya air hujan ke dalam pori-pori tanah disebut...", a: ["Evaporasi", "Kondensasi", "Infiltrasi", "Limpasan"], c: 2 },
            { q: "Manakah kelompok di bawah ini yang merupakan 4 tanda terjadinya reaksi kimia?", a: ["Mencair, Membeku, Menguap, Menyublim", "Warna berubah, Gas terbentuk, Endapan timbul, Energi cahaya/panas dilepaskan", "Larut, Mengalir, Menyusut, Memuai", "Suhu tetap, Massa berubah, Bentuk tetap, Rapat"], c: 1 },
            { q: "Es krim meleleh di suhu ruangan adalah perubahan fisika karena tidak terbentuk zat baru and dapat dibekukan kembali.", a: ["Benar", "Salah"], c: 0 },
            { q: "Sumbu lilin yang terbakar menjadi hitam arang adalah perubahan fisika.", a: ["Benar", "Salah"], c: 1 },
            { q: "Persamaan reaksi kimia ditulis dengan format: Pereaksi ➔ Produk.", a: ["Benar", "Salah"], c: 0 },
            { q: "Air laut menguap karena panas matahari adalah awal dari siklus air.", a: ["Benar", "Salah"], c: 0 },
            { q: "Terbentuknya gelembung gas merupakan salah satu tanda reaksi kimia.", a: ["Benar", "Salah"], c: 0 },
            { q: "Mencairnya mentega saat dipanaskan adalah perubahan kimia.", a: ["Benar", "Salah"], c: 1 }
        ]
    },
    p4: {
        title: "Pertemuan 4: Kerapatan Zat (Massa Jenis)",
        badgeName: "Ahli Kerapatan & Archimedes",
        badgeEmoji: "🏆",
        pretest: [
            {
                q: "Dua benda memiliki ukuran yang sama. Benda A memiliki massa 80 gram, sedangkan benda B memiliki massa 120 gram.\n\nBerdasarkan informasi tersebut, pernyataan yang paling tepat adalah ....",
                a: [
                    "benda A memiliki kerapatan lebih besar karena massanya lebih kecil",
                    "benda B memiliki kerapatan lebih besar karena massanya lebih besar pada volume yang sama",
                    "kedua benda memiliki kerapatan yang sama karena ukurannya sama",
                    "kerapatan tidak dipengaruhi oleh massa"
                ],
                c: 1
            },
            {
                q: "Sebuah benda memiliki massa 240 gram and volume 80 cm³. Benda tersebut dimasukkan ke dalam cairan yang memiliki massa jenis 2 g/cm³.\n\nApa yang kemungkinan terjadi?",
                a: [
                    "benda mengapung karena massa jenis benda lebih kecil daripada cairan",
                    "benda melayang karena massa jenis benda sama dengan cairan",
                    "benda tenggelam karena massa jenis benda lebih besar daripada cairan",
                    "benda tidak dapat dimasukkan ke dalam cairan"
                ],
                c: 2
            },
            {
                q: "Perhatikan data berikut.\n\nBenda | Massa | Volume\nP | 100 g | 50 cm³\nQ | 120 g | 80 cm³\nR | 150 g | 100 cm³\nS | 200 g | 50 cm³\n\nBenda yang memiliki kerapatan paling besar adalah ....",
                a: [
                    "P",
                    "Q",
                    "R",
                    "S"
                ],
                c: 3
            },
            {
                q: "Dina memiliki sebuah balok kayu. Ketika balok tersebut dimasukkan ke dalam air, balok mengapung dengan sebagian volumenya berada di atas permukaan air.\n\nKesimpulan yang paling tepat adalah ....",
                a: [
                    "massa jenis kayu lebih besar daripada air",
                    "massa jenis kayu sama dengan air",
                    "massa jenis rata-rata kayu lebih kecil daripada air",
                    "kayu tidak memiliki massa jenis"
                ],
                c: 2
            },
            {
                q: "Seorang siswa mengukur massa dan volume sebuah batu.\n\nMassa batu = 150 gram\nVolume awal air = 50 mL\nVolume air setelah batu dimasukkan = 110 mL\n\nBerdasarkan data tersebut, massa jenis batu adalah ....",
                a: [
                    "1,5 g/cm³",
                    "2,0 g/cm³",
                    "2,5 g/cm³",
                    "3,0 g/cm³"
                ],
                c: 2
            },
            {
                q: "Empat benda memiliki data sebagai berikut.\n\nBenda | Massa Jenis\nA | 0,6 g/cm³\nB | 0,9 g/cm³\nC | 1,0 g/cm³\nD | 1,2 g/cm³\n\nKeempat benda dimasukkan ke dalam air dengan massa jenis 1 g/cm³. Prediksi yang paling tepat adalah ....",
                a: [
                    "A dan B mengapung, C melayang, D tenggelam",
                    "A tenggelam, B mengapung, C melayang, D mengapung",
                    "A, B, dan C mengapung, D melayang",
                    "hanya A yang mengapung"
                ],
                c: 0
            },
            {
                q: "Sebuah kapal terbuat dari logam yang massa jenisnya lebih besar daripada air. Namun, kapal tersebut dapat mengapung.\n\nPenjelasan yang paling tepat adalah ....",
                a: [
                    "logam kapal tidak memiliki massa",
                    "kapal mengapung karena air berubah menjadi lebih rapat",
                    "bentuk kapal membuat volume keseluruhannya besar sehingga massa jenis rata-rata kapal dapat lebih kecil daripada air",
                    "logam selalu mengapung jika ukurannya besar"
                ],
                c: 2
            },
            {
                q: "Seorang siswa memiliki tiga kubus dengan ukuran berbeda yang terbuat dari bahan yang sama.\n\nKubus A memiliki massa 50 g and volume 20 cm³.\nKubus B memiliki massa 100 g and volume 40 cm³.\nKubus C memiliki massa 150 g and volume 60 cm³.\n\nSiswa menyimpulkan bahwa kubus C memiliki kerapatan paling besar karena massanya paling besar.\n\nEvaluasi yang paling tepat terhadap kesimpulan tersebut adalah ....",
                a: [
                    "benar, karena kerapatan hanya ditentukan oleh massa",
                    "benar, karena benda yang lebih berat selalu lebih rapat",
                    "salah, karena ketiga kubus memiliki perbandingan massa dan volume yang sama sehingga kerapatannya sama",
                    "salah, karena volume tidak berpengaruh terhadap kerapatan"
                ],
                c: 2
            },
            {
                q: "Seorang siswa ingin mengetahui apakah sebuah benda terbuat dari aluminium atau besi. Ia mengukur massa benda sebesar 270 gram dan volumenya 100 cm³.\n\nDiketahui:\n\nmassa jenis aluminium ≈ 2,7 g/cm³\nmassa jenis besi ≈ 7,9 g/cm³\n\nBerdasarkan hasil pengukuran, kesimpulan yang paling tepat adalah ....",
                a: [
                    "benda kemungkinan besar terbuat dari aluminium",
                    "benda kemungkinan besar terbuat dari besi",
                    "benda pasti terbuat dari besi karena massanya besar",
                    "benda tidak dapat diketahui jenis bahannya dari massa jenis"
                ],
                c: 0
            },
            {
                q: "Dalam percobaan, seorang siswa memasukkan telur ke dalam air biasa dan telur tenggelam. Setelah sejumlah garam dilarutkan ke dalam air, telur perlahan naik hingga akhirnya mengapung.\n\nMengapa peristiwa tersebut terjadi?",
                a: [
                    "garam mengurangi massa telur",
                    "garam mengubah volume telur menjadi lebih besar",
                    "penambahan garam meningkatkan massa jenis air sehingga massa jenis air menjadi lebih besar daripada massa jenis telur",
                    "garam menyebabkan telur kehilangan massa"
                ],
                c: 2
            }
        ],
        posttest: [],
        latihan: [
            { q: "Berdasarkan Tabel 2.4 di buku, logam manakah yang paling rapat (massa jenis terbesar) di antara Aluminium, Besi, Kuningan, dan Emas?", a: ["Aluminium (2.7 g/cm³)", "Besi (7.9 g/cm³)", "Kuningan (8.4 g/cm³)", "Emas (19.3 g/cm³)"], c: 3 },
            { q: "Sebuah balok memiliki massa 240 gram dan volume 120 cm³. Massa jenis balok tersebut adalah...", a: ["0.5 g/cm³", "2 g/cm³ (diperoleh dari 240 g / 120 cm³)", "120 g/cm³", "360 g/cm³"], c: 1 },
            { q: "Archimedes menggunakan metode ilmiah untuk menyelidiki kemurnian mahkota emas milik raja bernama...", a: ["Raja Archimedes", "Raja Hiero", "Raja Yunani", "Raja Sirakusa"], c: 1 },
            { q: "Benda yang memiliki massa jenis lebih besar dari cairan di sekelilingnya akan...", a: ["Mengapung", "Tenggelam", "Melayang", "Menguap"], c: 1 },
            { q: "Garam memiliki massa jenis 2,2 g/cm³ sedangkan air memiliki 1 g/cm³. Garam akan tenggelam di dalam air.", a: ["Benar", "Salah"], c: 0 },
            { q: "Volume benda tidak beraturan diukur dengan mengurangkan volume air mula-mula dari volume air setelah benda dimasukkan.", a: ["Benar", "Salah"], c: 0 },
            { q: "Massa jenis dinyatakan dalam satuan kg/m³ atau g/cm³.", a: ["Benar", "Salah"], c: 0 },
            { q: "Massa jenis besi berubah menjadi setengahnya jika besi dipotong menjadi dua bagian.", a: ["Benar", "Salah"], c: 1 },
            { q: "Minyak goreng berada di lapisan atas saat dicampur air karena massa jenis minyak lebih kecil dari air.", a: ["Benar", "Salah"], c: 0 },
            { q: "Semua batu pasti tenggelam di dalam air.", a: ["Benar", "Salah"], c: 1 }
        ]
    }
};

meetingsConfig.p1.posttest = meetingsConfig.p1.pretest;
meetingsConfig.p2.posttest = meetingsConfig.p2.pretest;
meetingsConfig.p3.posttest = meetingsConfig.p3.pretest;
meetingsConfig.p4.posttest = meetingsConfig.p4.pretest;

// --- DATA SLIDES DECK GURU (CANVA-STYLE CAROUSEL) ---
const teacherSlidesDeck = {
    p1: [
        {
            title: "1. Apa itu Materi & Zat?",
            content: "Semua benda di semesta yang mempunyai <strong>massa</strong> (berat jika ditimbang) and <strong>volume</strong> (menempati ruang) disebut <strong>Materi</strong> atau <strong>Zat</strong>!<br>Contoh: Meja sekolah 🪑, air minum 🥛, and udara dalam balon 🎈.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="20" y="50" width="40" height="40" rx="5" fill="#d97706" stroke="#b45309" stroke-width="2"/>
                <text x="25" y="73" fill="white" font-size="8" font-weight="bold">Kayu 🪑</text>
                <circle cx="100" cy="70" r="20" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
                <text x="88" y="74" fill="white" font-size="8" font-weight="bold">Air 🥛</text>
                <path d="M160 70 C150 40, 190 40, 180 70 Z M170 70 L170 100" fill="#ec4899" stroke="#be123c" stroke-width="2"/>
                <text x="162" y="66" fill="white" font-size="7" font-weight="bold">Balon 🎈</text>
                <text x="35" y="140" fill="#0f172a" font-size="12" font-weight="black">Massa &amp; Volume</text>
            </svg>`
        },
        {
            title: "2. Wujud Zat Padat & Zat Cair",
            content: "• <strong>Zat Padat</strong>: Partikel sangat rapat, teratur, and berikatan sangat kuat sehingga bentuknya tetap keras (bangku kayu tidak rusak dipukul).<br>• <strong>Gula/Pasir</strong>: Butiran pasir tetap padat karena wujud setiap butir individu tidak pernah berubah bentuk.<br>• <strong>Zat Cair</strong>: Volume tetap tetapi bentuk berubah mengikuti wadah karena partikel agak renggang and dapat bergeser bebas terbatas (air mengalir ke termos).",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="10" y="40" width="80" height="110" rx="10" fill="#f8fafc" stroke="#3b82f6" stroke-width="2"/>
                <text x="32" y="30" fill="#1e3a8a" font-size="10" font-weight="bold">ZAT PADAT</text>
                <circle cx="30" cy="60" r="6" fill="#64748b"/><circle cx="50" cy="60" r="6" fill="#64748b"/><circle cx="70" cy="60" r="6" fill="#64748b"/>
                <circle cx="30" cy="80" r="6" fill="#64748b"/><circle cx="50" cy="80" r="6" fill="#64748b"/><circle cx="70" cy="80" r="6" fill="#64748b"/>
                <circle cx="30" cy="100" r="6" fill="#64748b"/><circle cx="50" cy="100" r="6" fill="#64748b"/><circle cx="70" cy="100" r="6" fill="#64748b"/>
                
                <rect x="110" y="40" width="80" height="110" rx="10" fill="#f8fafc" stroke="#3b82f6" stroke-width="2"/>
                <text x="132" y="30" fill="#1e3a8a" font-size="10" font-weight="bold">ZAT CAIR</text>
                <circle cx="125" cy="115" r="6" fill="#38bdf8"/><circle cx="145" cy="120" r="6" fill="#38bdf8"/><circle cx="165" cy="115" r="6" fill="#38bdf8"/>
                <circle cx="135" cy="135" r="6" fill="#38bdf8"/><circle cx="155" cy="138" r="6" fill="#38bdf8"/><circle cx="170" cy="132" r="6" fill="#38bdf8"/>
            </svg>`
        },
        {
            title: "3. Zat Gas & Kompresibilitas",
            content: "• <strong>Zat Gas</strong>: Bentuk & volume berubah. Partikel sangat berjauhan, bebas terbang cepat and acak menumbuk kulit (angin sejuk saat upacara).<br>• <strong>Kompresibilitas</strong>: Gas sangat mudah ditekan karena memiliki jarak antarpartikel yang sangat renggang (banyak sela kosong). Zat padat/cair sangat sulit/tidak dapat ditekan.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="25" y="30" width="60" height="110" fill="none" stroke="#64748b" stroke-width="3"/>
                <rect x="28" y="80" width="54" height="10" fill="#cbd5e1" stroke="#475569"/>
                <line x1="55" y1="30" x2="55" y2="80" stroke="#64748b" stroke-width="4"/>
                <circle cx="38" cy="100" r="4" fill="#a855f7"/><circle cx="68" cy="110" r="4" fill="#a855f7"/><circle cx="50" cy="125" r="4" fill="#a855f7"/>
                <text x="23" y="160" fill="#334155" font-size="9" font-weight="bold">Gas: Dapat Ditekan</text>

                <rect x="115" y="30" width="60" height="110" fill="none" stroke="#64748b" stroke-width="3"/>
                <rect x="118" y="45" width="54" height="10" fill="#cbd5e1" stroke="#475569"/>
                <line x1="145" y1="30" x2="145" y2="45" stroke="#64748b" stroke-width="4"/>
                <rect x="125" y="60" width="12" height="12" fill="#d97706"/>
                <rect x="145" y="70" width="12" height="12" fill="#d97706"/>
                <rect x="135" y="90" width="12" height="12" fill="#d97706"/>
                <text x="113" y="160" fill="#334155" font-size="9" font-weight="bold">Padat: Keras/Mampat</text>
            </svg>`
        },
        {
            title: "4. Kecepatan Difusi Zat",
            content: "• <strong>Difusi</strong>: Menyebarnya partikel secara mandiri dari bagian konsentrasi tinggi ke rendah.<br>• <strong>Difusi Gas</strong> (aroma parfum/kopi hangat menyebar ke teras) berlangsung jauh lebih cepat dibanding zat cair karena partikel gas bergerak cepat and jarak antarpartikel gas sangat renggang (hampir tidak ada gaya tarik).",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <path d="M40 80 C30 50, 70 50, 60 80 Z" fill="#ec4899" stroke="#be123c" stroke-width="2"/>
                <rect x="47" y="80" width="6" height="15" fill="#cbd5e1"/>
                <circle cx="50" cy="30" r="4" fill="#ec4899"/>
                <circle cx="80" cy="20" r="4" fill="#ec4899"/>
                <circle cx="110" cy="40" r="4" fill="#ec4899"/>
                <circle cx="140" cy="60" r="4" fill="#ec4899"/>
                <path d="M55 45 L70 35 M85 30 L105 38" stroke="#be123c" stroke-width="1.5" stroke-dasharray="2,2"/>
                <text x="35" y="130" fill="#be123c" font-size="10" font-weight="bold">Parfum Menyebar</text>
                <text x="35" y="150" fill="#334155" font-size="11" font-weight="black">Difusi Gas Tercepat!</text>
            </svg>`
        },
        {
            title: "5. Anatomi Indera Penciuman",
            content: "Alur perambatan bau di dalam hidung hingga dapat tercium dengan benar:<br><br><div style='text-align:center; font-weight:800; font-size:1.1rem; color:var(--primary);'>Rongga Hidung ➔ Silia Saraf Pembau ➔ Saraf Pembau ➔ Otak Besar</div>",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <path d="M20 160 Q20 120 40 100 Q60 80 80 110 T120 120" fill="none" stroke="#64748b" stroke-width="3"/>
                <path d="M50 115 C52 105, 58 105, 60 115" stroke="#ef4444" stroke-width="2" fill="none"/>
                <text x="40" y="135" fill="#ef4444" font-size="8" font-weight="black">Silia Rambut</text>
                <path d="M65 95 Q85 85 105 90" stroke="#3b82f6" stroke-width="2" fill="none"/>
                <text x="80" y="80" fill="#3b82f6" font-size="8" font-weight="black">Saraf Pembau</text>
                <circle cx="130" cy="90" r="22" fill="#fed7aa" stroke="#f97316" stroke-width="2"/>
                <text x="117" y="93" fill="#ea580c" font-size="9" font-weight="black">OTAK</text>
            </svg>`
        },
        {
            title: "6. Kekuatan Penciuman Makhluk Hidup",
            content: "Setiap makhluk hidup memiliki tingkat kepekaan penciuman yang berbeda:<br>• <strong>Manusia</strong>: Memiliki 5 juta sel pembau & 350 gen pembau.<br>• <strong>Anjing K9</strong>: Memiliki 220 juta sel pembau (sangat peka mendeteksi barang).<br>• <strong>Gajah Afrika</strong>: Indera penciuman terkuat dengan 2.000 gen reseptor pembau.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="20" y="140" width="30" height="20" rx="3" fill="#94a3b8"/>
                <text x="18" y="130" font-size="8" font-weight="black">Manusia (5Jt)</text>
                
                <rect x="80" y="80" width="30" height="80" rx="3" fill="#f59e0b"/>
                <text x="75" y="70" font-size="8" font-weight="black">Anjing (220Jt)</text>
                
                <rect x="140" y="20" width="30" height="140" rx="3" fill="#10b981"/>
                <text x="135" y="13" font-size="8" font-weight="black">Gajah (2000Gen)</text>
            </svg>`
        },
        {
            title: "7. Kesimpulan Pertemuan 1",
            content: "• <strong>Wujud Zat</strong>: Zat padat memiliki bentuk & volume tetap. Zat cair memiliki volume tetap tetapi bentuk berubah mengikuti wadah. Zat gas memiliki bentuk & volume yang selalu berubah.<br>• <strong>Model Partikel</strong>: Partikel zat padat sangat rapat, zat cair agak renggang, sedangkan zat gas sangat berjauhan.<br>• <strong>Difusi & Penciuman</strong>: Penyebaran partikel gas lebih cepat dibanding zat cair. Bau dideteksi oleh silia hidung lalu dikirim saraf pembau ke otak untuk diterjemahkan.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="35" y="30" width="130" height="140" rx="15" fill="#f8fafc" stroke="#a855f7" stroke-width="3"/>
                <rect x="75" y="15" width="50" height="25" rx="5" fill="#f3e8ff" stroke="#a855f7" stroke-width="2"/>
                <circle cx="100" cy="27" r="4" fill="#a855f7"/>
                
                <rect x="55" y="60" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 67 L63 71 L70 63" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="67" x2="145" y2="67" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
                
                <rect x="55" y="95" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 102 L63 106 L70 98" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="102" x2="145" y2="102" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
                
                <rect x="55" y="130" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 137 L63 141 L70 133" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="137" x2="145" y2="137" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
            </svg>`
        }
    ],
    p2: [
        {
            title: "1. Perubahan Wujud Zat",
            content: "Materi dapat mengalami perubahan wujud zat jika dipanaskan atau didinginkan (tidak bersifat tetap).<br>• <strong>Menyerap Panas (Butuh Panas)</strong>: Mencair, Menguap, Menyublim.<br>• <strong>Melepas Panas (Mendingin)</strong>: Membeku, Mengembun, Mengkristal.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <polygon points="100,20 40,130 160,130" fill="none" stroke="#64748b" stroke-width="3"/>
                <circle cx="100" cy="20" r="15" fill="#fca5a5" stroke="#ef4444" stroke-width="2"/>
                <text x="92" y="23" font-size="8" font-weight="black">CAIR</text>
                
                <circle cx="40" cy="130" r="15" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
                <text x="32" y="133" font-size="8" font-weight="black">PADAT</text>

                <circle cx="160" cy="130" r="15" fill="#bae6fd" stroke="#0ea5e9" stroke-width="2"/>
                <text x="153" y="133" font-size="8" font-weight="black">GAS</text>

                <text x="40" y="70" fill="#ef4444" font-size="8" font-weight="bold">Mencair ➔</text>
                <text x="120" y="70" fill="#ef4444" font-size="8" font-weight="bold">➔ Menguap</text>
                <text x="80" y="150" fill="#0ea5e9" font-size="8" font-weight="bold"> Menyublim ➔</text>
            </svg>`
        },
        {
            title: "2. Menguap vs Mendidih",
            content: "Perbedaan penting (Gambar 2.11 Buku Halaman 55):<br>• <strong>Menguap</strong>: Hanya terjadi di permukaan zat cair pada suhu di bawah titik didihnya (seperti menjemur pakaian basah).<br>• <strong>Mendidih</strong>: Terjadi di seluruh bagian zat cair tepat pada titik didih air (100°C), ditandai gelembung uap air naik ke permukaan.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="15" y="40" width="70" height="90" rx="5" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
                <line x1="15" y1="90" x2="85" y2="90" stroke="#0ea5e9" stroke-width="2"/>
                <path d="M30 80 Q35 70 30 60 M50 80 Q55 70 50 60" stroke="#0ea5e9" stroke-width="1.5" fill="none"/>
                <text x="25" y="150" fill="#334155" font-size="9" font-weight="bold">Menguap (Permukaan)</text>

                <rect x="115" y="40" width="70" height="90" rx="5" fill="#f8fafc" stroke="#ef4444" stroke-width="2"/>
                <line x1="115" y1="90" x2="185" y2="90" stroke="#ef4444" stroke-width="2"/>
                <circle cx="130" cy="100" r="4" fill="none" stroke="#ef4444" stroke-width="1.5"/>
                <circle cx="150" cy="95" r="4" fill="none" stroke="#ef4444" stroke-width="1.5"/>
                <circle cx="170" cy="105" r="4" fill="none" stroke="#ef4444" stroke-width="1.5"/>
                <text x="125" y="150" fill="#334155" font-size="9" font-weight="bold">Mendidih (Gelembung)</text>
            </svg>`
        },
        {
            title: "3. Titik Didih & Titik Leleh",
            content: "• <strong>Titik Leleh</strong>: Suhu saat zat padat mulai meleleh menjadi zat cair (contoh: Es meleleh pada 0°C, Besi pada 1535°C).<br>• <strong>Titik Didih</strong>: Suhu saat zat cair mendidih menjadi gas (contoh: Air mendidih pada 100°C).<br>Setiap zat memiliki titik leleh and titik didih yang unik dan khas sebagai ciri khas zat.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="40" y="120" width="120" height="20" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
                <path d="M100 120 Q105 100 110 120" fill="#f59e0b"/>
                <path d="M90 120 C90 90, 110 90, 110 120" fill="#ef4444" opacity="0.8"/>
                <text x="35" y="60" fill="#be123c" font-size="11" font-weight="black">Besi Meleleh di 1535°C</text>
            </svg>`
        },
        {
            title: "4. Analisis Grafik Pemanasan Air",
            content: "Berdasarkan Grafik 2.13 Buku Halaman 57:<br>• Suhu awal es batu sebelum dipanaskan adalah <strong>-20°C</strong>.<br>• Es mulai meleleh menjadi air pada suhu konstan <strong>0°C</strong> (garis mendatar pertama).<br>• Air mulai mendidih pada suhu konstan <strong>100°C</strong> (garis mendatar kedua).",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <line x1="20" y1="160" x2="180" y2="160" stroke="#64748b" stroke-width="2"/>
                <line x1="30" y1="170" x2="30" y2="20" stroke="#64748b" stroke-width="2"/>
                <path d="M30 150 L60 110 L100 110 L140 50 L180 50" fill="none" stroke="#ef4444" stroke-width="3"/>
                <text x="5" y="153" font-size="7" font-weight="bold">-20°C</text>
                <text x="15" y="113" font-size="7" font-weight="bold">0°C</text>
                <text x="10" y="53" font-size="7" font-weight="bold">100°C</text>
                <text x="65" y="105" fill="#ef4444" font-size="8" font-weight="bold">Meleleh</text>
                <text x="145" y="45" fill="#ef4444" font-size="8" font-weight="bold">Mendidih</text>
            </svg>`
        },
        {
            title: "5. Rahasia Garis Mendatar",
            content: "Mengapa suhu konstan saat wujud berubah? Karena seluruh energi panas dari kompor dipakai khusus untuk memutus ikatan antarpartikel es/air, bukan menaikkan suhu.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <circle cx="60" cy="100" r="12" fill="#64748b"/>
                <circle cx="140" cy="100" r="12" fill="#64748b"/>
                <path d="M60 100 L140 100" stroke="#475569" stroke-width="4"/>
                <path d="M100 60 L100 140" stroke="#ef4444" stroke-width="4" stroke-dasharray="5,5"/>
                <text x="35" y="40" fill="#ef4444" font-size="10" font-weight="black">Panas Memutus Ikatan</text>
            </svg>`
        },
        {
            title: "6. Siapa Membeku Paling Awal?",
            content: "Zat dengan titik beku/leleh tertinggi membeku paling awal saat didinginkan.<br>• <strong>Air (0°C)</strong> membeku jauh lebih cepat/awal dibandingkan nitrogen (-210°C) and oksigen (-218°C) saat diturunkan suhunya.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="85" y="50" width="30" height="90" fill="#3b82f6"/>
                <text x="90" y="45" font-size="9" font-weight="black">Air (0°C)</text>
                
                <rect x="35" y="90" width="30" height="50" fill="#94a3b8"/>
                <text x="32" y="85" font-size="8" font-weight="bold">Nitrogen</text>

                <rect x="135" y="110" width="30" height="30" fill="#64748b"/>
                <text x="135" y="105" font-size="8" font-weight="bold">Oksigen</text>
            </svg>`
        },
        {
            title: "7. Kesimpulan Pertemuan 2",
            content: "• <strong>Perubahan Wujud</strong>: Mencair, menguap, menyublim (proses menyerap kalor). Membeku, mengembun, mengkristal (proses melepas kalor).<br>• <strong>Menguap vs Mendidih</strong>: Menguap hanya terjadi di permukaan zat cair pada suhu bebas. Mendidih terjadi di seluruh bagian zat cair tepat pada titik didihnya.<br>• <strong>Grafik Pemanasan</strong>: Saat perubahan wujud terjadi (meleleh/mendidih), suhu zat akan tetap konstan (garis mendatar) karena kalor digunakan untuk memutus ikatan antarpartikel.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="35" y="30" width="130" height="140" rx="15" fill="#f8fafc" stroke="#a855f7" stroke-width="3"/>
                <rect x="75" y="15" width="50" height="25" rx="5" fill="#f3e8ff" stroke="#a855f7" stroke-width="2"/>
                <circle cx="100" cy="27" r="4" fill="#a855f7"/>
                
                <rect x="55" y="60" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 67 L63 71 L70 63" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="67" x2="145" y2="67" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
                
                <rect x="55" y="95" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 102 L63 106 L70 98" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="102" x2="145" y2="102" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
                
                <rect x="55" y="130" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 137 L63 141 L70 133" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="137" x2="145" y2="137" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
            </svg>`
        }
    ],
    p3: [
        {
            title: "1. Perubahan Fisika vs Perubahan Kimia",
            content: "• <strong>Perubahan Fisika</strong>: Komposisi zat tetap sama (kertas disobek tetap kertas), tidak terbentuk zat baru, dapat kembali ke bentuk semula (<strong>reversible</strong>, contoh: es krim meleleh).<br>• <strong>Perubahan Kimia</strong>: Terbentuk zat baru, tetap (<strong>irreversible</strong>, contoh: sumbu lilin terbakar hangus jadi hitam arang, donat dipanggang).",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <circle cx="50" cy="80" r="20" fill="#fca5a5" stroke="#ef4444" stroke-width="2"/>
                <text x="35" y="120" font-size="8" font-weight="black">Es Krim Meleleh</text>
                <text x="40" y="135" font-size="7" fill="#ef4444" font-weight="bold">(Fisika)</text>

                <rect x="125" y="60" width="40" height="40" fill="#334155" stroke="#0f172a" stroke-width="2"/>
                <text x="128" y="120" font-size="8" font-weight="black">Kertas Jadi Abu</text>
                <text x="133" y="135" font-size="7" fill="#ef4444" font-weight="bold">(Kimia)</text>
            </svg>`
        },
        {
            title: "2. Empat Tanda Reaksi Kimia",
            content: "Reaksi kimia ditandai dengan 4 hal:<br>1. <strong>Warna berubah nyata</strong> (kuning iodida).<br>2. <strong>Gas terbentuk</strong> (gelembung gas hidrogen).<br>3. <strong>Endapan timbul</strong> (padatan tidak larut di dasar tabung).<br>4. <strong>Perubahan energi</strong> (kilatan cahaya/panas pembakaran).",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="15" y="25" width="75" height="60" rx="8" fill="#e0f2fe" stroke="#3b82f6" stroke-width="2"/>
                <text x="25" y="45" font-size="8" font-weight="black">1. Warna</text>
                <text x="25" y="60" font-size="8" font-weight="black">2. Gas 🫧</text>

                <rect x="110" y="25" width="75" height="60" rx="8" fill="#e0f2fe" stroke="#3b82f6" stroke-width="2"/>
                <text x="115" y="45" font-size="8" font-weight="black">3. Endapan</text>
                <text x="115" y="60" font-size="8" font-weight="black">4. Panas 🔥</text>
                <text x="40" y="140" fill="#1e3a8a" font-size="11" font-weight="black">4 Tanda Utama</text>
            </svg>`
        },
        {
            title: "3. Persamaan Reaksi Kata",
            content: "Persamaan reaksi ditulis dengan format:<br><div style='text-align:center; font-weight:800; font-size:1.15rem; color:var(--secondary);'>Pereaksi ➔ Produk</div>• Pembakaran kertas: Kertas + Oksigen ➔ Abu arang + asap.<br>• Pembuatan donat: Tepung + mentega + telur + gula ➔ Donat.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="15" y="60" width="65" height="40" rx="5" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
                <text x="22" y="83" font-size="8" font-weight="bold">Pereaksi</text>
                <path d="M85 80 L115 80 M105 70 L115 80 L105 90" stroke="#ef4444" stroke-width="3" fill="none"/>
                <rect x="120" y="60" width="65" height="40" rx="5" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/>
                <text x="135" y="83" font-size="8" font-weight="bold">Produk</text>
            </svg>`
        },
        {
            title: "4. Proses Mengunyah Nasi",
            content: "• <strong>Proses (1) Gigi memecah nasi</strong>: Perubahan Fisika (nasi hancur secara mekanis tanpa membentuk zat baru).<br>• <strong>Proses (2) Air liur mengurai karbohidrat</strong>: Perubahan Kimia (enzim amilase mengubah karbohidrat menjadi zat gula manis).",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <path d="M40 70 Q100 20 160 70 Q100 120 40 70 Z" fill="none" stroke="#64748b" stroke-width="3"/>
                <rect x="60" y="60" width="15" height="15" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
                <rect x="120" y="60" width="15" height="15" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
                <text x="35" y="140" fill="#334155" font-size="10" font-weight="bold">Fisika (Gigi) ➔ Kimia (Enzim)</text>
            </svg>`
        },
        {
            title: "5. Reaksi Endapan & Gas Hidrogen",
            content: "• <strong>Magnesium + Asam Klorida</strong>: Menghasilkan gelembung gas hidrogen melimpah.<br>• <strong>Endapan</strong>: Padatan tidak larut yang terbentuk setelah dua zat cair dicampurkan (membuat larutan menjadi keruh and menumpuk di dasar).",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="40" y="40" width="30" height="110" fill="none" stroke="#64748b" stroke-width="2"/>
                <circle cx="50" cy="80" r="3" fill="#94a3b8"/><circle cx="60" cy="90" r="3" fill="#94a3b8"/><circle cx="55" cy="110" r="3" fill="#94a3b8"/>
                <text x="32" y="165" font-size="8" font-weight="bold">Gas Hidrogen</text>

                <rect x="130" y="40" width="30" height="110" fill="none" stroke="#64748b" stroke-width="2"/>
                <rect x="132" y="130" width="26" height="18" fill="#f1f5f9"/>
                <text x="122" y="165" font-size="8" font-weight="bold">Endapan Padat</text>
            </svg>`
        },
        {
            title: "6. Daur Abadi Siklus Air",
            content: "Siklus air melibatkan perubahan fisika berulang yang digerakkan oleh <strong>panas matahari</strong> and <strong>gravitasi bumi</strong>:<br>• <strong>Evaporasi</strong>: Penguapan air.<br>• <strong>Kondensasi</strong>: Terbentuk awan dingin.<br>• <strong>Presipitasi</strong>: Hujan jatuh.<br>• <strong>Infiltrasi</strong>: Air meresap masuk pori tanah.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <circle cx="170" cy="30" r="15" fill="#f87171"/>
                <path d="M40 70 C30 50, 80 50, 70 70 Z" fill="#cbd5e1"/>
                <path d="M45 80 L45 100 M65 80 L65 100" stroke="#3b82f6" stroke-dasharray="2,2"/>
                <path d="M10 160 Q100 130 190 160" fill="none" stroke="#0ea5e9" stroke-width="4"/>
                <text x="110" y="115" font-size="8" fill="#e11d48" font-weight="bold">Evaporasi ➔</text>
                <text x="32" y="175" font-size="8" fill="#0369a1" font-weight="bold">Infiltrasi</text>
            </svg>`
        },
        {
            title: "7. Kesimpulan Pertemuan 3",
            content: "• <strong>Perubahan Fisika</strong>: Komposisi zat tetap sama, tidak terbentuk zat baru, and reversible (contoh: es mencair, beras ditumbuk menjadi tepung).<br>• <strong>Perubahan Kimia</strong>: Terbentuk zat baru dengan sifat berbeda, and irreversible (contoh: sumbu lilin terbakar, besi berkarat). Ditandai dengan warna berubah, terbentuk gas/endapan, and perubahan suhu.<br>• <strong>Siklus Air</strong>: Melibatkan serangkaian perubahan fisika alami: Evaporasi (penguapan), Kondensasi (awan), Presipitasi (hujan), and Infiltrasi (meresap).",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="35" y="30" width="130" height="140" rx="15" fill="#f8fafc" stroke="#a855f7" stroke-width="3"/>
                <rect x="75" y="15" width="50" height="25" rx="5" fill="#f3e8ff" stroke="#a855f7" stroke-width="2"/>
                <circle cx="100" cy="27" r="4" fill="#a855f7"/>
                
                <rect x="55" y="60" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 67 L63 71 L70 63" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="67" x2="145" y2="67" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
                
                <rect x="55" y="95" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 102 L63 106 L70 98" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="102" x2="145" y2="102" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
                
                <rect x="55" y="130" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 137 L63 141 L70 133" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="137" x2="145" y2="137" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
            </svg>`
        }
    ],
    p4: [
        {
            title: "1. Kerapatan Zat & Massa Jenis",
            content: "Kenapa kejatuhan batu bata sakit sedangkan kejatuhan air tidak? Karena partikel batu bata tersusun sangat rapat dibanding air.<br>• <strong>Massa Jenis</strong>: Pengukuran massa setiap satuan volume benda. Semakin tinggi kerapatan partikel, semakin besar massa jenisnya.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="15" y="45" width="70" height="100" fill="none" stroke="#475569" stroke-width="2"/>
                <text x="25" y="35" font-size="9" font-weight="bold">Batu Bata (Padat)</text>
                <circle cx="30" cy="65" r="5" fill="#ef4444"/><circle cx="45" cy="65" r="5" fill="#ef4444"/><circle cx="60" cy="65" r="5" fill="#ef4444"/><circle cx="75" cy="65" r="5" fill="#ef4444"/>
                <circle cx="30" cy="80" r="5" fill="#ef4444"/><circle cx="45" cy="80" r="5" fill="#ef4444"/><circle cx="60" cy="80" r="5" fill="#ef4444"/><circle cx="75" cy="80" r="5" fill="#ef4444"/>
                <circle cx="30" cy="95" r="5" fill="#ef4444"/><circle cx="45" cy="95" r="5" fill="#ef4444"/><circle cx="60" cy="95" r="5" fill="#ef4444"/><circle cx="75" cy="95" r="5" fill="#ef4444"/>
                
                <rect x="115" y="45" width="70" height="100" fill="none" stroke="#0284c7" stroke-width="2"/>
                <text x="135" y="35" font-size="9" font-weight="bold">Air (Cair)</text>
                <circle cx="125" cy="70" r="5" fill="#38bdf8"/><circle cx="145" cy="85" r="5" fill="#38bdf8"/><circle cx="165" cy="75" r="5" fill="#38bdf8"/>
                <circle cx="135" cy="110" r="5" fill="#38bdf8"/><circle cx="155" cy="120" r="5" fill="#38bdf8"/>
            </svg>`
        },
        {
            title: "2. Menentukan Massa Jenis",
            content: "Rumus massa jenis:<br><div style='text-align:center; font-size:1.4rem; font-weight:800; color:var(--secondary);'>&rho; = m / V</div>• <strong>&rho; (Rho)</strong>: Massa jenis (g/cm³ atau kg/m³)<br>• <strong>m</strong>: Massa benda (g atau kg)<br>• <strong>V</strong>: Volume benda (cm³ atau m³)<br>Contoh: Massa balok 120 g, volume 120 cm³ ➔ &rho; = 1 g/cm³.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="20" y="30" width="160" height="120" rx="10" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
                <text x="60" y="70" font-size="18" font-weight="black" fill="#1e3a8a">&rho; = m / V</text>
                <text x="40" y="105" font-size="8" font-weight="bold">Massa = 120g | Volume = 120cm³</text>
                <text x="45" y="130" font-size="11" font-weight="black" fill="#ef4444">&rho; = 1 g/cm³ (Air)</text>
            </svg>`
        },
        {
            title: "3. Mengukur Volume Benda Tak Beraturan",
            content: "Untuk benda tidak beratur seperti batu, gunakan <strong>Gelas Ukur</strong> atau <strong>Gelas Berpancuran</strong>:<br>• Volume batu = Volume air yang tumpah/naik.<br>• Cerita Archimedes: Raja Hiero mencurigai mahkotanya. Archimedes mandi, bak meluap, ia tersadar lalu berlari telanjang berteriak <strong>'EUREKA!'</strong>.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="40" y="50" width="45" height="100" fill="none" stroke="#475569" stroke-width="2"/>
                <line x1="40" y1="100" x2="85" y2="100" stroke="#3b82f6" stroke-width="2"/>
                <text x="48" y="90" font-size="7">Air: 50 ml</text>
                
                <rect x="115" y="50" width="45" height="100" fill="none" stroke="#475569" stroke-width="2"/>
                <line x1="115" y1="80" x2="160" y2="80" stroke="#3b82f6" stroke-width="2"/>
                <circle cx="138" cy="110" r="10" fill="#64748b"/>
                <text x="123" y="70" font-size="7">Air + Batu: 80 ml</text>
                
                <text x="25" y="170" font-size="8" font-weight="bold">Volume Batu = 80 - 50 = 30 ml</text>
            </svg>`
        },
        {
            title: "4. Mengapung & Tenggelam",
            content: "Kondisi benda dalam zat cair:<br>• <strong>Mengapung</strong>: Massa jenis benda &lt; massa jenis cairan (contoh: es batu 0.92 g/cm³ di air 1 g/cm³).<br>• <strong>Tenggelam</strong>: Massa jenis benda &gt; massa jenis cairan (batu di air).",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="20" y="40" width="160" height="120" fill="none" stroke="#475569" stroke-width="2"/>
                <line x1="20" y1="100" x2="180" y2="100" stroke="#0ea5e9" stroke-width="3"/>
                
                <rect x="40" y="85" width="30" height="25" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
                <text x="35" y="70" font-size="8" font-weight="bold">Mengapung</text>
                
                <rect x="130" y="130" width="30" height="25" fill="#64748b" stroke="#334155" stroke-width="1.5"/>
                <text x="125" y="125" font-size="8" font-weight="bold">Tenggelam</text>
            </svg>`
        },
        {
            title: "5. Rahasia Laut Mati",
            content: "• Laut Mati memiliki konsentrasi garam sangat tinggi sehingga massa jenis airnya mencapai <strong>1,24 g/cm³</strong>.<br>• Tubuh manusia memiliki massa jenis rata-rata <strong>0,985 g/cm³</strong>.<br>• Karena &rho; tubuh manusia &lt; &rho; air Laut Mati, manusia dapat mengapung santai membaca koran tanpa takut tenggelam!",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="15" y="40" width="170" height="120" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
                <path d="M30 110 Q100 130 170 110" stroke="#0284c7" stroke-width="4" fill="none"/>
                <ellipse cx="100" cy="100" rx="40" ry="12" fill="#ffedd5" stroke="#f97316"/>
                <text x="80" y="103" font-size="8" font-weight="bold">Manusia Terapung</text>
                <text x="25" y="60" font-size="9" fill="#1e3b8a" font-weight="black">Air Laut Mati: 1.24 g/cm³</text>
                <text x="25" y="75" font-size="9" fill="#b45309" font-weight="black">Tubuh Manusia: 0.985 g/cm³</text>
            </svg>`
        },
        {
            title: "6. Lapisan Kerapatan Cairan & Balon Helium",
            content: "• <strong>Cairan Berlapis</strong>: Jika air, minyak, dan raksa dicampur, raksa paling rapat (terbawah), air (tengah), dan minyak paling renggang (teratas).<br>• <strong>Balon Helium</strong>: Gas helium memiliki massa jenis lebih kecil dari udara, sehingga balon helium terbang melayang ke atas udara.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="30" y="30" width="50" height="130" fill="none" stroke="#475569" stroke-width="2"/>
                <rect x="32" y="130" width="46" height="28" fill="#94a3b8"/>
                <text x="40" y="145" font-size="7" fill="white">Raksa</text>
                <rect x="32" y="90" width="46" height="40" fill="#38bdf8"/>
                <text x="43" y="110" font-size="7" fill="white">Air</text>
                <rect x="32" y="50" width="46" height="40" fill="#fef08a"/>
                <text x="38" y="70" font-size="7" fill="#854d0e">Minyak</text>
                
                <circle cx="140" cy="80" r="20" fill="#f43f5e"/>
                <path d="M140 100 L140 140" stroke="#475569"/>
                <text x="120" y="75" font-size="8" fill="white" font-weight="bold">Helium</text>
                <text x="110" y="50" font-size="8" font-weight="bold">Melayang di Udara</text>
            </svg>`
        },
        {
            title: "7. Kesimpulan Pertemuan 4",
            content: "• <strong>Kerapatan & Massa Jenis</strong>: Rumus massa jenis adalah &rho; = m / V (massa dibagi volume). Menunjukkan tingkat kerapatan partikel zat.<br>• <strong>Posisi Benda</strong>: Mengapung (&rho; benda &lt; &rho; cairan), Melayang (&rho; benda = &rho; cairan), and Tenggelam (&rho; benda &gt; &rho; cairan).<br>• <strong>Metode Archimedes</strong>: Menghitung volume benda padat tidak beraturan dengan mengukur volume air yang dipindahkan atau tumpah saat benda dimasukkan.",
            graphic: `<svg viewBox="0 0 200 200" width="100%" height="100%">
                <rect x="35" y="30" width="130" height="140" rx="15" fill="#f8fafc" stroke="#a855f7" stroke-width="3"/>
                <rect x="75" y="15" width="50" height="25" rx="5" fill="#f3e8ff" stroke="#a855f7" stroke-width="2"/>
                <circle cx="100" cy="27" r="4" fill="#a855f7"/>
                
                <rect x="55" y="60" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 67 L63 71 L70 63" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="67" x2="145" y2="67" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
                
                <rect x="55" y="95" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 102 L63 106 L70 98" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="102" x2="145" y2="102" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
                
                <rect x="55" y="130" width="15" height="15" rx="3" fill="#34d399" stroke="#10b981" stroke-width="1.5"/>
                <path d="M59 137 L63 141 L70 133" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="80" y1="137" x2="145" y2="137" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
            </svg>`
        }
    ]
};

// --- DATA INLINE ASISTEN AVATAR ---
const scientistAvatars = {
    happy: "🧑‍🔬",
    thinking: "🤔",
    celebrate: "🎉",
    shocked: "😮",
    sad: "☹️"
};

// --- SPEECH BUBBLES DISETIAP STEPS ---
const stepsNarrative = {
    splash: "Selamat datang ilmuwan muda! Mari kita mulai petualangan seru hari ini. Klik Mulai Belajar!",
    stimulus1: "Perhatikan baik-baik tayangan video atau animasi apersepsi berikut ini, ya!",
    apersepsi: "Mari kita hubungkan petualangan hari ini dengan pengalaman sehari-harimu. Apakah kamu pernah melihat ini?",
    motivasi: "Tahukah kamu? Fakta unik sains ini akan membuatmu kagum dengan cara kerja alam semesta!",
    tujuan: "Ini adalah daftar misi kekuatan sains yang akan kamu kuasai setelah petualangan hari ini selesai. Let's go!",
    pretest: "Yuk, kita uji dulu pengetahuan awalmu! Jawablah semampumu ya!",
    stimulus2: "Sebelum memulai penyelidikan di Laboratorium Eksplorasi, jawablah pertanyaan berikut berdasarkan video pengantar ini!",
    missions: "Misi Eksplorasi Interaktif! Selesaikan keempat tantangan praktikum virtual ini untuk mengumpulkan koin bintang!",
    presentasi: "Ayo presentasikan temuan hasil penyelidikanmu hari ini di depan kelas! Ketik catatan presentasimu dulu, ya!",
    penguatan: "Mari dengar penjelasan penguatan materi dari guru lewat Slide Canva interaktif agar pemahamanmu makin mantap!",
    kesimpulan: "Hebat! Sekarang mari kita rangkum poin-poin kesimpulan penting dari petualangan sains kita hari ini!",
    latihan: "Arena Kompetisi Bermain! Ayo tunjukkan kemampuan terbaikmu bersaing melawan teman kelas!",
    refleksi: "Tuliskan perasaanmu hari ini and kirim tanggapanmu ke Mentimeter Wall kelas!",
    posttest: "Ujian Akhir Kelas! Jawablah cepat dan tepat untuk mendapatkan skor tertinggi di podium kompetisi!",
    penutup: "Luar biasa! Kamu telah berhasil menyelesaikan seluruh tantangan petualangan hari ini. Inilah lencanamu!"
};

// --- INISIALISASI AWAL ---
document.addEventListener("DOMContentLoaded", () => {
    // Set default Google Sheet URL if not set or invalid
    const defaultUrl = "https://script.google.com/macros/s/AKfycbxFtPjiDgOXevfqnS9GvK4FsRW8FetqFSiiJ-otvlq7QTy6NUOPkRDOMrDLVN172xAOQg/exec";
    const currentUrl = localStorage.getItem("googleSheetWebAppUrl");
    if (!currentUrl || currentUrl === "null" || currentUrl === "undefined" || !currentUrl.startsWith("https://script.google.com/macros/s/")) {
        localStorage.setItem("googleSheetWebAppUrl", defaultUrl);
    }

    const savedStars = localStorage.getItem("userStars");
    if (savedStars) {
        userStars = parseInt(savedStars);
    }
    
    studentName = localStorage.getItem("studentName") || "";
    updateSheetStatus();
    
    document.getElementById("btn-save-settings").addEventListener("click", () => {
        SoundEffects.playClick();
        const urlInput = document.getElementById("input-web-app-url").value.trim();
        if (!urlInput) {
            const defaultUrl = "https://script.google.com/macros/s/AKfycbxFtPjiDgOXevfqnS9GvK4FsRW8FetqFSiiJ-otvlq7QTy6NUOPkRDOMrDLVN172xAOQg/exec";
            localStorage.setItem("googleSheetWebAppUrl", defaultUrl);
            alert("Koneksi Google Sheet diatur kembali ke default.");
            closeSettings();
            updateSheetStatus();
            return;
        }
        if (urlInput.startsWith("https://script.google.com/macros/s/")) {
            localStorage.setItem("googleSheetWebAppUrl", urlInput);
            alert("Koneksi Google Sheet berhasil disimpan!");
            closeSettings();
            updateSheetStatus();
        } else {
            alert("URL tidak valid! Harap masukkan URL Google Apps Script Web App yang valid.");
        }
    });
    
    // Clean up old fake leaderboard data once
    if (!localStorage.getItem("leaderboardCleanedV2")) {
        localStorage.removeItem("ppgClassroomLeaderboard");
        localStorage.setItem("leaderboardCleanedV2", "true");
    }
    
    // Update level locks on startup
    updateLevelCards();
});

// --- LEVEL LOCK & SCORE PERSISTENCE UTILITIES ---
function updateLevelCards() {
    const cards = ["p1", "p2", "p3", "p4"];
    const originalContent = {
        p1: { icon: "🔬", title: "Pertemuan 1", desc: "Wujud Zat & Model Partikel" },
        p2: { icon: "🔥", title: "Pertemuan 2", desc: "Perubahan Wujud & Titik Didih/Leleh" },
        p3: { icon: "🌡️", title: "Pertemuan 3", desc: "Perubahan Fisika & Kimia" },
        p4: { icon: "☀️", title: "Pertemuan 4", desc: "Kerapatan Zat" }
    };
    
    cards.forEach(meetingId => {
        const card = document.getElementById("card-" + meetingId);
        if (!card) return;
        
        let unlocked = false;
        let alertMsg = "";
        
        if (meetingId === "p1") {
            unlocked = true;
        } else if (meetingId === "p2") {
            unlocked = true;
        } else if (meetingId === "p3") {
            const p2Completed = localStorage.getItem("p2_completed") === "true";
            const p3Accessed = localStorage.getItem("p3_accessed") === "true";
            unlocked = p2Completed || p3Accessed;
            alertMsg = "Level ini terkunci! Selesaikan Pertemuan 2 terlebih dahulu.";
        } else if (meetingId === "p4") {
            const p3Completed = localStorage.getItem("p3_completed") === "true";
            const p4Accessed = localStorage.getItem("p4_accessed") === "true";
            unlocked = p3Completed || p4Accessed;
            alertMsg = "Level ini terkunci! Selesaikan Pertemuan 3 terlebih dahulu.";
        }
        
        const orig = originalContent[meetingId];
        if (unlocked) {
            card.classList.remove("locked");
            card.setAttribute("onclick", `startMeeting('${meetingId}')`);
            card.innerHTML = `
                <div class="level-icon">${orig.icon}</div>
                <h3>${orig.title}</h3>
                <p>${orig.desc}</p>
            `;
        } else {
            card.classList.add("locked");
            card.setAttribute("onclick", `alert('${alertMsg}')`);
            card.innerHTML = `
                <div class="level-icon" style="position: relative;">
                    ${orig.icon}
                    <span style="position: absolute; bottom: 0; right: 0; font-size: 2rem; background: rgba(255,255,255,0.9); border-radius: 50%; padding: 2px;">🔒</span>
                </div>
                <h3>${orig.title} (Terkunci)</h3>
                <p>${orig.desc}</p>
            `;
        }
    });
}

function saveScoreLocal(meetingId, name, type, score) {
    if (!name || name.toLowerCase() === "guru") return;
    const scores = JSON.parse(localStorage.getItem("ppgStudentScores")) || {};
    if (!scores[meetingId]) {
        scores[meetingId] = {};
    }
    if (!scores[meetingId][name]) {
        scores[meetingId][name] = { pretest: null, posttest: null };
    }
    scores[meetingId][name][type] = score;
    localStorage.setItem("ppgStudentScores", JSON.stringify(scores));
}

function saveMeetingProgress() {
    if (!activeMeeting) return;
    const progress = {
        currentStep: currentStep,
        activeSubStep: activeSubStep,
        userAnswers: userAnswers,
        pretestCorrectCount: typeof pretestCorrectCount !== 'undefined' ? pretestCorrectCount : 0,
        currentPretestIdx: typeof currentPretestIdx !== 'undefined' ? currentPretestIdx : 0,
        pretestAnalysis: typeof pretestAnalysis !== 'undefined' ? pretestAnalysis : [],
        posttestCorrectCount: typeof posttestCorrectCount !== 'undefined' ? posttestCorrectCount : 0,
        posttestAnalysis: typeof posttestAnalysis !== 'undefined' ? posttestAnalysis : [],
        compPlayerScore: typeof compPlayerScore !== 'undefined' ? compPlayerScore : 0
    };
    localStorage.setItem(activeMeeting + "_progress", JSON.stringify(progress));
}

const DEFAULT_GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxFtPjiDgOXevfqnS9GvK4FsRW8FetqFSiiJ-otvlq7QTy6NUOPkRDOMrDLVN172xAOQg/exec";

function getGoogleSheetUrl() {
    const savedUrl = localStorage.getItem("googleSheetWebAppUrl");
    if (!savedUrl || savedUrl === "null" || savedUrl === "undefined" || !savedUrl.startsWith("https://script.google.com/macros/s/")) {
        return DEFAULT_GOOGLE_SHEET_URL;
    }
    return savedUrl;
}

// --- SETTINGS GOOGLE SHEET UTILITIES ---
function openSettings() {
    SoundEffects.playClick();
    document.getElementById("view-dashboard").classList.remove("active");
    document.getElementById("view-settings").classList.add("active");
    const url = getGoogleSheetUrl();
    document.getElementById("input-web-app-url").value = url;
}

function closeSettings() {
    SoundEffects.playClick();
    document.getElementById("view-settings").classList.remove("active");
    document.getElementById("view-dashboard").classList.add("active");
}

function updateSheetStatus() {
    const url = getGoogleSheetUrl();
    const statusText = document.getElementById("sheet-status-text");
    if (statusText) {
        if (url) {
            statusText.innerText = "✅ Terhubung ke Google Sheet secara online.";
            statusText.style.color = "var(--success)";
        } else {
            statusText.innerText = "⚠️ Google Sheet belum terhubung. Hubungkan di menu 'Hubungkan Google Sheet' di atas.";
            statusText.style.color = "#e11d48";
        }
    }
}

// --- SENDER DATA GOOGLE SHEET ---
function getMeetingTitle() {
    if (activeMeeting === "p1") return "Pertemuan 1: Wujud Zat & Model Partikel";
    if (activeMeeting === "p2") return "Pertemuan 2: Perubahan Wujud Zat, Titik Didih & Leleh";
    if (activeMeeting === "p3") return "Pertemuan 3: Perubahan Fisika, Kimia & Siklus Air";
    if (activeMeeting === "p4") return "Pertemuan 4: Kerapatan Zat (Massa Jenis)";
    return "Umum";
}

function sendDataToGoogleSheet(data) {
    const senderName = data.name || studentName || "Anonim";
    if (senderName.toLowerCase() === "guru") {
        console.log("Aktivitas guru dideteksi. Data tidak dikirim ke Google Sheet.");
        return;
    }
    const url = getGoogleSheetUrl();
    if (!url) {
        console.warn("Google Sheet Web App URL belum dikonfigurasi.");
        return;
    }
    
    const payload = {
        name: senderName,
        meeting: data.meeting || getMeetingTitle() || "Umum",
        type: data.type || "Umum",
        score: data.score !== undefined ? String(data.score) : "-",
        details: data.details || "-"
    };
    
    console.log("Mengirim data ke Google Sheet:", payload);
    
    fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "text/plain"
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        console.log("Data berhasil dikirim ke Google Sheet.");
    })
    .catch(err => {
        console.error("Gagal mengirim data ke Google Sheet:", err);
    });
}

// --- FETCH ONLINE CLASSROOM DATA ---
async function fetchOnlineClassroomData() {
    const url = getGoogleSheetUrl();
    if (!url) {
        onlineClassroomData = [];
        return [];
    }
    
    try {
        console.log("Mengambil data online dari Google Sheet...");
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fetch failed with status " + response.status);
        const data = await response.json();
        if (Array.isArray(data)) {
            onlineClassroomData = data;
            console.log("Data online berhasil disinkronisasi:", onlineClassroomData.length, "baris.");
            return data;
        }
    } catch (e) {
        console.warn("Gagal mengambil data online dari Google Sheet:", e);
    }
    return onlineClassroomData;
}

function getOnlinePosttestScores() {
    const meetingTitle = getMeetingTitle();
    const scoresMap = new Map();
    
    onlineClassroomData.forEach(row => {
        if (row.type === "Posttest" && row.meeting === meetingTitle && row.name !== studentName) {
            let gamePoints = 0;
            if (row.details) {
                const match = row.details.match(/Poin game:\s*(\d+)/);
                if (match) {
                    gamePoints = parseInt(match[1]);
                }
            }
            if (gamePoints === 0 && row.score) {
                const scoreVal = parseInt(row.score);
                if (!isNaN(scoreVal)) {
                    gamePoints = scoreVal * 10;
                }
            }
            scoresMap.set(row.name, Math.max(scoresMap.get(row.name) || 0, gamePoints));
        }
    });
    
    const bots = [];
    scoresMap.forEach((score, name) => {
        bots.push({
            name: name,
            score: score,
            accuracy: 0.8,
            thinkTime: 0,
            hasAnswered: true
        });
    });
    
    return bots;
}

async function syncOnlineData() {
    await fetchOnlineClassroomData();
    const onlineBots = getOnlinePosttestScores();
    compBots = onlineBots;
}

function getBubbleHtml(name, details) {
    let pelajari = details;
    let inginTahu = "";
    
    if (details.includes("Pelajari:") && details.includes("Ingin Tahu:")) {
        const parts = details.split("Ingin Tahu:");
        pelajari = parts[0].replace("Pelajari:", "").trim();
        if (pelajari.endsWith("|")) {
            pelajari = pelajari.slice(0, -1).trim();
        }
        inginTahu = parts[1].trim();
    }
    
    const inginTahuHtml = inginTahu ? `<br><span style="font-size:0.85rem; opacity:0.8; font-weight:700;">🔍 Ingin tahu: ${inginTahu}</span>` : "";
    return `<div class="menti-bubble">${name}: ${pelajari}${inginTahuHtml}</div>`;
}

// --- DATABASE PAPAN PERINGKAT KELAS LOCAL ---
function getMeetingTitleById(id) {
    if (id === "p1") return "Pertemuan 1: Wujud Zat & Model Partikel";
    if (id === "p2") return "Pertemuan 2: Perubahan Wujud Zat, Titik Didih & Leleh";
    if (id === "p3") return "Pertemuan 3: Perubahan Fisika, Kimia & Siklus Air";
    if (id === "p4") return "Pertemuan 4: Kerapatan Zat (Massa Jenis)";
    return "Umum";
}

function parseScoreValue(scoreStr) {
    if (!scoreStr) return 0;
    const cleanStr = String(scoreStr).trim();
    const match = cleanStr.match(/^(\d+)/);
    if (match) {
        return parseInt(match[1]);
    }
    const val = parseInt(cleanStr);
    return isNaN(val) ? 0 : val;
}

function getMergedLeaderboard(tabId) {
    const meetingTitle = getMeetingTitleById(tabId);
    const scoresMap = new Map();
    
    const updateScoreInMap = (name, type, val) => {
        if (!name || name === "Anonim" || name.toLowerCase() === "guru") return;
        if (!scoresMap.has(name)) {
            scoresMap.set(name, { pretest: null, posttest: null });
        }
        const data = scoresMap.get(name);
        if (data[type] === null || val > data[type]) {
            data[type] = val;
        }
    };

    // 1. Ambil data dari spreadsheet (onlineClassroomData)
    if (Array.isArray(onlineClassroomData)) {
        onlineClassroomData.forEach(row => {
            if (row.meeting === meetingTitle) {
                const parsedVal = parseScoreValue(row.score);
                if (row.type === "Pretest") {
                    updateScoreInMap(row.name, "pretest", parsedVal);
                } else if (row.type === "Posttest" || row.type === "Kompetisi") {
                    updateScoreInMap(row.name, "posttest", parsedVal);
                }
            }
        });
    }
    
    // 2. Ambil data dari local storage (ppgStudentScores)
    const localScores = JSON.parse(localStorage.getItem("ppgStudentScores")) || {};
    const meetingLocal = localScores[tabId] || {};
    for (const name in meetingLocal) {
        const item = meetingLocal[name];
        if (item.pretest !== null && item.pretest !== undefined) {
            updateScoreInMap(name, "pretest", item.pretest);
        }
        if (item.posttest !== null && item.posttest !== undefined) {
            updateScoreInMap(name, "posttest", item.posttest);
        }
    }
    
    // 3. Ubah Map menjadi Array & hitung Skor Akhir
    const list = [];
    scoresMap.forEach((data, name) => {
        const pre = data.pretest !== null ? data.pretest : 0;
        const post = data.posttest !== null ? data.posttest : 0;
        const finalScore = Math.round(0.3 * pre + 0.7 * post);
        list.push({
            name: name,
            pretest: pre,
            posttest: post,
            score: finalScore
        });
    });
    
    // 4. Urutkan berdasarkan skor akhir tertinggi
    list.sort((a, b) => b.score - a.score);
    return list;
}

async function openLeaderboard() {
    SoundEffects.playClick();
    document.getElementById("view-dashboard").classList.remove("active");
    document.getElementById("view-leaderboard").classList.add("active");
    
    // Tampilkan data yang ada terlebih dahulu
    switchLeaderboardTab(activeLeaderboardTab);
    
    // Sinkronisasi data terbaru dari spreadsheet secara online
    try {
        await fetchOnlineClassroomData();
        switchLeaderboardTab(activeLeaderboardTab);
    } catch (e) {
        console.warn("Gagal sinkronisasi data online papan peringkat:", e);
    }
}

function closeLeaderboard() {
    SoundEffects.playClick();
    document.getElementById("view-leaderboard").classList.remove("active");
    document.getElementById("view-dashboard").classList.add("active");
}

function switchLeaderboardTab(tabId) {
    SoundEffects.playClick();
    activeLeaderboardTab = tabId;
    
    const tabs = ["p1", "p2", "p3", "p4"];
    tabs.forEach(t => {
        document.getElementById(`btn-lead-${t}`).classList.remove("active");
    });
    document.getElementById(`btn-lead-${tabId}`).classList.add("active");
    
    const list = getMergedLeaderboard(tabId);
    
    const tbody = document.getElementById("leaderboard-rows-box");
    tbody.innerHTML = "";
    
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:15px; text-align:center; color:var(--text-muted); font-size:1.05rem;">Belum ada rekor skor dicatat.</td></tr>`;
        return;
    }
    
    list.forEach((item, idx) => {
        let rankClass = "other";
        if (idx === 0) rankClass = "gold";
        else if (idx === 1) rankClass = "silver";
        else if (idx === 2) rankClass = "bronze";
        
        let rankLabel = idx + 1;
        if (idx === 0) rankLabel = "🥇";
        else if (idx === 1) rankLabel = "🥈";
        else if (idx === 2) rankLabel = "🥉";
        
        tbody.innerHTML += `
            <tr style="border-bottom: 2px solid #f1f5f9; hover:background:#f8fafc;">
                <td style="padding:12px;"><span class="rank-badge ${rankClass}">${rankLabel}</span></td>
                <td style="padding:12px; color:var(--text);">${item.name}</td>
                <td style="padding:12px; text-align:center; color:var(--text-muted);">${item.pretest}%</td>
                <td style="padding:12px; text-align:center; color:var(--text-muted);">${item.posttest}%</td>
                <td style="padding:12px; text-align:right; color:var(--primary); font-size:1.15rem; font-weight:900;">${item.score} Poin</td>
            </tr>
        `;
    });
}

// --- ENGINE NAVIGASI UTAMA WIZARD (13 LANGKAH) ---
async function startMeeting(meetingId) {
    SoundEffects.playClick();
    activeMeeting = meetingId;
    
    // Check if there is saved progress and meeting is not completed
    const isCompleted = localStorage.getItem(meetingId + "_completed") === "true";
    const savedProgressJson = localStorage.getItem(meetingId + "_progress");
    
    if (savedProgressJson && !isCompleted) {
        try {
            const progress = JSON.parse(savedProgressJson);
            currentStep = progress.currentStep !== undefined ? progress.currentStep : 0;
            activeSubStep = progress.activeSubStep !== undefined ? progress.activeSubStep : 1;
            userAnswers = progress.userAnswers || {};
            pretestCorrectCount = progress.pretestCorrectCount !== undefined ? progress.pretestCorrectCount : 0;
            currentPretestIdx = progress.currentPretestIdx !== undefined ? progress.currentPretestIdx : 0;
            pretestAnalysis = progress.pretestAnalysis || [];
            posttestCorrectCount = progress.posttestCorrectCount !== undefined ? progress.posttestCorrectCount : 0;
            posttestAnalysis = progress.posttestAnalysis || [];
            compPlayerScore = progress.compPlayerScore !== undefined ? progress.compPlayerScore : 0;
        } catch (e) {
            console.warn("Gagal memuat progress tersimpan:", e);
            currentStep = 0;
            activeSubStep = 1;
            userAnswers = {};
        }
    } else {
        currentStep = 0;
        activeSubStep = 1;
        userAnswers = {};
    }
    
    updateStars(0);
    
    // Mark as accessed
    localStorage.setItem(meetingId + "_accessed", "true");
    updateLevelCards();
    
    studentName = localStorage.getItem("studentName") || "";
    await syncOnlineData();
    
    document.getElementById("view-dashboard").classList.remove("active");
    document.getElementById("view-meeting").classList.add("active");
    
    renderCurrentStep();
}

function exitMeeting() {
    SoundEffects.playClick();
    if (confirm("Kemajuan belajarmu di pertemuan ini akan otomatis disimpan. Apakah kamu yakin ingin keluar ke Dashboard?")) {
        clearInterval(particleInterval);
        clearInterval(compTimerInterval);
        
        document.getElementById("view-meeting").classList.remove("active");
        document.getElementById("view-dashboard").classList.add("active");
        activeMeeting = null;
        updateLevelCards();
    }
}

function updateStars(amount) {
    userStars += amount;
    localStorage.setItem("userStars", userStars);
    const starsCountEl = document.getElementById("stars-count");
    if (starsCountEl) {
        starsCountEl.innerText = userStars;
    }
    if (amount > 0) {
        SoundEffects.playStar();
    }
}

function setAvatar(mood, speechText) {
    const spriteEl = document.getElementById("avatar-sprite");
    const speechEl = document.getElementById("avatar-speech");
    if (spriteEl) {
        spriteEl.innerText = scientistAvatars[mood] || "🧑‍🔬";
    }
    if (speechEl) {
        speechEl.innerHTML = speechText;
    }
}

function updateProgressBar() {
    const fillEl = document.getElementById("meeting-progress-fill");
    const textEl = document.getElementById("meeting-progress-text");
    
    const percent = (currentStep / 14) * 100;
    if (fillEl) {
        fillEl.style.width = `${percent}%`;
    }
    if (textEl) {
        let stepNames = [
            "Splash Screen", "Stimulus Pembuka", "Apersepsi", "Motivasi Belajar", 
            "Tujuan Belajar", "Pretest Tantangan", "Stimulus Eksplorasi", "Misi Eksplorasi", 
            "Presentasi Hasil", "Penguatan Guru", "Kesimpulan", "Game Latihan", "Refleksi Mandiri", "Ujian Posttest", "Lencana Penutup"
        ];
        textEl.innerText = `Langkah ${currentStep + 1} dari 15: ${stepNames[currentStep]}`;
    }
}

function enableNextButton(btn) {
    if (btn) {
        btn.disabled = false;
        btn.classList.add("btn-unlocked-pulse");
    }
}

function disableNextButton(btn) {
    if (btn) {
        if (currentStep < maxStepReached) {
            btn.disabled = false;
            btn.classList.add("btn-unlocked-pulse");
            return;
        }
        btn.disabled = true;
        btn.classList.remove("btn-unlocked-pulse");
    }
}

function skipToPretest() {
    SoundEffects.playClick();
    currentStep = 5;
    activeSubStep = 1;
    renderCurrentStep();
}

function renderCurrentStep() {
    updateProgressBar();
    maxStepReached = Math.max(maxStepReached, currentStep);
    saveMeetingProgress();
    clearInterval(particleInterval);
    clearInterval(compTimerInterval);
    cancelAnimationFrame(activeAnimationId);
    clearInterval(missionInterval);
    
    let stepType = "";
    if (currentStep === 0) stepType = "splash";
    else if (currentStep === 1) stepType = "stimulus1";
    else if (currentStep === 2) stepType = "apersepsi";
    else if (currentStep === 3) stepType = "motivasi";
    else if (currentStep === 4) stepType = "tujuan";
    else if (currentStep === 5) stepType = "pretest";
    else if (currentStep === 6) stepType = "stimulus2";
    else if (currentStep === 7) stepType = "missions";
    else if (currentStep === 8) stepType = "presentasi";
    else if (currentStep === 9) stepType = "penguatan";
    else if (currentStep === 10) stepType = "kesimpulan";
    else if (currentStep === 11) stepType = "latihan";
    else if (currentStep === 12) stepType = "refleksi";
    else if (currentStep === 13) stepType = "posttest";
    else if (currentStep === 14) stepType = "penutup";
    
    setAvatar("thinking", stepsNarrative[stepType]);
    
    const avatarPanel = document.querySelector(".avatar-panel");
    const stepCard = document.getElementById("step-card");
    if (stepType === "penguatan" || stepType === "kesimpulan") {
        avatarPanel.style.display = "none";
        stepCard.style.width = "100%";
    } else {
        avatarPanel.style.display = "";
        stepCard.style.width = "";
    }
    
    const btnPrev = document.getElementById("btn-prev-step");
    const btnNext = document.getElementById("btn-next-step");
    const skipBtn = document.getElementById("btn-skip-pretest");
    
    if (currentStep === 0) {
        btnPrev.classList.add("hidden");
    } else {
        btnPrev.classList.remove("hidden");
    }
    
    if (currentStep >= 0 && currentStep <= 4 && activeMeeting === "p1") {
        skipBtn.classList.remove("hidden");
    } else {
        skipBtn.classList.add("hidden");
    }
    
    if (currentStep === 14) {
        btnNext.innerHTML = "Selesai Petualangan ➔";
    } else {
        btnNext.innerHTML = "Lanjut ➔";
    }
    
    enableNextButton(btnNext);
    
    const card = document.getElementById("step-card");
    card.innerHTML = "";
    
    switch(currentStep) {
        case 0:
            renderSplash(card, btnNext);
            break;
        case 1:
            renderStimulus1(card, btnNext);
            break;
        case 2:
            renderApersepsi(card, btnNext);
            break;
        case 3:
            renderMotivasi(card, btnNext);
            break;
        case 4:
            renderTujuan(card, btnNext);
            break;
        case 5:
            renderPretest(card, btnNext);
            break;
        case 6:
            renderStimulus2(card, btnNext);
            break;
        case 7:
            renderMissions(card, btnNext);
            break;
        case 8:
            renderPresentasi(card, btnNext);
            break;
        case 9:
            renderPenguatanGuru(card, btnNext);
            break;
        case 10:
            renderKesimpulan(card, btnNext);
            break;
        case 11:
            renderLatihan(card, btnNext);
            break;
        case 12:
            renderRefleksi(card, btnNext);
            break;
        case 13:
            renderPosttest(card, btnNext);
            break;
        case 14:
            renderPenutup(card, btnNext);
            break;
    }
}

function nextStep() {
    SoundEffects.playClick();
    const btnNext = document.getElementById("btn-next-step");
    
    if (currentStep === 7) {
        if (activeSubStep < 4) {
            activeSubStep++;
            renderCurrentStep();
            return;
        }
    }
    
    if (currentStep < 14) {
        currentStep++;
        activeSubStep = 1;
        renderCurrentStep();
    } else {
        document.getElementById("view-meeting").classList.remove("active");
        document.getElementById("view-dashboard").classList.add("active");
        if (activeMeeting) {
            localStorage.removeItem(activeMeeting + "_progress");
        }
        activeMeeting = null;
    }
}

function prevStep() {
    SoundEffects.playClick();
    if (currentStep === 7) {
        if (activeSubStep > 1) {
            activeSubStep--;
            renderCurrentStep();
            return;
        }
    }
    
    if (currentStep > 0) {
        currentStep--;
        if (currentStep === 7) {
            activeSubStep = 4;
        } else {
            activeSubStep = 1;
        }
        renderCurrentStep();
    }
}

// 1. Splash Screen
function renderSplash(card, btnNext) {
    enableNextButton(btnNext);
    
    let welcomeDesc = "";
    if (activeMeeting === "p1") {
        welcomeDesc = "Hari ini kita akan menyelidiki mengapa bangku kayu sekolah keras, botol air minum mengalir, dan udara balon tidak terlihat.";
    } else if (activeMeeting === "p2") {
        welcomeDesc = "Hari ini kita akan menyelidiki keajaiban lilin meleleh, air menguap mendidih, uap membeku, es kering menyublim, serta menjelajahi laboratorium suhu ekstrem dan grafik pemanasan sesuai halaman 54-60 buku!";
    } else if (activeMeeting === "p3") {
        welcomeDesc = "Hari ini kita akan menyelidiki kertas sobek vs kertas terbakar, merakit siklus air, dan mendeteksi misteri 4 tanda reaksi kimia sesuai halaman 61-67 buku!";
    } else if (activeMeeting === "p4") {
        welcomeDesc = "Hari ini kita akan membandingkan kerapatan partikel, mengukur massa jenis zat padat dan cair menggunakan hukum Archimedes, serta menyelidiki syarat benda terapung dan tenggelam sesuai halaman 67-73 buku!";
    }
    
    const storedName = localStorage.getItem("studentName") || "";
    
    let selectOptionsHtml = `<option value="" disabled ${!storedName ? 'selected' : ''}>-- Pilih Nama Lengkapmu --</option>`;
    studentNamesList.forEach(name => {
        const isSelected = (name === storedName) ? "selected" : "";
        selectOptionsHtml += `<option value="${name}" ${isSelected}>${name}</option>`;
    });

    card.innerHTML = `
        <div style="text-align: center; padding: 1rem 0;">
            <div style="font-size: 4.5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite;">🧪</div>
            <h2 style="font-size: 2.2rem; font-weight: 900; color: var(--primary); margin-bottom: 0.8rem;">Selamat Datang di Petualangan IPA!</h2>
            <p style="font-size: 1.15rem; font-weight: 600; color: var(--text-muted); line-height: 1.6; max-width: 600px; margin: 0 auto 1.5rem auto;">
                ${welcomeDesc}
            </p>
            
            <div style="background: #f8fafc; border: 3px solid #cbd5e1; border-radius: 20px; padding: 1.5rem; max-width: 450px; margin: 0 auto 2rem auto; text-align: left;">
                <label for="student-name-select" style="font-weight: 900; display: block; margin-bottom: 8px; color: var(--text); font-size: 1.05rem;">📝 Pilih Nama Lengkapmu:</label>
                <select id="student-name-select" style="width:100%; padding:14px 12px; border:3px solid #cbd5e1; border-radius:16px; font-weight:800; font-family:var(--font); font-size:1.05rem; outline:none; box-sizing: border-box; background:white; cursor:pointer;">
                    ${selectOptionsHtml}
                </select>
            </div>
            
            <button class="btn-icon" style="font-size: 1.3rem; padding: 1rem 2.5rem;" id="btn-start-welcome">Mulai Belajar ➔</button>
        </div>
    `;
    
    document.getElementById("btn-start-welcome").addEventListener("click", () => {
        const nameInput = document.getElementById("student-name-select").value;
        if (!nameInput) {
            alert("Harap pilih nama lengkapmu terlebih dahulu!");
            return;
        }
        SoundEffects.playClick();
        studentName = nameInput;
        localStorage.setItem("studentName", studentName);
        initializeCompBots();
        nextStep();
    });
}

// 2. Stimulus Pembuka (Stimulus 1)
function renderStimulus1(card, btnNext) {
    enableNextButton(btnNext);
    
    if (activeMeeting === "p3") {
        setAvatar("happy", "Ayo amati fenomena genangan air ini! Kamu juga bisa langsung mengklik Lanjut.");
        card.innerHTML = `
            <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 1rem;">☀️ Fenomena Genangan Air Menguap</h3>
            <div class="video-player-sim" id="sim-video-player-1" style="height: 240px; position:relative; overflow:hidden; border-radius:24px; border:3px solid #cbd5e1; background:#cbd5e1; display:block;">
                <canvas id="stimulus-canvas-1" style="width:100%; height:100%; display:block; background:#cbd5e1;"></canvas>
                <div id="stimulus-play-overlay-1" style="position:absolute; top:0; left:0; right:0; bottom:0; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(15, 23, 42, 0.65); color:white; font-family:var(--font); cursor:pointer; z-index:10; transition:all 0.3s ease;">
                    <div style="font-size:4rem; margin-bottom:10px;">▶</div>
                    <div style="font-weight:900; font-size:1.15rem; text-shadow:0 2px 4px rgba(0,0,0,0.5);">Klik untuk Jalankan Animasi Stimulus 🎬</div>
                </div>
            </div>
            
            <div class="hidden" id="stimulus-question-container-1" style="margin-top: 1.5rem; animation: fadeIn 0.4s ease;">
                <div style="background:#eff6ff; border:2px solid #3b82f6; border-radius:18px; padding:18px; text-align:left;">
                    <p style="font-weight:900; font-size:1.15rem; color:#1e3a8a; margin-bottom:0.8rem; display:flex; align-items:center; gap:8px;">
                        🧑‍🏫 <span>Guru Mengajukan Pertanyaan:</span>
                    </p>
                    <ul style="margin: 0; padding-left: 20px; font-weight: 800; line-height: 1.8; color: #1e293b; font-size: 1.05rem;">
                        <li>“Ke mana perginya air dari genangan tersebut?”</li>
                        <li>“Apakah air tersebut berubah menjadi zat baru?”</li>
                        <li>“Mengapa pakaian yang basah dapat menjadi kering?”</li>
                        <li>“Dari mana asal air hujan?”</li>
                    </ul>
                </div>
            </div>
        `;

        const canvas = document.getElementById("stimulus-canvas-1");
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.parentElement.clientWidth || 500;
        canvas.height = 240;

        let animStart = null;
        let vaporParticles = [];

        function runAnimation(timestamp) {
            if (!animStart) animStart = timestamp;
            let elapsed = timestamp - animStart;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw sky background (light blue)
            ctx.fillStyle = "#e0f2fe";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw ground (asphalt/concrete)
            ctx.fillStyle = "#64748b";
            ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

            // Draw ground line
            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - 40);
            ctx.lineTo(canvas.width, canvas.height - 40);
            ctx.stroke();

            // Calculate evaporation progress (lasts 8 seconds)
            let duration = 8000;
            let progress = Math.min(elapsed / duration, 1.0); // 0 to 1

            // Draw Sun ☀️ at top right
            let sunX = canvas.width - 60;
            let sunY = 60;
            let sunRadius = 25;
            
            // Sun glow
            let sunGlow = 10 + Math.sin(elapsed / 200) * 4;
            let grad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, sunRadius + sunGlow);
            grad.addColorStop(0, "#fef08a");
            grad.addColorStop(0.2, "#facc15");
            grad.addColorStop(1, "rgba(253, 224, 71, 0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius + sunGlow, 0, Math.PI * 2);
            ctx.fill();

            // Sun center
            ctx.fillStyle = "#eab308";
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            ctx.fill();

            // Sun rays
            ctx.strokeStyle = "#eab308";
            ctx.lineWidth = 3;
            let rayCount = 8;
            for (let i = 0; i < rayCount; i++) {
                let angle = (i * Math.PI * 2 / rayCount) + (elapsed / 2000);
                let startR = sunRadius + 5;
                let endR = sunRadius + 15 + Math.sin(elapsed / 100 + i) * 3;
                ctx.beginPath();
                ctx.moveTo(sunX + Math.cos(angle) * startR, sunY + Math.sin(angle) * startR);
                ctx.lineTo(sunX + Math.cos(angle) * endR, sunY + Math.sin(angle) * endR);
                ctx.stroke();
            }

            // Draw water puddle (genangan air)
            let maxPuddleWidth = canvas.width * 0.3;
            if (maxPuddleWidth > 150) maxPuddleWidth = 150;
            let maxPuddleHeight = 15;
            let currentWidth = maxPuddleWidth * (1 - progress);
            let currentHeight = maxPuddleHeight * (1 - progress);
            let puddleX = canvas.width / 2;
            let puddleY = canvas.height - 40;

            if (currentWidth > 2) {
                ctx.fillStyle = "rgba(59, 130, 246, 0.85)";
                ctx.beginPath();
                ctx.ellipse(puddleX, puddleY, currentWidth, currentHeight, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Highlight shine on water
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.beginPath();
                ctx.ellipse(puddleX - currentWidth*0.2, puddleY - currentHeight*0.2, currentWidth*0.5, currentHeight*0.3, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Generate vapor particles rising from the puddle
            if (progress < 0.95 && Math.random() < 0.15) {
                let spawnWidth = currentWidth * 0.8;
                vaporParticles.push({
                    x: puddleX + (Math.random() - 0.5) * spawnWidth,
                    y: puddleY - 5,
                    vy: -0.8 - Math.random() * 1.2,
                    vx: (Math.random() - 0.5) * 0.4,
                    alpha: 0.8,
                    size: 2 + Math.random() * 3
                });
            }

            // Update and draw vapor particles
            for (let i = vaporParticles.length - 1; i >= 0; i--) {
                let vp = vaporParticles[i];
                vp.x += vp.vx;
                vp.y += vp.vy;
                vp.alpha -= 0.01;
                
                if (vp.alpha <= 0 || vp.y < 20) {
                    vaporParticles.splice(i, 1);
                } else {
                    ctx.fillStyle = `rgba(186, 230, 253, ${vp.alpha})`;
                    ctx.beginPath();
                    ctx.arc(vp.x, vp.y, vp.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Display status text
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 13px var(--font)";
            if (progress < 1) {
                ctx.fillText("Keadaan: Panas matahari menguapkan genangan air...", 20, 30);
                ctx.fillText(`Volume Air: ${Math.round((1 - progress) * 100)}%`, 20, 50);
            } else {
                ctx.fillText("Keadaan: Genangan air menguap sepenuhnya (kering)!", 20, 30);
                ctx.fillText("Volume Air: 0%", 20, 50);
            }

            if (progress < 1) {
                activeAnimationId = requestAnimationFrame(runAnimation);
            } else {
                setAvatar("happy", "Amatilah bagaimana genangan air menguap karena panas matahari. Sekarang, coba renungkan pertanyaan dari Guru!");
            }
        }

        const playBtn1 = document.getElementById("stimulus-play-overlay-1");
        playBtn1.addEventListener("click", () => {
            SoundEffects.playClick();
            playBtn1.classList.add("hidden");
            document.getElementById("stimulus-question-container-1").classList.remove("hidden");
            setAvatar("thinking", "Perhatikan air yang menguap dari genangan akibat panas matahari!");
            activeAnimationId = requestAnimationFrame(runAnimation);
        });
        
    } else if (activeMeeting === "p4") {
        setAvatar("happy", "Ayo amati simulasi benda dalam air ini! Kamu juga bisa langsung mengklik Lanjut.");
        card.innerHTML = `
            <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 1rem;">💧 Simulasi Benda dalam Air</h3>
            <div class="video-player-sim" id="sim-video-player-1" style="height: 240px; position:relative; overflow:hidden; border-radius:24px; border:3px solid #cbd5e1; background:#f1f5f9; display:block;">
                <canvas id="stimulus-canvas-4" style="width:100%; height:100%; display:block; background:#eff6ff;"></canvas>
                <div id="stimulus-play-overlay-4" style="position:absolute; top:0; left:0; right:0; bottom:0; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(15, 23, 42, 0.65); color:white; font-family:var(--font); cursor:pointer; z-index:10; transition:all 0.3s ease;">
                    <div style="font-size:4rem; margin-bottom:10px;">▶</div>
                    <div style="font-weight:900; font-size:1.15rem; text-shadow:0 2px 4px rgba(0,0,0,0.5);">Klik untuk Jalankan Animasi Stimulus 🎬</div>
                </div>
            </div>
            
            <div class="hidden" id="stimulus-question-container-4" style="margin-top: 1.5rem; animation: fadeIn 0.4s ease;">
                <div style="background:#eff6ff; border:2px solid #3b82f6; border-radius:18px; padding:18px; text-align:left;">
                    <p style="font-weight:900; font-size:1.15rem; color:#1e3a8a; margin-bottom:0.8rem; display:flex; align-items:center; gap:8px;">
                        🧑‍🏫 <span>Guru Mengajukan Pertanyaan Pemantik:</span>
                    </p>
                    <ul style="margin: 0; padding-left: 20px; font-weight: 800; line-height: 1.8; color: #1e293b; font-size: 1.05rem;">
                        <li>“Mengapa batu tenggelam sedangkan kayu dapat mengapung?”</li>
                        <li>“Apakah benda yang lebih berat selalu tenggelam?”</li>
                        <li>“Mengapa dua benda yang ukurannya hampir sama dapat memiliki berat berbeda?”</li>
                    </ul>
                </div>
            </div>
        `;

        const canvas = document.getElementById("stimulus-canvas-4");
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.parentElement.clientWidth || 500;
        canvas.height = 240;

        let animStart = null;
        let splashParticles = [];

        // Define the 3 objects
        let objects = [
            {
                name: "Batu",
                color: "#64748b",
                shape: "stone",
                x: canvas.width * 0.25,
                y: -30,
                vy: 0,
                radius: 18,
                density: 2.5, // Sinks fast
                status: "falling",
                splashDone: false,
                settledY: 200
            },
            {
                name: "Kayu",
                color: "#b45309",
                shape: "wood",
                x: canvas.width * 0.5,
                y: -30,
                vy: 0,
                radius: 20,
                density: 0.6, // Floats half-submerged
                status: "falling",
                splashDone: false,
                settledY: 125,
                osc: 0
            },
            {
                name: "Bola Plastik",
                color: "#ef4444",
                shape: "ball",
                x: canvas.width * 0.75,
                y: -30,
                vy: 0,
                radius: 16,
                density: 0.2, // Floats high
                status: "falling",
                splashDone: false,
                settledY: 105,
                osc: 0
            }
        ];

        function createSplash(x, y) {
            for (let i = 0; i < 15; i++) {
                splashParticles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -2 - Math.random() * 4,
                    radius: 2 + Math.random() * 3,
                    alpha: 1
                });
            }
        }

        function runAnimation(timestamp) {
            if (!animStart) animStart = timestamp;
            let elapsed = timestamp - animStart;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw beaker / glass tank container
            const tankLeft = 40;
            const tankRight = canvas.width - 40;
            const tankBottom = 220;
            const waterSurfaceY = 120;

            // Draw background tank shadow
            ctx.fillStyle = "rgba(219, 234, 254, 0.3)";
            ctx.fillRect(tankLeft, waterSurfaceY, tankRight - tankLeft, tankBottom - waterSurfaceY);

            // Draw water
            ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
            ctx.fillRect(tankLeft, waterSurfaceY, tankRight - tankLeft, tankBottom - waterSurfaceY);

            // Draw water surface line
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(tankLeft, waterSurfaceY);
            ctx.lineTo(tankRight, waterSurfaceY);
            ctx.stroke();

            // Draw glass tank walls
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(tankLeft, 50);
            ctx.lineTo(tankLeft, tankBottom);
            ctx.lineTo(tankRight, tankBottom);
            ctx.lineTo(tankRight, 50);
            ctx.stroke();

            // Gravity & Physics simulation
            const gravity = 0.3;
            const dragWater = 0.85;

            objects.forEach(obj => {
                if (obj.status === "falling") {
                    obj.vy += gravity;
                    obj.y += obj.vy;

                    // Hit water surface
                    if (obj.y >= waterSurfaceY) {
                        obj.status = "in-water";
                        if (!obj.splashDone) {
                            createSplash(obj.x, waterSurfaceY);
                            SoundEffects.playClick();
                            obj.splashDone = true;
                        }
                    }
                } else if (obj.status === "in-water") {
                    // In water physics
                    if (obj.density > 1) {
                        // Sinks
                        obj.vy += (gravity * (1 - 1 / obj.density)); // Reduced acceleration in water
                        obj.vy *= dragWater;
                        obj.y += obj.vy;

                        // Hit bottom of the tank
                        let bottomLimit = tankBottom - obj.radius;
                        if (obj.y >= bottomLimit) {
                            obj.y = bottomLimit;
                            obj.vy = -obj.vy * 0.2; // Small bounce
                            if (Math.abs(obj.vy) < 0.2) {
                                obj.vy = 0;
                                obj.status = "settled";
                            }
                        }
                    } else {
                        // Floats
                        // Buoyancy force pushes up
                        let displacement = Math.min(Math.max((obj.y + obj.radius - waterSurfaceY) / (2 * obj.radius), 0), 1);
                        let buoyantForce = (1 / obj.density) * gravity * displacement;
                        
                        obj.vy += (gravity - buoyantForce);
                        obj.vy *= dragWater;
                        obj.y += obj.vy;

                        // Settle oscillation
                        if (Math.abs(obj.vy) < 0.15 && Math.abs(obj.y - obj.settledY) < 2) {
                            obj.status = "settled";
                            obj.y = obj.settledY;
                            obj.vy = 0;
                        }
                    }
                } else if (obj.status === "settled") {
                    // Small floating oscillation for wood and ball
                    if (obj.density < 1) {
                        obj.osc += 0.05;
                        obj.y = obj.settledY + Math.sin(obj.osc) * 1.5;
                    }
                }

                // Draw object
                ctx.fillStyle = obj.color;
                
                if (obj.shape === "stone") {
                    ctx.beginPath();
                    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                    ctx.fill();
                } else if (obj.shape === "wood") {
                    ctx.fillRect(obj.x - obj.radius, obj.y - obj.radius * 0.7, obj.radius * 2, obj.radius * 1.4);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#78350f";
                    ctx.strokeRect(obj.x - obj.radius, obj.y - obj.radius * 0.7, obj.radius * 2, obj.radius * 1.4);
                } else {
                    ctx.beginPath();
                    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = "rgba(255,255,255,0.4)";
                    ctx.beginPath();
                    ctx.arc(obj.x - 4, obj.y - 4, 5, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Draw labels above objects
                ctx.fillStyle = "#1e293b";
                ctx.font = "bold 12px var(--font)";
                ctx.textAlign = "center";
                ctx.fillText(obj.name, obj.x, obj.y - obj.radius - 8);
            });

            // Draw and update splash particles
            for (let i = splashParticles.length - 1; i >= 0; i--) {
                let p = splashParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // gravity for splash
                p.alpha -= 0.02;

                if (p.alpha <= 0 || p.y > tankBottom) {
                    splashParticles.splice(i, 1);
                } else {
                    ctx.fillStyle = `rgba(59, 130, 246, ${p.alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw tank labels
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 13px var(--font)";
            ctx.textAlign = "left";
            ctx.fillText("Keadaan Air", tankLeft + 15, waterSurfaceY - 10);
            
            ctx.font = "bold 12px var(--font)";
            ctx.fillStyle = "#1d4ed8";
            ctx.fillText("Massa Jenis Air = 1.0 g/cm³", tankLeft + 15, tankBottom - 15);

            // Keep animating
            let allSettled = objects.every(o => o.status === "settled");
            if (!allSettled || elapsed < 10000) {
                activeAnimationId = requestAnimationFrame(runAnimation);
            } else {
                setAvatar("happy", "Sekarang, coba diskusikan pertanyaan pemantik Guru di bawah ini!");
            }
        }

        const playBtn4 = document.getElementById("stimulus-play-overlay-4");
        playBtn4.addEventListener("click", () => {
            SoundEffects.playClick();
            playBtn4.classList.add("hidden");
            document.getElementById("stimulus-question-container-4").classList.remove("hidden");
            setAvatar("thinking", "Perhatikan bagaimana batu tenggelam, kayu terapung sebagian, dan bola plastik terapung tinggi!");
            activeAnimationId = requestAnimationFrame(runAnimation);
        });
        
    } else {
        setAvatar("happy", "Ayo amati video pembuka ini! Kamu juga bisa langsung mengklik Lanjut.");

        let mediaArt = "";
        if (activeMeeting === "p1") mediaArt = "🕰️ 🎸 🕯️ 🥤";
        else if (activeMeeting === "p2") mediaArt = "❄️ ➔ 🔥 ➔ 💧 ➔ 💨";

        card.innerHTML = `
            <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 1rem;">📺 Video Apersepsi Pembuka</h3>
            <div class="video-player-sim" id="sim-video-player-1">
                <div class="video-poster-art" id="video-poster-art-1">${mediaArt}</div>
                <button class="video-play-btn" id="video-play-btn-1">▶</button>
                <div class="video-controls">
                    <span class="video-time-label" id="video-time-label-1">0:00</span>
                    <div class="video-time-track">
                        <div class="video-time-fill" id="video-time-fill-1"></div>
                    </div>
                    <span class="video-time-label">0:10</span>
                </div>
            </div>
        `;

        const playBtn = document.getElementById("video-play-btn-1");
        const poster = document.getElementById("video-poster-art-1");
        const fill = document.getElementById("video-time-fill-1");
        const label = document.getElementById("video-time-label-1");

        playBtn.addEventListener("click", () => {
            SoundEffects.playClick();
            playBtn.classList.add("hidden");
            poster.style.transform = "scale(1.15)";
            fill.style.width = "100%";
            label.innerText = "0:10";
            setAvatar("happy", "Bagus! Kamu sudah menonton video pembuka. Klik Lanjut!");
        });
    }
}

// 3. Apersepsi
function renderApersepsi(card, btnNext) {
    disableNextButton(btnNext);

    let qData = {};
    if (activeMeeting === "p1") {
        qData = {
            question: "Berdasarkan Aktivitas 2.1 di buku, menurutmu apakah meja belajar kayu di kelas dan udara di dalam kelas kita termasuk materi?",
            options: ["Ya, keduanya materi karena bermassa dan menempati ruang", "Bukan materi"],
            correctIdx: 0,
            feedbackCorrect: "Bagus sekali! Meja kayu (padat) dan udara (gas) adalah materi karena keduanya memiliki massa dan menempati ruang (Buku IPA Halaman 46-47).",
            feedbackIncorrect: "Kurang tepat. Sebenarnya meja kayu (padat) dan udara (gas) termasuk **materi**, karena semua benda di alam semesta yang memiliki massa dan menempati ruang dikenal sebagai materi (Buku IPA Halaman 46-47)."
        };
    } else if (activeMeeting === "p2") {
        qData = {
            question: "Pernahkah kamu membantu menjemur pakaian basah? Menurutmu apa yang terjadi pada partikel air pada pakaian tersebut?",
            options: ["Air menyerap panas lalu menguap dari serat kain", "Air meresap hilang saja"],
            correctIdx: 0,
            feedbackCorrect: "Tepat! Proses ini disebut **menguap** (evaporation), di mana partikel air menyerap energi panas dari matahari dan berubah wujud menjadi uap gas.",
            feedbackIncorrect: "Kurang tepat. Air tidak hilang begitu saja, melainkan menyerap energi panas dari matahari sehingga partikel air bergerak cepat, melemahkan ikatannya, dan **menguap** ke udara sebagai gas."
        };
    } else if (activeMeeting === "p3") {
        qData = {
            question: "Jika kalian memasukkan gula pasir ke dalam segelas air hangat lalu mengaduknya, apakah yang terjadi pada zat gula?",
            options: ["Gula larut, merupakan perubahan fisika karena tidak terbentuk zat baru", "Terjadi perubahan kimia"],
            correctIdx: 0,
            feedbackCorrect: "Benar sekali! Proses melarutkan gula adalah perubahan fisika karena rasa manis gula masih ada dan gula dapat diperoleh kembali dengan menguapkan airnya (Buku Halaman 62).",
            feedbackIncorrect: "Kurang tepat. Melarutkan gula adalah **perubahan fisika** karena rasa manis gula masih ada, tidak terbentuk zat baru, dan gula dapat diperoleh kembali dengan menguapkan airnya (Buku Halaman 62)."
        };
    } else if (activeMeeting === "p4") {
        qData = {
            question: "Mengapa sebuah kapal laut feri yang sangat besar dan terbuat dari besi yang berat dapat terapung di laut, sedangkan sebutir jarum kecil dari besi langsung tenggelam?",
            options: [
                "Karena kapal feri memiliki rongga udara besar yang menurunkan massa jenis totalnya sehingga lebih kecil dari air",
                "Karena kapal feri ditarik oleh gaya gravitasi yang berbeda"
            ],
            correctIdx: 0,
            feedbackCorrect: "Tepat sekali! Kapal feri memiliki lambung berongga udara yang sangat besar, sehingga volume totalnya besar dan membuat massa jenis rata-rata kapal lebih kecil daripada massa jenis air laut. Jarum besi padat tidak memiliki rongga sehingga tenggelam.",
            feedbackIncorrect: "Kurang tepat. Kuncinya adalah **kerapatan (massa jenis)**. Kapal feri memiliki rongga udara besar yang membuat volume totalnya sangat besar, sehingga massa jenis rata-ratanya lebih kecil daripada air laut dan membuatnya terapung."
        };
    }

    card.innerHTML = `
        <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 1.2rem;">🙋 Apersepsi: Hubungkan Pengalamanmu</h3>
        <p style="font-size: 1.2rem; font-weight: 700; margin-bottom: 1.5rem; line-height: 1.5;">${qData.question}</p>
        
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:1.5rem;" id="apersepsi-options">
            <button class="quiz-btn" data-idx="0" style="text-align:left; padding:15px;">👍 ${qData.options[0]}</button>
            <button class="quiz-btn" data-idx="1" style="text-align:left; padding:15px;">👎 ${qData.options[1]}</button>
        </div>

        <div class="quiz-feedback hidden" id="apersepsi-feedback" style="padding:15px; border-radius:16px; font-weight:700; line-height:1.5;">
        </div>
    `;

    document.querySelectorAll("#apersepsi-options button").forEach(btn => {
        btn.addEventListener("click", () => {
            SoundEffects.playClick();
            document.querySelectorAll("#apersepsi-options button").forEach(b => b.disabled = true);
            
            const chosenIdx = parseInt(btn.getAttribute("data-idx"));
            const isCorrect = (chosenIdx === qData.correctIdx);
            
            const feedbackEl = document.getElementById("apersepsi-feedback");
            feedbackEl.classList.remove("hidden");
            
            if (isCorrect) {
                btn.classList.add("correct");
                feedbackEl.innerHTML = qData.feedbackCorrect;
                feedbackEl.style.background = "#dcfce7";
                feedbackEl.style.color = "#15803d";
                feedbackEl.style.border = "2px solid #bbf7d0";
                SoundEffects.playCorrect();
                updateStars(5);
                setAvatar("happy", "Terima kasih telah berbagi! Dapat ⭐ 5 Bintang Apersepsi!");
            } else {
                btn.classList.add("wrong");
                feedbackEl.innerHTML = qData.feedbackIncorrect;
                feedbackEl.style.background = "#fee2e2";
                feedbackEl.style.color = "#b91c1c";
                feedbackEl.style.border = "2px solid #fecaca";
                SoundEffects.playWrong();
                updateStars(2);
                setAvatar("sad", "Terima kasih telah menjawab! Kamu mendapat bonus ⭐ 2 Bintang partisipasi.");
            }
            enableNextButton(btnNext);
        });
    });
}

// 4. Motivasi
function renderMotivasi(card, btnNext) {
    enableNextButton(btnNext);
    let motivasiText = "";
    let animText = "";

    if (activeMeeting === "p1") {
        motivasiText = "Difusi gas terjadi sangat cepat! Aroma kopi atau masakan dapat tercium dari ruangan yang berbeda karena partikel gas bergerak acak, bertumbukan, dan menyebar cepat ke segala arah (Buku Halaman 51).";
        animText = "💨 Partikel Gas Menyebar Bebas 💨";
    } else if (activeMeeting === "p2") {
        motivasiText = "Es kering (dry ice) menyublim langsung dari padat menjadi uap gas karbon dioksida. Proses ini sering dimanfaatkan untuk efek kabut konser teater (Buku Halaman 56-57)!";
        animText = "💨 Kabut Konser Es Kering 💨";
    } else if (activeMeeting === "p3") {
        motivasiText = "Setiap reaksi kimia memiliki tanda pasti! Larutan bening timbal (II) nitrat dicampur kalium iodida secara menakjubkan berubah menghasilkan warna kuning cerah timbal (II) iodida (Buku Halaman 66)!";
        animText = "🧪 Pereaksi ➔ Produk Kuning Cerah!";
    } else if (activeMeeting === "p4") {
        motivasiText = "Di Laut Mati, kadar garam sangat tinggi sehingga airnya memiliki kerapatan (massa jenis) yang sangat besar. Manusia dapat mengapung santai sambil membaca koran tanpa takut tenggelam!";
        animText = "🌊 Mengapung Bebas di Laut Mati 🌊";
    }

    card.innerHTML = `
        <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 1.2rem;">💡 Fakta Sains Menakjubkan!</h3>
        <div style="background:#fffbeb; border:3px solid #fde047; border-radius:24px; padding:1.5rem; text-align:center; margin-bottom:1.5rem;">
            <div style="font-size: 3rem; margin-bottom: 10px;">✨</div>
            <p style="font-size: 1.2rem; font-weight: 800; color: #b45309; line-height: 1.6;">${motivasiText}</p>
        </div>
        <div class="state-indicator" style="animation: pulse 2s infinite; font-size:1.2rem;">
            ${animText}
        </div>
    `;
}

// 5. Tujuan Pembelajaran
function renderTujuan(card, btnNext) {
    enableNextButton(btnNext);
    setAvatar("happy", "Inilah target-target kekuatan sains yang siap kita taklukkan hari ini!");

    let goals = [];
    if (activeMeeting === "p1") {
        goals = [
            "Menjelaskan pengertian materi dan mengelompokkan benda di sekitar berdasarkan wujudnya",
            "Menjelaskan perbedaan sifat kompresibilitas dan perubahan bentuk zat padat, cair, dan gas",
            "Mendeskripsikan model susunan dan gerakan partikel pada wujud zat",
            "Menjelaskan proses difusi partikel dalam cairan/gas dan kaitannya dengan indera penciuman"
        ];
    } else if (activeMeeting === "p2") {
        goals = [
            "Menjelaskan 6 jenis perubahan wujud zat berdasarkan perpindahan energi panas",
            "Membedakan konsep peristiwa menguap dengan mendidih pada zat cair",
            "Membandingkan titik leleh dan titik didih beberapa materi serta menganalisis Grafik Pemanasan Air",
            "Menjelaskan alasan suhu konstan saat pelelehan dan pendidihan zat berlangsung karena pemutusan ikatan antarpartikel"
        ];
    } else if (activeMeeting === "p3") {
        goals = [
            "Membedakan ciri perubahan fisika dan perubahan kimia pada materi",
            "Menjelaskan tahapan siklus air (evaporasi, kondensasi, presipitasi, infiltrasi)",
            "Mengidentifikasi 4 tanda terjadinya reaksi kimia (warna, gas, endapan, energi)",
            "Menuliskan persamaan reaksi kata sederhana (Pereaksi ➔ Produk)"
        ];
    } else if (activeMeeting === "p4") {
        goals = [
            "Menjelaskan konsep kerapatan partikel zat padat dan zat cair (batu bata vs air)",
            "Menghitung nilai massa jenis zat menggunakan rumus &rho; = m / V",
            "Mendeskripsikan metode Archimedes untuk mengukur volume benda tidak beraturan menggunakan air yang dipindahkan",
            "Menganalisis fenomena mengapung dan tenggelam berdasarkan perbandingan massa jenis benda dan cairan (Laut Mati)"
        ];
    }

    let listHtml = goals.map((g, idx) => `
        <div class="checklist-item checked" style="cursor: default;">
            <div class="checkbox-box" style="background:var(--success); border-color:var(--success); color:white;">✔</div>
            <span style="font-weight:700;">${g}</span>
        </div>
    `).join("");

    card.innerHTML = `
        <h3 style="font-size: 1.6rem; font-weight: 900; color:var(--primary); margin-bottom: 0.5rem; text-align:center;">🎯 Target Kekuatan Sains Hari Ini</h3>
        <p style="font-weight: 700; color: var(--text-muted); margin-bottom: 1.5rem; text-align:center;">Seluruh sasaran kompetensi sudah dipersiapkan!</p>
        <div class="checklist-grid">
            ${listHtml}
        </div>
    `;
}

function renderStimulus2(card, btnNext) {
    disableNextButton(btnNext);
    setAvatar("thinking", "Silakan klik tombol play untuk melihat animasi stimulus, lalu jawab pertanyaan penyelidikan!");

    let stimulusText = "";
    let stimulusQuestion = "";
    
    if (activeMeeting === "p1") {
        stimulusText = "Bayangkan kamu masuk ke sebuah ruangan. Di salah satu sudut ruangan terdapat seseorang yang baru saja membuka botol parfum. Beberapa saat kemudian, kamu yang berada cukup jauh dari botol tersebut dapat mencium aromanya.";
        stimulusQuestion = "Mengapa aroma parfum tersebut dapat menyebar dan tercium dari jarak jauh? Jelaskan perkiraanmu terkait gerakan partikel gas parfum tersebut!";
    } else if (activeMeeting === "p2") {
        stimulusText = "Bayangkan kamu mengambil es batu dari freezer. Beberapa menit kemudian es tersebut berubah menjadi air. Jika air terus dipanaskan, air berubah menjadi uap. Namun, ketika uap mengalami pendinginan, uap dapat berubah kembali menjadi air.";
        stimulusQuestion = "Perubahan wujud apa saja yang terjadi pada peristiwa di atas? Sebutkan prosesnya secara urut!";
    } else if (activeMeeting === "p3") {
        stimulusText = "Setiap hari kita melihat berbagai perubahan. Es mencair, kertas dipotong, air mendidih, besi berkarat, makanan dimasak, dan kayu dibakar. Namun, tidak semua perubahan tersebut menghasilkan zat baru.";
        stimulusQuestion = "Kelompokkan peristiwa di atas mana yang termasuk perubahan yang menghasilkan zat baru (perubahan kimia) dan yang tidak menghasilkan zat baru (perubahan fisika)!";
    } else {
        stimulusText = "Sebuah batu kecil dapat tenggelam di dalam air, sedangkan potongan kayu yang ukurannya lebih besar dapat terapung.";
        stimulusQuestion = "Mengapa batu kecil tenggelam sedangkan kayu besar terapung? Tuliskan dugaan awalmu mengenai penyebabnya!";
    }

    card.innerHTML = `
        <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 1rem;">🔬 Penyelidikan Awal Eksplorasi</h3>
        <div class="video-player-sim" id="sim-video-player-2" style="height: 220px; position:relative; overflow:hidden; border-radius:24px; border:3px solid #cbd5e1; background:#f1f5f9;">
            <canvas id="stimulus-canvas" style="width:100%; height:100%; display:block; background:#cbd5e1;"></canvas>
            <div id="stimulus-play-overlay" style="position:absolute; top:0; left:0; right:0; bottom:0; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(15, 23, 42, 0.65); color:white; font-family:var(--font); cursor:pointer; z-index:10; transition:all 0.3s ease;">
                <div style="font-size:4rem; margin-bottom:10px;">▶</div>
                <div style="font-weight:900; font-size:1.15rem; text-shadow:0 2px 4px rgba(0,0,0,0.5);">Klik untuk Jalankan Animasi Stimulus 🎬</div>
            </div>
        </div>

        <div class="hidden" id="stimulus-question-container-2" style="margin-top: 1.5rem; animation: fadeIn 0.4s ease;">
            <div style="background:#eff6ff; border:2px solid #3b82f6; border-radius:18px; padding:15px; margin-bottom:15px; text-align:left;">
                <p style="font-weight:700; font-size:0.95rem; color:#1e293b; line-height:1.6; margin:0;">
                    📖 <strong>Stimulus Keadaan:</strong><br>${stimulusText}
                </p>
            </div>
            <p style="font-weight: 800; font-size: 1.15rem; margin-bottom: 1rem; text-align:left;">🤔 Pertanyaan Penyelidikan: ${stimulusQuestion}</p>
            <input type="text" id="stimulus-input-2" placeholder="Tuliskan pendapatmu di sini..." style="width:100%; padding:14px; border:3px solid #cbd5e1; border-radius:16px; font-family:var(--font); font-size:1rem; font-weight:800; outline:none; margin-bottom:1rem;">
            <button class="btn-icon" id="btn-submit-stimulus-2" style="width:100%;">Kirim & Buka Eksplorasi ➔</button>
        </div>
    `;

    const canvas = document.getElementById("stimulus-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 220;

    let animStart = null;
    let perfumeParticles = [];
    let roomPersonEmoji = "😐";
    let smokeParticles = [];
    let stoneY = 20;
    let woodY = 20;
    let stoneVy = 0;
    let woodVy = 0;
    let stoneLanded = false;
    let woodLanded = false;

    function runAnimation(timestamp) {
        if (!animStart) animStart = timestamp;
        let elapsed = timestamp - animStart;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (activeMeeting === "p1") {
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = "#cbd5e1";
            ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
            
            ctx.fillStyle = "#3b82f6";
            ctx.fillRect(40, canvas.height - 90, 40, 60); 
            ctx.fillStyle = "#1d4ed8";
            ctx.fillRect(50, canvas.height - 110, 20, 20); 
            
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 12px var(--font)";
            ctx.fillText("Parfum Terbuka", 15, canvas.height - 120);

            ctx.font = "40px sans-serif";
            ctx.fillText(roomPersonEmoji, canvas.width - 80, canvas.height - 50);
            ctx.font = "bold 12px var(--font)";
            ctx.fillStyle = "#1e293b";
            ctx.fillText("Kamu", canvas.width - 75, canvas.height - 100);

            if (elapsed > 500 && perfumeParticles.length < 100) {
                if (Math.random() < 0.3) {
                    perfumeParticles.push({
                        x: 60,
                        y: canvas.height - 100,
                        vx: 1.5 + Math.random() * 3,
                        vy: (Math.random() - 0.5) * 2.5,
                        color: `hsl(${270 + Math.random() * 65}, 85%, 65%)`,
                        size: 3 + Math.random() * 4
                    });
                }
            }

            let reachedCount = 0;
            perfumeParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += (Math.random() - 0.5) * 0.4;
                
                ctx.beginPath();
                ctx.fillStyle = p.color;
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                if (p.x >= canvas.width - 80) {
                    reachedCount++;
                }
            });

            if (reachedCount > 10) {
                roomPersonEmoji = "😍 🌸";
            } else if (reachedCount > 1) {
                roomPersonEmoji = "👃";
            }

        } else if (activeMeeting === "p2") {
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#ef4444";
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(canvas.width/2 - 30 + i*15, canvas.height - 20, 8 + Math.sin(elapsed/100 + i)*3, 0, Math.PI*2);
                ctx.fill();
            }

            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(canvas.width/2 - 50, 40);
            ctx.lineTo(canvas.width/2 - 50, canvas.height - 30);
            ctx.lineTo(canvas.width/2 + 50, canvas.height - 30);
            ctx.lineTo(canvas.width/2 + 50, 40);
            ctx.stroke();

            let phaseTime = (elapsed % 9000) / 1000;

            if (phaseTime < 3) {
                let melt = phaseTime / 3;
                ctx.fillStyle = "rgba(186, 230, 253, 0.85)";
                ctx.fillRect(canvas.width/2 - 40, canvas.height - 80 + 30*melt, 80, 50 - 30*melt);
                
                ctx.fillStyle = "rgba(59, 130, 246, 0.55)";
                ctx.fillRect(canvas.width/2 - 48, canvas.height - 30 - 30*melt, 96, 30*melt);

                ctx.fillStyle = "#0284c7";
                ctx.font = "bold 13px var(--font)";
                ctx.fillText("Fase: Es Mencair (Menyerap Energi) ❄️➔💧", canvas.width/2 - 120, 25);
            } else if (phaseTime < 6) {
                ctx.fillStyle = "rgba(59, 130, 246, 0.55)";
                ctx.fillRect(canvas.width/2 - 48, canvas.height - 60, 96, 30);

                ctx.fillStyle = "white";
                for(let i=0; i<6; i++) {
                    let bx = canvas.width/2 - 40 + ((i*17 + elapsed/6) % 80);
                    let by = canvas.height - 30 - ((i*12 + elapsed/2.5) % 30);
                    ctx.beginPath();
                    ctx.arc(bx, by, 3, 0, Math.PI*2);
                    ctx.fill();
                }

                ctx.fillStyle = "rgba(226, 232, 240, 0.65)";
                for(let i=0; i<10; i++) {
                    let sx = canvas.width/2 - 30 + Math.sin(elapsed/100 + i)*20;
                    let sy = canvas.height - 60 - ((i*15 + elapsed/3) % 90);
                    if (sy > 40) {
                        ctx.beginPath();
                        ctx.arc(sx, sy, 6 + Math.sin(elapsed/50)*2, 0, Math.PI*2);
                        ctx.fill();
                    }
                }

                ctx.fillStyle = "#d97706";
                ctx.font = "bold 13px var(--font)";
                ctx.fillText("Fase: Air Menguap (Menyerap Energi) 💧➔💨", canvas.width/2 - 120, 25);
            } else {
                ctx.fillStyle = "rgba(59, 130, 246, 0.55)";
                ctx.fillRect(canvas.width/2 - 48, canvas.height - 45, 96, 15);

                ctx.fillStyle = "#94a3b8";
                ctx.fillRect(canvas.width/2 - 60, 50, 120, 10);
                ctx.fillStyle = "#475569";
                ctx.font = "bold 9px var(--font)";
                ctx.fillText("KONDENSOR DINGIN", canvas.width/2 - 45, 45);

                ctx.fillStyle = "rgba(226, 232, 240, 0.65)";
                for(let i=0; i<6; i++) {
                    let sx = canvas.width/2 - 20 + Math.sin(elapsed/80 + i)*15;
                    let sy = canvas.height - 45 - ((i*20 + elapsed/4) % 110);
                    if (sy > 60) {
                        ctx.beginPath();
                        ctx.arc(sx, sy, 5, 0, Math.PI*2);
                        ctx.fill();
                    }
                }

                ctx.fillStyle = "#3b82f6";
                for(let i=0; i<3; i++) {
                    let dx = canvas.width/2 - 30 + i*30;
                    let dy = 60 + ((elapsed/3.5 + i*40) % 90);
                    if (dy < canvas.height - 45) {
                        ctx.beginPath();
                        ctx.arc(dx, dy, 4, 0, Math.PI*2);
                        ctx.fill();
                    }
                }

                ctx.fillStyle = "#059669";
                ctx.font = "bold 13px var(--font)";
                ctx.fillText("Mengembun: Uap Menjadi Air (Melepas Energi) 💨➔💧", canvas.width/2 - 145, 25);
            }

        } else if (activeMeeting === "p3") {
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(canvas.width/2, 0);
            ctx.lineTo(canvas.width/2, canvas.height);
            ctx.stroke();

            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 12px var(--font)";
            ctx.fillText("Fisika (Kertas Digunting)", 10, 20);

            let cutCycle = (elapsed % 4000) / 4000; 
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 2;
            
            if (cutCycle < 0.5) {
                ctx.fillRect(30, 80, 100, 70);
                ctx.strokeRect(30, 80, 100, 70);
                ctx.font = "24px sans-serif";
                ctx.fillText("✂️", 100 - cutCycle*60, 110);
            } else {
                let fall = (cutCycle - 0.5) * 2;
                ctx.fillRect(30 - fall*15, 80 + fall*15, 48, 70);
                ctx.strokeRect(30 - fall*15, 80 + fall*15, 48, 70);

                ctx.fillRect(82 + fall*15, 80 + fall*15, 48, 70);
                ctx.strokeRect(82 + fall*15, 80 + fall*15, 48, 70);
            }
            ctx.fillStyle = "#059669";
            ctx.font = "bold 10px var(--font)";
            ctx.fillText("Tetap kertas (Tidak ada zat baru)", 10, canvas.height - 15);

            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 12px var(--font)";
            ctx.fillText("Kimia (Kayu Dibakar)", canvas.width/2 + 10, 20);

            let burnCycle = (elapsed % 4000) / 4000;
            
            ctx.fillStyle = burnCycle < 0.7 ? "#78350f" : "#1e293b"; 
            ctx.fillRect(canvas.width/2 + 50, 120, 70, 15);
            ctx.fillRect(canvas.width/2 + 60, 108, 50, 15);

            if (burnCycle > 0.1) {
                ctx.fillStyle = `rgb(${230 + Math.random()*25}, ${100 + Math.random()*50}, 0)`;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.arc(canvas.width/2 + 65 + i*10, 110 - Math.random()*15, 8 + Math.random()*6, 0, Math.PI*2);
                    ctx.fill();
                }
                
                if (Math.random() < 0.25) {
                    smokeParticles.push({
                        x: canvas.width/2 + 60 + Math.random()*50,
                        y: 100,
                        vx: (Math.random() - 0.5)*1,
                        vy: -1.2 - Math.random()*1.5,
                        alpha: 1
                    });
                }
            }

            smokeParticles.forEach((sp, idx) => {
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.alpha -= 0.015;
                if (sp.alpha <= 0) {
                    smokeParticles.splice(idx, 1);
                } else {
                    ctx.fillStyle = `rgba(100, 116, 139, ${sp.alpha})`;
                    ctx.beginPath();
                    ctx.arc(sp.x, sp.y, 4 + (1 - sp.alpha)*8, 0, Math.PI*2);
                    ctx.fill();
                }
            });

            ctx.fillStyle = "#dc2626";
            ctx.font = "bold 10px var(--font)";
            ctx.fillText("Menghasilkan zat baru (Abu/Asap)", canvas.width/2 + 10, canvas.height - 15);

        } else {
            ctx.fillStyle = "#eff6ff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let waterTopY = 110;
            ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
            ctx.fillRect(0, waterTopY, canvas.width, canvas.height - waterTopY);
            
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, waterTopY);
            ctx.lineTo(canvas.width, waterTopY);
            ctx.stroke();

            if (elapsed % 6000 < 50) {
                stoneY = 20;
                woodY = 20;
                stoneVy = 0;
                woodVy = 0;
                stoneLanded = false;
                woodLanded = false;
            }

            if (!stoneLanded) {
                stoneVy += 0.2;
                if (stoneY >= waterTopY) {
                    stoneVy *= 0.65;
                }
                stoneY += stoneVy;
                if (stoneY >= canvas.height - 20) {
                    stoneY = canvas.height - 20;
                    stoneLanded = true;
                }
            }
            
            if (!woodLanded) {
                woodVy += 0.15;
                if (woodY >= waterTopY - 15) {
                    let depth = woodY - (waterTopY - 15);
                    woodVy -= depth * 0.08;
                    woodVy *= 0.85;
                }
                woodY += woodVy;
            }

            ctx.fillStyle = "#64748b";
            ctx.beginPath();
            ctx.arc(canvas.width/3, stoneY, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px var(--font)";
            ctx.fillText("Batu", canvas.width/3 - 10, stoneY + 3);

            ctx.fillStyle = "#b45309";
            ctx.fillRect(canvas.width * 2/3 - 25, woodY, 50, 30);
            ctx.strokeStyle = "#78350f";
            ctx.strokeRect(canvas.width * 2/3 - 25, woodY, 50, 30);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px var(--font)";
            ctx.fillText("Kayu", canvas.width * 2/3 - 11, woodY + 18);

            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 11px var(--font)";
            ctx.fillText("Batu Kecil: TENGGELAM (Massa Jenis Air < Batu)", 10, waterTopY - 45);
            ctx.fillText("Kayu Besar: TERAPUNG (Massa Jenis Air > Kayu)", 10, waterTopY - 25);
        }

        activeAnimationId = requestAnimationFrame(runAnimation);
    }

    document.getElementById("stimulus-play-overlay").addEventListener("click", () => {
        SoundEffects.playClick();
        document.getElementById("stimulus-play-overlay").style.display = "none";
        document.getElementById("stimulus-question-container-2").classList.remove("hidden");
        setAvatar("happy", "Perhatikan jalannya simulasi sains tersebut dengan seksama!");
        activeAnimationId = requestAnimationFrame(runAnimation);
    });

    document.getElementById("btn-submit-stimulus-2").addEventListener("click", () => {
        const val = document.getElementById("stimulus-input-2").value.trim();
        if (val.length < 3) {
            alert("Tuliskan pendapatmu dulu ya!");
            return;
        }
        cancelAnimationFrame(activeAnimationId);
        updateStars(10);
        sendDataToGoogleSheet({
            type: "Penyelidikan Awal",
            score: "-",
            details: val
        });
        setAvatar("celebrate", "Pendapatmu direkam! Laboratorium Eksplorasi telah dibuka. Klik Lanjut!");
        enableNextButton(btnNext);
    });
}

// 6. Pretest
let currentPretestIdx = 0;
let pretestCorrectCount = 0;
function renderPretest(card, btnNext) {
    const localScores = JSON.parse(localStorage.getItem("ppgStudentScores")) || {};
    const studentMeetingScores = (localScores[activeMeeting] && localScores[activeMeeting][studentName]) || {};
    const hasCompletedPretest = studentMeetingScores.pretest !== undefined && studentMeetingScores.pretest !== null;
    
    if (hasCompletedPretest || currentStep < maxStepReached) {
        enableNextButton(btnNext);
        const pretestScoreVal = studentMeetingScores.pretest || 0;
        card.innerHTML = `
            <div style="text-align:center; padding: 1rem 0; max-height:550px; overflow-y:auto;">
                <div style="font-size: 5rem; margin-bottom: 1rem;">🧠</div>
                <h3 style="font-size: 1.8rem; font-weight: 900; color: var(--primary); margin-bottom: 0.5rem;">Pretest Selesai!</h3>
                <div style="background:var(--primary-light); color:var(--primary); font-size:2rem; font-weight:900; padding:10px 20px; border-radius:15px; display:inline-block; margin-bottom:1.2rem; border:2px solid var(--primary);">
                    Nilai: ${pretestScoreVal} / 100
                </div>
                <p style="font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 1.5rem;">
                    Uji kekuatan awal selesai. Nilai Anda sudah tersimpan.<br>
                </p>
                <button class="btn-icon" id="btn-pretest-finish" style="width:100%;">Lanjut ke Penyelidikan Awal ➔</button>
            </div>
        `;
        document.getElementById("btn-pretest-finish").addEventListener("click", () => {
            nextStep();
        });
        return;
    }
    
    btnNext.disabled = true;
    
    // Load pretest progress if it exists in saved progress
    const savedProgressJson = localStorage.getItem(activeMeeting + "_progress");
    let loadedPretest = false;
    if (savedProgressJson) {
        try {
            const progress = JSON.parse(savedProgressJson);
            if (progress.currentStep === 5 && progress.currentPretestIdx !== undefined) {
                currentPretestIdx = progress.currentPretestIdx;
                pretestCorrectCount = progress.pretestCorrectCount;
                pretestAnalysis = progress.pretestAnalysis || [];
                loadedPretest = true;
            }
        } catch (e) {}
    }
    
    if (!loadedPretest) {
        currentPretestIdx = 0;
        pretestCorrectCount = 0;
        pretestAnalysis = [];
    }
    
    showPretestQuestion(card, btnNext);
}

function showPretestQuestion(card, btnNext) {
    const list = meetingsConfig[activeMeeting].pretest;
    const item = list[currentPretestIdx];
    
    setAvatar("thinking", `Pertanyaan ${currentPretestIdx + 1} dari ${list.length}. Pilih jawaban terbaikmu!`);

    let optionsHtml = item.a.map((ans, idx) => `
        <button class="quiz-btn" style="text-align:left; padding:12px 18px;" id="pretest-opt-${idx}" onclick="selectPretest(${idx})">
            ${String.fromCharCode(65 + idx)}. ${ans}
        </button>
    `).join("");

    card.innerHTML = `
        <div class="test-quiz-progress">Tantangan Pretest: Soal ${currentPretestIdx + 1}/${list.length}</div>
        <div class="question-text">${item.q}</div>
        <div style="display:flex; flex-direction:column; gap:10px;" id="pretest-choices-box">
            ${optionsHtml}
        </div>
        <div class="quiz-feedback hidden" id="pretest-feedback-box" style="margin-top:15px; padding:15px; border-radius:16px; font-weight:700;"></div>
        <button class="btn-icon hidden" id="btn-next-pretest-question" style="width:100%; margin-top:15px;">Lanjut ➔</button>
    `;
}

function selectPretest(idx) {
    const list = meetingsConfig[activeMeeting].pretest;
    const item = list[currentPretestIdx];
    
    const buttons = document.querySelectorAll("#pretest-choices-box button");
    buttons.forEach(b => b.disabled = true);
    
    const isCorrect = (idx === item.c);
    
    if (isCorrect) {
        SoundEffects.playCorrect();
        pretestCorrectCount++;
        document.getElementById(`pretest-opt-${idx}`).classList.add("correct");
    } else {
        SoundEffects.playWrong();
        document.getElementById(`pretest-opt-${idx}`).classList.add("wrong");
        document.getElementById(`pretest-opt-${item.c}`).classList.add("correct");
    }
    
    const chosenChar = String.fromCharCode(65 + idx);
    const correctChar = String.fromCharCode(65 + item.c);
    pretestAnalysis.push(`No ${currentPretestIdx + 1}: ${isCorrect ? '✅ Benar' : `❌ Salah (Pilih: ${chosenChar}, Kunci: ${correctChar})`}`);
    
    const feedbackBox = document.getElementById("pretest-feedback-box");
    const nextBtn = document.getElementById("btn-next-pretest-question");
    
    feedbackBox.classList.remove("hidden");
    nextBtn.classList.remove("hidden");
    
    if (isCorrect) {
        feedbackBox.className = "quiz-feedback success-msg";
        feedbackBox.innerHTML = `🎉 <strong>Jawabanmu Benar!</strong>`;
        feedbackBox.style.background = "#dcfce7";
        feedbackBox.style.color = "#15803d";
        feedbackBox.style.border = "2px solid #bbf7d0";
        setAvatar("celebrate", "Bagus sekali! Jawabanmu tepat.");
    } else {
        feedbackBox.className = "quiz-feedback error-msg";
        feedbackBox.innerHTML = `❌ <strong>Kurang Tepat!</strong> Jawaban yang benar: <strong>${correctChar}. ${item.a[item.c]}</strong>`;
        feedbackBox.style.background = "#fee2e2";
        feedbackBox.style.color = "#b91c1c";
        feedbackBox.style.border = "2px solid #fecaca";
        setAvatar("sad", "Kurang tepat, tapi tetap semangat belajar!");
    }
    
    nextBtn.addEventListener("click", () => {
        SoundEffects.playClick();
        if (currentPretestIdx < list.length - 1) {
            currentPretestIdx++;
            saveMeetingProgress();
            showPretestQuestion(document.getElementById("step-card"), document.getElementById("btn-next-step"));
        } else {
            updateStars(15);
            const pretestTotalQ = list.length;
            const pretestScoreVal = Math.round((pretestCorrectCount / pretestTotalQ) * 100);
            saveScoreLocal(activeMeeting, studentName, "pretest", pretestScoreVal);
            enableNextButton(document.getElementById("btn-next-step"));
            sendDataToGoogleSheet({
                type: "Pretest",
                score: pretestScoreVal + "/100",
                details: `Jawaban benar: ${pretestCorrectCount} dari ${pretestTotalQ} soal. Analisis: ${pretestAnalysis.join(", ")}`
            });
            
            let analysisHtml = pretestAnalysis.map((item, idx) => {
                const isCorrect = item.includes("✅ Benar");
                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:${isCorrect ? '#f0fdf4' : '#fef2f2'}; border:1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}; border-radius:10px; font-size:0.95rem; font-weight:700; color:${isCorrect ? '#15803d' : '#b91c1c'};">
                        <span>Soal No. ${idx + 1}</span>
                        <span>${isCorrect ? '✅ Benar' : '❌ Salah'}</span>
                    </div>
                `;
            }).join("");

            document.getElementById("step-card").innerHTML = `
                <div style="text-align:center; padding: 1rem 0; max-height:550px; overflow-y:auto;">
                    <div style="font-size: 5rem; margin-bottom: 1rem;">🧠</div>
                    <h3 style="font-size: 1.8rem; font-weight: 900; color: var(--primary); margin-bottom: 0.5rem;">Pretest Selesai!</h3>
                    <div style="background:var(--primary-light); color:var(--primary); font-size:2rem; font-weight:900; padding:10px 20px; border-radius:15px; display:inline-block; margin-bottom:1.2rem; border:2px solid var(--primary);">
                        Nilai: ${pretestScoreVal} / 100
                    </div>
                    <p style="font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 1.5rem;">
                        Bagus sekali! Uji kekuatan awal selesai. Kamu mendapatkan bonus ⭐ 15 Bintang!<br>
                    </p>
                    
                    <div style="text-align:left; background:#f8fafc; border:2px solid #e2e8f0; border-radius:20px; padding:15px; margin-bottom:1.5rem; max-height: 250px; overflow-y: auto;">
                        <h4 style="font-weight:900; color:var(--text); margin-top:0; margin-bottom:10px; font-size:1rem; border-bottom:2px solid #cbd5e1; padding-bottom:5px;">📊 Analisis Jawaban Per Nomor:</h4>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${analysisHtml}
                        </div>
                    </div>
                    
                    <button class="btn-icon" id="btn-pretest-finish" style="width:100%;">Lanjut ke Penyelidikan Awal ➔</button>
                </div>
            `;
            document.getElementById("btn-pretest-finish").addEventListener("click", () => {
                nextStep();
            });
        }
    });
}

// 7. Misi Eksplorasi (Sub-wizard - 4 Level)
function renderMissions(card, btnNext) {
    enableNextButton(btnNext);
    
    let stepperHtml = `
        <div class="mission-stepper">
            <div class="mission-dot ${activeSubStep === 1 ? 'active' : (activeSubStep > 1 ? 'completed' : '')}"></div>
            <div class="mission-dot ${activeSubStep === 2 ? 'active' : (activeSubStep > 2 ? 'completed' : '')}"></div>
            <div class="mission-dot ${activeSubStep === 3 ? 'active' : (activeSubStep > 3 ? 'completed' : '')}"></div>
            <div class="mission-dot ${activeSubStep === 4 ? 'active' : (activeSubStep > 4 ? 'completed' : '')}"></div>
        </div>
        <h4 style="text-align:center; font-weight:850; color:var(--secondary); margin-bottom:1.5rem; font-size:1.2rem;">
            Tantangan Eksplorasi: Misi Ke-${activeSubStep} dari 4
        </h4>
    `;
    
    const wrapper = document.createElement("div");
    wrapper.innerHTML = stepperHtml;
    card.appendChild(wrapper);
    
    if (activeMeeting === "p1") {
        renderP1Missions(wrapper, btnNext);
    } else if (activeMeeting === "p2") {
        renderP2Missions(wrapper, btnNext);
    } else if (activeMeeting === "p3") {
        renderP3Missions(wrapper, btnNext);
    } else if (activeMeeting === "p4") {
        renderP4Missions(wrapper, btnNext);
    }
}

// --- SUB MISI PERTEMUAN 1 ---
function renderP1Missions(wrapper, btnNext) {
    if (activeSubStep === 1) {
        setAvatar("thinking", "Seret 3 benda sekolah di bawah ke keranjang wujud padat, cair, atau gas di dalam kelas yang tepat!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div class="classroom-bg">
                <div class="school-board">
                    <h4>Papan Tulis Sekolah</h4>
                    Aktivitas 2.2: Kelompokkan 3 Benda Sekolah!
                </div>
                
                <div class="items-container" id="p1-items-box" style="justify-content:center; gap:20px; margin-bottom:20px;"></div>
                
                <div class="desks-row">
                    <div class="classroom-desk drop-zone" id="zone-padat" style="width:120px; height:60px;">
                        <span style="font-size:0.85rem; font-weight:900; color:white; display:block; text-align:center; margin-top:5px;">MEJA PADAT</span>
                    </div>
                    <div class="classroom-desk drop-zone" id="zone-cair" style="width:120px; height:60px;">
                        <span style="font-size:0.85rem; font-weight:900; color:white; display:block; text-align:center; margin-top:5px;">GELAS CAIR</span>
                    </div>
                    <div class="classroom-desk drop-zone" id="zone-gas" style="width:120px; height:60px;">
                        <span style="font-size:0.85rem; font-weight:900; color:white; display:block; text-align:center; margin-top:5px;">BALON GAS</span>
                    </div>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        const items = [
            { id: "meja", text: "Meja Belajar 🪑", type: "padat" },
            { id: "air", text: "Air Botol 🥛", type: "cair" },
            { id: "balon", text: "Balon Udara 🎈", type: "gas" }
        ];
        
        let selectedItem = null;
        const itemsBox = document.getElementById("p1-items-box");
        items.sort(() => Math.random() - 0.5).forEach(item => {
            let div = document.createElement("div");
            div.className = "drag-item";
            div.draggable = true;
            div.id = item.id;
            div.innerText = item.text;
            div.dataset.type = item.type;
            
            div.addEventListener("dragstart", e => {
                SoundEffects.playClick();
                e.dataTransfer.setData("text/plain", e.target.id);
                document.querySelectorAll(".drag-item").forEach(el => {
                    el.style.border = "";
                    el.style.boxShadow = "";
                });
                selectedItem = div;
            });
            
            // Touch/Tap click selection fallback
            div.addEventListener("click", () => {
                SoundEffects.playClick();
                document.querySelectorAll(".drag-item").forEach(el => {
                    el.style.border = "";
                    el.style.boxShadow = "";
                });
                div.style.border = "3px solid #3b82f6";
                div.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.5)";
                selectedItem = div;
            });
            
            itemsBox.appendChild(div);
        });
        
        let correctCount = 0;
        document.querySelectorAll(".drop-zone").forEach(zone => {
            zone.addEventListener("dragover", e => e.preventDefault());
            zone.addEventListener("drop", e => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                const el = document.getElementById(id);
                if (!el) return;
                handleMatch(el, zone);
            });
            
            // Touch/Tap drop zone fallback
            zone.addEventListener("click", () => {
                if (!selectedItem) return;
                handleMatch(selectedItem, zone);
            });
        });
        
        function handleMatch(el, zone) {
            const targetType = zone.id.replace("zone-", "");
            if (el.dataset.type === targetType) {
                SoundEffects.playCorrect();
                zone.appendChild(el);
                el.classList.add("correct");
                el.draggable = false;
                el.style.border = "";
                el.style.boxShadow = "";
                selectedItem = null;
                correctCount++;
                updateStars(10);
                setAvatar("celebrate", "Hebat! Klasifikasimu benar!");
                
                if (correctCount === items.length) {
                    enableNextButton(btnNext);
                    setAvatar("celebrate", "Sempurna! Semua benda sekolah sudah di kelompoknya. Klik Lanjut!");
                }
            } else {
                SoundEffects.playWrong();
                el.classList.add("wrong");
                setAvatar("sad", "Salah meja kelompok! Coba teliti lagi wujudnya.");
                setTimeout(() => el.classList.remove("wrong"), 1000);
            }
        }
        
    } else if (activeSubStep === 2) {
        setAvatar("thinking", "Merger Lab Piston & Partikel: Pilih zat di bawah (Padat, Cair, atau Gas), lalu klik tombol 'Tekan Piston / Jalankan Animasi!' untuk melihat efek kompresi!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:20px; margin: 1.5rem 0;">
                <div style="display:flex; gap:15px; flex-wrap:wrap; justify-content:center;">
                    <div class="syringe-container" style="width:150px; padding:10px; margin:0;">
                        <div class="syringe-visual" style="height:150px; width:45px; position:relative;">
                            <div class="syringe-plunger" id="syringe-plunger" style="bottom: 85%; transition: none;">
                                <div class="plunger-handle"></div>
                                <div class="plunger-seal"></div>
                            </div>
                            <div class="syringe-fluid" id="syringe-fluid" style="height: 85%; background: #fcd34d; transition: none;"></div>
                        </div>
                    </div>
                    <div class="simulation-panel" style="flex:1; min-width:200px; height:170px;">
                        <canvas id="canvas-misi-p1" style="height:160px; width:100%;"></canvas>
                    </div>
                </div>
                
                <div class="syringe-buttons" style="justify-content:center;">
                    <button class="btn-syringe-opt active" id="btn-part-padat">🧱 Padat (Pasir)</button>
                    <button class="btn-syringe-opt" id="btn-part-cair">💧 Cair (Air)</button>
                    <button class="btn-syringe-opt" id="btn-part-gas">💨 Gas (Udara)</button>
                </div>
                
                <button class="btn-icon btn-syringe-press" id="btn-press-syringe" style="margin: 0 auto; display:block;">Tekan Piston / Jalankan Animasi! 👆</button>
                <p id="syringe-feedback-text" style="font-weight:700; color:var(--primary); text-align:center; min-height:40px;"></p>
                
                <table class="difference-table">
                    <thead>
                        <tr>
                            <th>Wujud Zat</th>
                            <th>Bentuk & Volume</th>
                            <th>Dapat Ditekan?</th>
                            <th>Keadaan Partikel</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr id="tr-padat">
                            <td data-label="Wujud Zat">🧱 Padat</td>
                            <td data-label="Bentuk & Volume">Bentuk & Volume Tetap</td>
                            <td data-label="Dapat Ditekan?">Tidak dapat ditekan</td>
                            <td data-label="Keadaan Partikel">Rapat teratur, berikatan kuat, bergetar</td>
                        </tr>
                        <tr id="tr-cair">
                            <td data-label="Wujud Zat">💧 Cair</td>
                            <td data-label="Bentuk & Volume">Bentuk Berubah, Volume Tetap</td>
                            <td data-label="Dapat Ditekan?">Sangat sulit ditekan</td>
                            <td data-label="Keadaan Partikel">Agak renggang, bergeser terbatas</td>
                        </tr>
                        <tr id="tr-gas">
                            <td data-label="Wujud Zat">💨 Gas</td>
                            <td data-label="Bentuk & Volume">Bentuk & Volume Berubah</td>
                            <td data-label="Dapat Ditekan?">Sangat mudah ditekan</td>
                            <td data-label="Keadaan Partikel">Sangat renggang, bebas bergerak cepat</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        wrapper.appendChild(container);
        
        const canvas = document.getElementById("canvas-misi-p1");
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 160;
        
        const plunger = document.getElementById("syringe-plunger");
        const fluid = document.getElementById("syringe-fluid");
        const feedback = document.getElementById("syringe-feedback-text");
        
        let currentState = "padat";
        let isAnimating = false;
        let animStartTime = null;
        let particles = [];
        let tested = new Set();
        
        function playPistonSound() {
            initAudio();
            if (!audioCtx) return;
            try {
                let t = audioCtx.currentTime;
                let bufferSize = audioCtx.sampleRate * 0.8;
                let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                let data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                let noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                
                let filter = audioCtx.createBiquadFilter();
                filter.type = "bandpass";
                filter.frequency.setValueAtTime(1200, t);
                filter.frequency.exponentialRampToValueAtTime(150, t + 0.8);
                filter.Q.setValueAtTime(4, t);
                
                let gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.005, t + 0.8);
                
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                
                noise.start(t);
            } catch (e) {
                console.log("Audio play failed: ", e);
            }
        }
        
        function updateVisuals() {
            // Reset to uncompressed top position
            plunger.style.transition = "none";
            fluid.style.transition = "none";
            plunger.style.bottom = "85%";
            fluid.style.height = "85%";
            
            if (currentState === "padat") {
                fluid.style.background = "#fcd34d";
                feedback.innerText = "Zat terpilih: Padat (Pasir). Klik 'Tekan Piston / Jalankan Animasi!' di bawah.";
                highlightTableRow("tr-padat");
            } else if (currentState === "cair") {
                fluid.style.background = "#93c5fd";
                feedback.innerText = "Zat terpilih: Cair (Air). Klik 'Tekan Piston / Jalankan Animasi!' di bawah.";
                highlightTableRow("tr-cair");
            } else {
                fluid.style.background = "#cbd5e1";
                feedback.innerText = "Zat terpilih: Gas (Udara). Klik 'Tekan Piston / Jalankan Animasi!' di bawah.";
                highlightTableRow("tr-gas");
            }
            initMisiParticles();
        }
        
        function highlightTableRow(rowId) {
            document.querySelectorAll(".difference-table tbody tr").forEach(tr => {
                tr.style.background = "white";
                tr.style.color = "var(--text)";
            });
            const activeRow = document.getElementById(rowId);
            if (activeRow) {
                activeRow.style.background = "#eff6ff";
                activeRow.style.color = "var(--primary)";
            }
        }
        
        function initMisiParticles() {
            particles = [];
            let targetBottom = 85;
            if (currentState === "padat") targetBottom = 80;
            else if (currentState === "cair") targetBottom = 70;
            else targetBottom = 15;

            let startYLimit = canvas.height * 0.15; // Plunger at 85% means fluid top is 15% from top of canvas
            let endYLimit = canvas.height * (1 - targetBottom / 100);

            if (currentState === "padat") {
                let cols = 8;
                let rows = 4;
                let spacingX = (canvas.width - 40) / cols;
                let spacingYStart = (canvas.height - startYLimit - 20) / rows;
                let spacingYEnd = (canvas.height - endYLimit - 20) / rows;

                for (let i = 0; i < 32; i++) {
                    let r = i % cols;
                    let c = Math.floor(i / cols);
                    let x = 20 + r * spacingX + (Math.random() - 0.5) * 2;
                    let yStart = startYLimit + 10 + c * spacingYStart;
                    let yEnd = endYLimit + 10 + c * spacingYEnd;
                    particles.push({
                        x: x,
                        y: yStart,
                        yStart: yStart,
                        yEnd: yEnd,
                        baseX: x,
                        baseY: yEnd
                    });
                }
            } else if (currentState === "cair") {
                for (let i = 0; i < 30; i++) {
                    let x = 15 + Math.random() * (canvas.width - 30);
                    let yStart = startYLimit + 10 + Math.random() * (canvas.height - startYLimit - 25);
                    let yEnd = endYLimit + 10 + Math.random() * (canvas.height - endYLimit - 25);
                    particles.push({
                        x: x,
                        y: yStart,
                        yStart: yStart,
                        yEnd: yEnd,
                        vx: (Math.random() - 0.5) * 1.2,
                        vy: (Math.random() - 0.5) * 0.4
                    });
                }
            } else {
                for (let i = 0; i < 15; i++) {
                    let x = 15 + Math.random() * (canvas.width - 30);
                    let yStart = startYLimit + 10 + Math.random() * (canvas.height - startYLimit - 25);
                    let yEnd = endYLimit + 10 + Math.random() * (canvas.height - endYLimit - 25);
                    particles.push({
                        x: x,
                        y: yStart,
                        yStart: yStart,
                        yEnd: yEnd,
                        vx: (Math.random() - 0.5) * 3.5,
                        vy: (Math.random() - 0.5) * 3.5
                    });
                }
            }
        }
        
        function drawParticles(tVal) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = currentState === "padat" ? "#eab308" : (currentState === "cair" ? "#3b82f6" : "#94a3b8");
            
            let targetBottom = 85;
            if (currentState === "padat") targetBottom = 80;
            else if (currentState === "cair") targetBottom = 70;
            else targetBottom = 15;
            
            let currentPct = 85 - (85 - targetBottom) * tVal;
            let currentTopY = canvas.height * (1 - currentPct / 100);

            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
                
                if (tVal < 1) {
                    p.y = p.yStart + (p.yEnd - p.yStart) * tVal;
                    if (currentState === "gas" || currentState === "cair") {
                        p.x += (Math.random() - 0.5) * 1.5;
                        if (p.x < 10) p.x = 10;
                        if (p.x > canvas.width - 10) p.x = canvas.width - 10;
                    }
                } else {
                    if (currentState === "padat") {
                        p.x = p.baseX + (Math.random() - 0.5) * 1.5;
                        p.y = p.baseY + (Math.random() - 0.5) * 1.5;
                    } else {
                        p.x += p.vx;
                        p.y += p.vy;
                        if (p.x < 10 || p.x > canvas.width - 10) p.vx *= -1;
                        if (p.y < currentTopY + 8) {
                            p.y = currentTopY + 8;
                            p.vy *= -1;
                        }
                        if (p.y > canvas.height - 10) {
                            p.y = canvas.height - 10;
                            p.vy *= -1;
                        }
                    }
                }
            });
        }
        
        function tick(timestamp) {
            if (!animStartTime) animStartTime = timestamp;
            let elapsed = timestamp - animStartTime;
            let duration = 1200;
            let progress = Math.min(1, elapsed / duration);
            
            let targetBottom = 85;
            if (currentState === "padat") targetBottom = 80;
            else if (currentState === "cair") targetBottom = 70;
            else targetBottom = 15;
            
            let currentPct = 85 - (85 - targetBottom) * progress;
            plunger.style.bottom = currentPct + "%";
            fluid.style.height = currentPct + "%";
            
            drawParticles(progress);
            
            if (progress < 1) {
                activeAnimationId = requestAnimationFrame(tick);
            } else {
                isAnimating = false;
                if (currentState === "padat") {
                    feedback.innerText = "Padat: Piston tidak bisa ditekan karena partikelnya tersusun rapat tanpa sela.";
                } else if (currentState === "cair") {
                    feedback.innerText = "Cair: Piston sangat sulit ditekan karena jarak partikelnya sudah cukup berdekatan.";
                } else {
                    feedback.innerText = "Gas: Piston sangat mudah ditekan karena jarak partikelnya sangat jauh (banyak ruang kosong).";
                }
                
                function loopPhysics() {
                    if (isAnimating) return;
                    drawParticles(1);
                    activeAnimationId = requestAnimationFrame(loopPhysics);
                }
                loopPhysics();
            }
        }
        
        function selectState(state) {
            cancelAnimationFrame(activeAnimationId);
            isAnimating = false;
            animStartTime = null;
            currentState = state;
            updateVisuals();
            drawParticles(0);
        }
        
        document.getElementById("btn-part-padat").addEventListener("click", () => {
            SoundEffects.playClick();
            resetPartBtn();
            document.getElementById("btn-part-padat").classList.add("active");
            selectState("padat");
        });
        document.getElementById("btn-part-cair").addEventListener("click", () => {
            SoundEffects.playClick();
            resetPartBtn();
            document.getElementById("btn-part-cair").classList.add("active");
            selectState("cair");
        });
        document.getElementById("btn-part-gas").addEventListener("click", () => {
            SoundEffects.playClick();
            resetPartBtn();
            document.getElementById("btn-part-gas").classList.add("active");
            selectState("gas");
        });
        
        function resetPartBtn() {
            document.querySelectorAll(".btn-syringe-opt").forEach(b => b.classList.remove("active"));
        }
        
        document.getElementById("btn-press-syringe").addEventListener("click", () => {
            if (isAnimating) return;
            SoundEffects.playClick();
            playPistonSound();
            
            cancelAnimationFrame(activeAnimationId);
            animStartTime = null;
            isAnimating = true;
            requestAnimationFrame(tick);
            
            tested.add(currentState);
            if (tested.size === 3) {
                enableNextButton(btnNext);
                updateStars(15);
                setAvatar("celebrate", "Luar biasa! Kamu sudah menguji ketiga wujud zat dan membaca tabel perbedaannya. Klik Lanjut!");
            } else {
                setAvatar("thinking", `Hebat! Kamu sudah menguji wujud ${currentState.toUpperCase()} (${tested.size}/3 wujud). Ayo uji wujud zat lainnya!`);
            }
        });
        
        updateVisuals();
        drawParticles(0);
        
    } else if (activeSubStep === 3) {
        setAvatar("thinking", "Ayo lakukan simulasi difusi teh celup dalam air panas! Celupkan teh untuk melihat partikel menyebar secara alami.");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:15px; margin: 1.5rem 0;">
                <div style="background:#f8fafc; border:3px solid #cbd5e1; border-radius:24px; padding:15px; width:100%; text-align:left;">
                    <p style="font-weight:800; font-size:1.1rem; color:var(--primary); margin-bottom:8px;">💡 Apa itu Difusi?</p>
                    <p style="font-weight:700; line-height:1.5; color:var(--text); font-size:0.95rem;">
                        <strong>Difusi</strong> adalah peristiwa mengalirnya atau menyebarnya partikel zat secara mandiri dari daerah berkonsentrasi tinggi (padat/ramai) ke daerah berkonsentrasi rendah (sepi) sampai tersebar merata.
                    </p>
                </div>
                
                <div class="simulation-panel" style="width:100%; height:200px; position:relative; background:#f8fafc; border-radius:24px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding-bottom:15px; box-sizing:border-box; overflow:hidden; border: 3px solid #cbd5e1;">
                    <div style="position:absolute; left:20px; top:15px; font-size:1.2rem; font-weight:800; color:var(--text-muted);" id="temp-diffusion-label">Air Panas ☕</div>
                    
                    <!-- Glass Cup -->
                    <div id="glass-cup" style="position:relative; width:160px; height:120px; border:5px solid #cbd5e1; border-top:0; border-radius:0 0 35px 35px; background:rgba(255,255,255,0.7); box-shadow:0 8px 20px rgba(0,0,0,0.05); overflow:hidden; display:flex; flex-direction:column; justify-content:flex-end;">
                        <!-- Water inside the glass -->
                        <div id="cup-water" style="position:absolute; bottom:0; left:0; right:0; height:85%; background:rgba(186, 230, 253, 0.45); transition:background 3s ease;"></div>
                        <!-- Canvas inside the glass for particle animation -->
                        <canvas id="canvas-diffusion-tea" style="position:absolute; top:0; left:0; width:100%; height:100%; background:transparent; z-index:2;"></canvas>
                    </div>
                    
                    <!-- Teabag suspended above -->
                    <div id="teabag-visual" style="position:absolute; left:50%; top:15px; transform:translateX(-50%); width:36px; height:50px; z-index:10; transition:transform 2s ease-in-out; pointer-events:none;">
                        <!-- String -->
                        <div style="width:2px; height:25px; background:#64748b; margin:0 auto;"></div>
                        <!-- Red tag -->
                        <div style="position:absolute; top:-5px; left:50%; transform:translateX(-50%); width:12px; height:8px; background:#ef4444; border-radius:1px;"></div>
                        <!-- Bag -->
                        <div style="width:28px; height:32px; background:#f8fafc; border:2px solid #cbd5e1; border-radius:3px; position:relative; margin:0 auto; box-shadow:0 3px 6px rgba(0,0,0,0.1); background-image:linear-gradient(to bottom, #f8fafc, #e2e8f0); overflow:hidden;">
                            <!-- Tea leaves inside -->
                            <div style="position:absolute; bottom:2px; left:3px; right:3px; height:18px; background:#78350f; border-radius:1px; opacity:0.85;"></div>
                        </div>
                    </div>
                </div>
                
                <button class="btn-icon btn-syringe-press" id="btn-dip-tea">Celupkan Teh ke Air Panas! 🍵</button>
            </div>
        `;
        wrapper.appendChild(container);
        
        const canvas = document.getElementById("canvas-diffusion-tea");
        const ctx = canvas.getContext("2d");
        canvas.width = 150;
        canvas.height = 120;
        
        let teaParticles = [];
        let isDipping = false;
        let teaColorAlpha = 0;
        
        function drawTeaDiff() {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            
            ctx.fillStyle = `rgba(120, 53, 15, ${teaColorAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = "rgba(120, 53, 15, 0.85)";
            teaParticles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
                ctx.fill();
                
                p.x += p.vx;
                p.y += p.vy;
                p.vx += (Math.random() - 0.5) * 0.15;
                p.vy += (Math.random() - 0.5) * 0.15;
                
                if (p.x < 5) { p.x = 5; p.vx *= -1; }
                if (p.x > canvas.width - 5) { p.x = canvas.width - 5; p.vx *= -1; }
                if (p.y < 20) { p.y = 20; p.vy *= -1; } // Water level
                if (p.y > canvas.height - 5) { p.y = canvas.height - 5; p.vy *= -1; }
            });
            
            if (isDipping) {
                if (teaColorAlpha < 0.25) {
                    teaColorAlpha += 0.001;
                }
                activeAnimationId = requestAnimationFrame(drawTeaDiff);
            }
        }
        
        document.getElementById("btn-dip-tea").addEventListener("click", () => {
            SoundEffects.playClick();
            document.getElementById("teabag-visual").style.transform = "translateX(-50%) translateY(45px)";
            document.getElementById("cup-water").style.backgroundColor = "rgba(120, 53, 15, 0.55)";
            
            for(let i=0; i<35; i++) {
                teaParticles.push({
                    x: canvas.width / 2 + (Math.random() - 0.5) * 20,
                    y: 65,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    r: 2 + Math.random() * 2
                });
            }
            
            if (!isDipping) {
                isDipping = true;
                drawTeaDiff();
                setTimeout(() => {
                    enableNextButton(btnNext);
                    updateStars(10);
                    setAvatar("celebrate", "Bagus sekali! Partikel teh menyebar dari konsentrasi tinggi di kantong teh ke seluruh air bening. Klik Lanjut!");
                }, 2500);
            }
        });
        
    } else if (activeSubStep === 4) {
        setAvatar("thinking", "Anatomi Hidung Halaman 51: Klik setiap komponen saraf pembau di gambar hidung untuk memahami bagaimana bau dapat tercium!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:15px; margin: 1.5rem 0;">
                <div style="position:relative; width:100%; max-width:400px; height:240px; border:3px solid #cbd5e1; border-radius:24px; background:#fff7ed; overflow:hidden;">
                    <div style="position:absolute; left:20px; top:50%; transform:translateY(-50%); font-size:4rem;">👃</div>
                    
                    <div class="water-cycle-node" style="left:120px; top:30px;" id="node-silia">1. Silia Rambut</div>
                    <div class="water-cycle-node" style="left:120px; top:100px;" id="node-saraf">2. Saraf Pembau</div>
                    <div class="water-cycle-node" style="left:120px; top:170px;" id="node-otak">3. Otak</div>
                </div>
                
                <div class="hidden" id="nose-desc-box" style="background:#eff6ff; border:2px solid #3b82f6; border-radius:18px; padding:15px; animation:fadeIn 0.3s ease; width:100%;">
                    <p style="font-weight:800;" id="nose-desc-text"></p>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        let clicked = new Set();
        
        document.getElementById("node-silia").addEventListener("click", () => {
            SoundEffects.playClick();
            resetNose();
            document.getElementById("node-silia").classList.add("active");
            document.getElementById("nose-desc-box").classList.remove("hidden");
            document.getElementById("nose-desc-text").innerHTML = "<strong>Silia Saraf Pembau:</strong> Rambut halus di ujung rongga hidung yang mendeteksi dan menangkap partikel gas aroma pembau.";
            clicked.add("silia");
            checkNoseWin();
        });
        
        document.getElementById("node-saraf").addEventListener("click", () => {
            SoundEffects.playClick();
            resetNose();
            document.getElementById("node-saraf").classList.add("active");
            document.getElementById("nose-desc-box").classList.remove("hidden");
            document.getElementById("nose-desc-text").innerHTML = "<strong>Saraf Pembau:</strong> Menyalurkan sinyal rangsangan bau dari silia hidung ke saraf pusat.";
            clicked.add("saraf");
            checkNoseWin();
        });
        
        document.getElementById("node-otak").addEventListener("click", () => {
            SoundEffects.playClick();
            resetNose();
            document.getElementById("node-otak").classList.add("active");
            document.getElementById("nose-desc-box").classList.remove("hidden");
            document.getElementById("nose-desc-text").innerHTML = "<strong>Otak Besar:</strong> Menerjemahkan sinyal saraf sehingga kita dapat mengenali bau tersebut (harum kopi, melati, parfum, dsb).";
            clicked.add("otak");
            checkNoseWin();
        });
        
        function resetNose() {
            document.querySelectorAll(".water-cycle-node").forEach(n => n.classList.remove("active"));
        }
        
        function checkNoseWin() {
            if (clicked.size === 3) {
                enableNextButton(btnNext);
                updateStars(10);
                setAvatar("celebrate", "Hebat! Kamu telah menyelesaikan anatomi indera pembau hidung. Misi eksplorasi selesai! Klik Lanjut!");
            } else {
                setAvatar("thinking", `Bagus! Kamu telah mempelajari ${clicked.size}/3 bagian hidung. Klik bagian saraf hidung lainnya!`);
            }
        }
    }
}

// --- SUB MISI PERTEMUAN 2 ---
function renderP2Missions(wrapper, btnNext) {
    if (activeSubStep === 1) {
        setAvatar("thinking", "Segitiga Perubahan Wujud Zat (Halaman 54-55): Klik setiap tombol proses di bawah untuk melihat animasi perubahan wujud and pelajari arah perpindahan energinya!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:15px; margin: 1rem 0; width:100%;">
                
                <!-- Triangle Container (Fixed size for pixel-perfect coordinates) -->
                <div style="position:relative; width:480px; height:270px; border:3px solid #cbd5e1; border-radius:24px; background:#f8fafc; overflow:hidden; box-shadow:inset 0 0 20px rgba(0,0,0,0.02);" id="p2-triangle-container">
                    <!-- Background heat/cool indicator glow -->
                    <div id="p2-glow" style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,255,255,0); transition:background 0.5s ease; pointer-events:none; z-index:1;"></div>
                    
                    <!-- CAIR (Top Center) -->
                    <div style="position:absolute; left:200px; top:10px; text-align:center; z-index:3;">
                        <span style="font-weight:800; font-size:0.8rem; color:#2563eb;">💧 CAIR</span>
                        <div id="box-cair" style="width:80px; height:80px; border-radius:50%; border:3px solid #3b82f6; background:#eff6ff; position:relative; overflow:hidden; margin-top:2px;"></div>
                    </div>
                    
                    <!-- PADAT (Bottom Left) -->
                    <div style="position:absolute; left:20px; top:150px; text-align:center; z-index:3;">
                        <span style="font-weight:800; font-size:0.8rem; color:#dc2626;">🧱 PADAT</span>
                        <div id="box-padat" style="width:80px; height:80px; border-radius:50%; border:3px solid #ef4444; background:#fef2f2; position:relative; overflow:hidden; margin-top:2px;"></div>
                    </div>
                    
                    <!-- GAS (Bottom Right) -->
                    <div style="position:absolute; left:380px; top:150px; text-align:center; z-index:3;">
                        <span style="font-weight:800; font-size:0.8rem; color:#059669;">💨 GAS</span>
                        <div id="box-gas" style="width:80px; height:80px; border-radius:50%; border:3px solid #10b981; background:#ecfdf5; position:relative; overflow:hidden; margin-top:2px;"></div>
                    </div>
                    
                    <!-- Flame / Ice overlay effects -->
                    <div id="wc-temp-overlay" style="position:absolute; font-size:2.5rem; opacity:0; transition:all 0.5s ease; pointer-events:none; z-index:4;">🔥</div>

                    <!-- SVG Arrows connecting the nodes -->
                    <svg style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2;">
                        <defs>
                            <marker id="arr-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
                            </marker>
                            <marker id="arr-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                            </marker>
                        </defs>
                        
                        <!-- Padat -> Cair (Mencair) - Menyerap Panas (Orange) -->
                        <path id="path-mencair" d="M 75 185 Q 145 125 210 70" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-red)" style="transition: stroke 0.3s;" />
                        
                        <!-- Cair -> Padat (Membeku) - Melepas Panas (Blue) -->
                        <path id="path-membeku" d="M 210 85 Q 145 140 80 195" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-blue)" style="transition: stroke 0.3s;" />
                        
                        <!-- Cair -> Gas (Menguap) - Menyerap Panas (Orange) -->
                        <path id="path-menguap" d="M 270 70 Q 335 125 405 185" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-red)" style="transition: stroke 0.3s;" />
                        
                        <!-- Gas -> Cair (Mengembun) - Melepas Panas (Blue) -->
                        <path id="path-mengembun" d="M 400 195 Q 335 140 270 85" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-blue)" style="transition: stroke 0.3s;" />
                        
                        <!-- Padat -> Gas (Menyublim) - Menyerap Panas (Orange) -->
                        <path id="path-menyublim" d="M 110 195 Q 240 175 370 195" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-red)" style="transition: stroke 0.3s;" />
                        
                        <!-- Gas -> Padat (Mengkristal) - Melepas Panas (Blue) -->
                        <path id="path-mengkristal" d="M 370 215 Q 240 235 110 215" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-blue)" style="transition: stroke 0.3s;" />
                    </svg>

                    <!-- Flying particle for transfer animation -->
                    <div id="wc-flying-dot" style="position:absolute; width:12px; height:12px; border-radius:50%; background:#f59e0b; opacity:0; pointer-events:none; z-index:4; transition: opacity 0.15s;"></div>
                </div>
                
                <!-- Explored count indicator -->
                <div style="font-weight:800; color:#475569; font-size:0.95rem;">
                    Kemajuan Eksplorasi: <span id="lbl-p2-explored" style="color:var(--primary);">0 / 6</span> Proses Dipelajari
                </div>
                
                <!-- 6 Process Buttons in 2 rows -->
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; width:100%;">
                    <button class="quiz-btn" id="btn-p2-mencair">🔥 Mencair (Padat➔Cair)</button>
                    <button class="quiz-btn" id="btn-p2-menguap">🔥 Menguap (Cair➔Gas)</button>
                    <button class="quiz-btn" id="btn-p2-menyublim">🔥 Menyublim (Padat➔Gas)</button>
                    <button class="quiz-btn" id="btn-p2-membeku">❄️ Membeku (Cair➔Padat)</button>
                    <button class="quiz-btn" id="btn-p2-mengembun">❄️ Mengembun (Gas➔Cair)</button>
                    <button class="quiz-btn" id="btn-p2-mengkristal">❄️ Mengkristal (Gas➔Padat)</button>
                </div>
                
                <!-- Explanation / feedback box -->
                <div class="hidden" id="p2-info-box" style="background:#eff6ff; border:2px solid #3b82f6; border-left:6px solid #3b82f6; border-radius:18px; padding:15px; animation:fadeIn 0.3s ease; width:100%; text-align:center;">
                    <p style="font-weight:800; margin:0;" id="p2-info-text"></p>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        // Setup particle models inside the three circles
        const boxPadat = document.getElementById("box-padat");
        const boxCair = document.getElementById("box-cair");
        const boxGas = document.getElementById("box-gas");
        
        let padatParticles = [];
        let cairParticles = [];
        let gasParticles = [];
        
        // Padat grid (16 particles)
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const el = document.createElement("div");
                el.style.position = "absolute";
                el.style.width = "8px";
                el.style.height = "8px";
                el.style.borderRadius = "50%";
                el.style.background = "#ef4444";
                el.style.border = "1px solid #b91c1c";
                el.style.left = 18 + c * 13 + "px";
                el.style.top = 18 + r * 13 + "px";
                boxPadat.appendChild(el);
                padatParticles.push({ el });
            }
        }
        
        // Cair particles (12 fluid particles)
        for (let i = 0; i < 12; i++) {
            const el = document.createElement("div");
            el.style.position = "absolute";
            el.style.width = "8px";
            el.style.height = "8px";
            el.style.borderRadius = "50%";
            el.style.background = "#3b82f6";
            el.style.border = "1px solid #1d4ed8";
            boxCair.appendChild(el);
            cairParticles.push({
                el,
                x: 20 + Math.random() * 40,
                y: 35 + Math.random() * 30,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5
            });
        }
        
        // Gas particles (6 fast particles)
        for (let i = 0; i < 6; i++) {
            const el = document.createElement("div");
            el.style.position = "absolute";
            el.style.width = "8px";
            el.style.height = "8px";
            el.style.borderRadius = "50%";
            el.style.background = "#10b981";
            el.style.border = "1px solid #047857";
            boxGas.appendChild(el);
            gasParticles.push({
                el,
                x: 20 + Math.random() * 40,
                y: 20 + Math.random() * 40,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3
            });
        }
        
        let activeLoop = true;
        function tick() {
            if (!activeLoop) return;
            
            // Padat
            for (let p of padatParticles) {
                p.el.style.transform = `translate(${(Math.random() - 0.5) * 1.5}px, ${(Math.random() - 0.5) * 1.5}px)`;
            }
            
            // Cair
            for (let p of cairParticles) {
                p.x += p.vx;
                p.y += p.vy;
                let dx = p.x - 40;
                let dy = p.y - 40;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 33 || p.y < 30) {
                    p.vx *= -1;
                    p.vy *= -1;
                    p.x = Math.max(12, Math.min(68, p.x));
                    p.y = Math.max(30, Math.min(68, p.y));
                }
                p.el.style.left = p.x - 4 + "px";
                p.el.style.top = p.y - 4 + "px";
            }
            
            // Gas
            for (let p of gasParticles) {
                p.x += p.vx;
                p.y += p.vy;
                let dx = p.x - 40;
                let dy = p.y - 40;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 35) {
                    let nx = dx / dist;
                    let ny = dy / dist;
                    let dotProduct = p.vx * nx + p.vy * ny;
                    p.vx = p.vx - 2 * dotProduct * nx;
                    p.vy = p.vy - 2 * dotProduct * ny;
                    p.x = 40 + nx * 34;
                    p.y = 40 + ny * 34;
                }
                p.el.style.left = p.x - 4 + "px";
                p.el.style.top = p.y - 4 + "px";
            }
            
            activeAnimationId = requestAnimationFrame(tick);
        }
        tick();
        
        let explored = new Set();
        function triggerProcess(id, name, pathId, isHot, desc, sourceBoxId) {
            SoundEffects.playClick();
            
            // Highlight SVG path
            document.querySelectorAll("svg path").forEach(p => {
                p.setAttribute("stroke", "#e2e8f0");
                p.setAttribute("stroke-width", "4");
            });
            const path = document.getElementById(pathId);
            path.setAttribute("stroke", isHot ? "#f97316" : "#3b82f6");
            path.setAttribute("stroke-width", "6");
            
            // Show overlay (Flame/Ice) under source container
            const overlay = document.getElementById("wc-temp-overlay");
            overlay.innerText = isHot ? "🔥" : "❄️";
            overlay.style.opacity = "1";
            
            const sBox = document.getElementById(sourceBoxId);
            const parentRect = document.getElementById("p2-triangle-container").getBoundingClientRect();
            const boxRect = sBox.getBoundingClientRect();
            overlay.style.left = (boxRect.left - parentRect.left + 20) + "px";
            overlay.style.top = (boxRect.top - parentRect.top + 70) + "px";
            
            setTimeout(() => { overlay.style.opacity = "0"; }, 1500);
            
            // Fly dot along SVG path
            const dot = document.getElementById("wc-flying-dot");
            let len = path.getTotalLength();
            let start = null;
            dot.style.opacity = "1";
            dot.style.background = isHot ? "#f97316" : "#3b82f6";
            
            function runDot(timestamp) {
                if (!start) start = timestamp;
                let progress = (timestamp - start) / 800;
                if (progress > 1) progress = 1;
                
                let pt = path.getPointAtLength(progress * len);
                dot.style.left = pt.x - 6 + "px";
                dot.style.top = pt.y - 6 + "px";
                
                if (progress < 1) {
                    requestAnimationFrame(runDot);
                } else {
                    dot.style.opacity = "0";
                    SoundEffects.playCorrect();
                    
                    const infoBox = document.getElementById("p2-info-box");
                    infoBox.classList.remove("hidden");
                    document.getElementById("p2-info-text").innerHTML = `<strong>${name} (${isHot ? 'Menyerap Energi Panas' : 'Melepaskan Energi Panas'}):</strong> ${desc}`;
                    
                    explored.add(id);
                    document.getElementById("lbl-p2-explored").innerText = explored.size + " / 6";
                    
                    const btn = document.getElementById("btn-p2-" + id);
                    btn.style.background = isHot ? "#ffedd5" : "#dbeafe";
                    btn.style.borderColor = isHot ? "#f97316" : "#3b82f6";
                    
                    if (explored.size === 6) {
                        enableNextButton(btnNext);
                        setAvatar("celebrate", "Luar biasa! Kamu telah menguasai ke-6 perubahan wujud pada segitiga zat. Klik Lanjut!");
                        activeLoop = false;
                    }
                }
            }
            requestAnimationFrame(runDot);
        }
        
        document.getElementById("btn-p2-mencair").addEventListener("click", () => {
            triggerProcess("mencair", "Mencair / Meleleh", "path-mencair", true, "Perubahan wujud padat ke cair. Memerlukan panas untuk melemahkan ikatan antarpartikel yang tegar. Contoh: es meleleh, mentega padat dicairkan di wajan panas.", "box-padat");
        });
        document.getElementById("btn-p2-menguap").addEventListener("click", () => {
            triggerProcess("menguap", "Menguap", "path-menguap", true, "Perubahan wujud cair ke gas. Memerlukan panas sehingga partikel bergerak sangat bebas. Contoh: air di panci dipanaskan menguap, jemuran basah mengering.", "box-cair");
        });
        document.getElementById("btn-p2-menyublim").addEventListener("click", () => {
            triggerProcess("menyublim", "Menyublim", "path-menyublim", true, "Perubahan wujud padat langsung ke gas. Memerlukan panas secara instan. Contoh: kapur barus lemari habis menguap, es kering (dry ice) mengeluarkan asap di panggung.", "box-padat");
        });
        document.getElementById("btn-p2-membeku").addEventListener("click", () => {
            triggerProcess("membeku", "Membeku", "path-membeku", false, "Perubahan wujud cair ke padat. Melepaskan panas sehingga gerakan partikel melambat and ikatan mengunci. Contoh: air ditaruh di kulkas membeku jadi es.", "box-cair");
        });
        document.getElementById("btn-p2-mengembun").addEventListener("click", () => {
            triggerProcess("mengembun", "Mengembun", "path-mengembun", false, "Perubahan wujud gas ke cair. Melepaskan panas saat bersuhu dingin. Contoh: bintik air di dinding luar gelas es batu, embun pagi di daun.", "box-gas");
        });
        document.getElementById("btn-p2-mengkristal").addEventListener("click", () => {
            triggerProcess("mengkristal", "Mengkristal / Deposisi", "path-mengkristal", false, "Perubahan wujud gas langsung ke padat. Melepaskan panas secara instan. Contoh: uap air dingin di awan berubah jadi kepingan salju, jelaga hitam di cerobong asap.", "box-gas");
        });
        
    } else if (activeSubStep === 2) {
        setAvatar("thinking", "Kuis Segitiga Perubahan Wujud: Uji pemahamanmu! Klik jawaban yang tepat sesuai peristiwa alam yang diberikan!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:15px; margin: 1rem 0; width:100%;">
                
                <!-- Triangle Container (identical) -->
                <div style="position:relative; width:480px; height:260px; border:3px solid #cbd5e1; border-radius:24px; background:#f8fafc; overflow:hidden;" id="p2-triangle-container-q">
                    <!-- Glow -->
                    <div id="p2-glow-q" style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,255,255,0); transition:background 0.5s ease; pointer-events:none; z-index:1;"></div>
                    
                    <!-- CAIR -->
                    <div style="position:absolute; left:200px; top:10px; text-align:center; z-index:3;">
                        <span style="font-weight:800; font-size:0.8rem; color:#2563eb;">💧 CAIR</span>
                        <div id="box-cair-q" style="width:80px; height:80px; border-radius:50%; border:3px solid #3b82f6; background:#eff6ff; position:relative; overflow:hidden; margin-top:2px;"></div>
                    </div>
                    
                    <!-- PADAT -->
                    <div style="position:absolute; left:20px; top:140px; text-align:center; z-index:3;">
                        <span style="font-weight:800; font-size:0.8rem; color:#dc2626;">🧱 PADAT</span>
                        <div id="box-padat-q" style="width:80px; height:80px; border-radius:50%; border:3px solid #ef4444; background:#fef2f2; position:relative; overflow:hidden; margin-top:2px;"></div>
                    </div>
                    
                    <!-- GAS -->
                    <div style="position:absolute; left:380px; top:140px; text-align:center; z-index:3;">
                        <span style="font-weight:800; font-size:0.8rem; color:#059669;">💨 GAS</span>
                        <div id="box-gas-q" style="width:80px; height:80px; border-radius:50%; border:3px solid #10b981; background:#ecfdf5; position:relative; overflow:hidden; margin-top:2px;"></div>
                    </div>
                    
                    <!-- overlay -->
                    <div id="wc-temp-overlay-q" style="position:absolute; font-size:2.5rem; opacity:0; transition:all 0.5s ease; pointer-events:none; z-index:4;">🔥</div>

                    <svg style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2;">
                        <defs>
                            <marker id="arr-red-q" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
                            </marker>
                            <marker id="arr-blue-q" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                            </marker>
                        </defs>
                        <path id="path-mencair-q" d="M 75 175 Q 145 115 210 60" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-red-q)" />
                        <path id="path-membeku-q" d="M 210 75 Q 145 130 80 185" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-blue-q)" />
                        <path id="path-menguap-q" d="M 270 60 Q 335 115 405 175" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-red-q)" />
                        <path id="path-mengembun-q" d="M 400 185 Q 335 130 270 75" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-blue-q)" />
                        <path id="path-menyublim-q" d="M 110 185 Q 240 165 370 185" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-red-q)" />
                        <path id="path-mengkristal-q" d="M 370 205 Q 240 225 110 205" fill="none" stroke="#e2e8f0" stroke-width="4" marker-end="url(#arr-blue-q)" />
                    </svg>

                    <!-- Flying particle -->
                    <div id="wc-flying-dot-q" style="position:absolute; width:12px; height:12px; border-radius:50%; background:#f59e0b; opacity:0; pointer-events:none; z-index:4;"></div>
                </div>
                
                <!-- Challenge card -->
                <div style="background:#fff7ed; border:3px solid #ff9d00; border-bottom:7px solid #ff9d00; border-radius:24px; padding:20px; width:100%; text-align:center; box-sizing:border-box;">
                    <div style="font-weight:900; color:#c2410c; margin-bottom:8px; font-size:1.1rem;" id="p2-quiz-title">Tantangan Soal 1 / 4</div>
                    <p style="font-weight:800; font-size:1.15rem; color:#475569; margin:10px 0 20px 0;" id="p2-quiz-question"></p>
                    
                    <!-- Multiple choice button list -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%;" id="p2-quiz-choices"></div>
                    
                    <!-- Next Question button -->
                    <button class="btn-icon btn-secondary hidden" style="margin-top:15px; width:100%;" id="btn-p2-quiz-next">Lanjut ke Soal Berikutnya ➔</button>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        // Setup particle models inside the quiz circles as well (to keep both steps gorgeous)
        const boxPadatQ = document.getElementById("box-padat-q");
        const boxCairQ = document.getElementById("box-cair-q");
        const boxGasQ = document.getElementById("box-gas-q");
        
        let padatParticlesQ = [];
        let cairParticlesQ = [];
        let gasParticlesQ = [];
        
        // Padat grid (16 particles)
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const el = document.createElement("div");
                el.style.position = "absolute";
                el.style.width = "8px";
                el.style.height = "8px";
                el.style.borderRadius = "50%";
                el.style.background = "#ef4444";
                el.style.border = "1px solid #b91c1c";
                el.style.left = 18 + c * 13 + "px";
                el.style.top = 18 + r * 13 + "px";
                boxPadatQ.appendChild(el);
                padatParticlesQ.push({ el });
            }
        }
        
        // Cair particles (12 particles)
        for (let i = 0; i < 12; i++) {
            const el = document.createElement("div");
            el.style.position = "absolute";
            el.style.width = "8px";
            el.style.height = "8px";
            el.style.borderRadius = "50%";
            el.style.background = "#3b82f6";
            el.style.border = "1px solid #1d4ed8";
            boxCairQ.appendChild(el);
            cairParticlesQ.push({
                el,
                x: 20 + Math.random() * 40,
                y: 35 + Math.random() * 30,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5
            });
        }
        
        // Gas particles (6 particles)
        for (let i = 0; i < 6; i++) {
            const el = document.createElement("div");
            el.style.position = "absolute";
            el.style.width = "8px";
            el.style.height = "8px";
            el.style.borderRadius = "50%";
            el.style.background = "#10b981";
            el.style.border = "1px solid #047857";
            boxGasQ.appendChild(el);
            gasParticlesQ.push({
                el,
                x: 20 + Math.random() * 40,
                y: 20 + Math.random() * 40,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3
            });
        }
        
        let activeLoopQ = true;
        function tickQ() {
            if (!activeLoopQ) return;
            // Padat
            for (let p of padatParticlesQ) {
                p.el.style.transform = `translate(${(Math.random() - 0.5) * 1.5}px, ${(Math.random() - 0.5) * 1.5}px)`;
            }
            // Cair
            for (let p of cairParticlesQ) {
                p.x += p.vx;
                p.y += p.vy;
                let dx = p.x - 40;
                let dy = p.y - 40;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 33 || p.y < 30) {
                    p.vx *= -1;
                    p.vy *= -1;
                    p.x = Math.max(12, Math.min(68, p.x));
                    p.y = Math.max(30, Math.min(68, p.y));
                }
                p.el.style.left = p.x - 4 + "px";
                p.el.style.top = p.y - 4 + "px";
            }
            // Gas
            for (let p of gasParticlesQ) {
                p.x += p.vx;
                p.y += p.vy;
                let dx = p.x - 40;
                let dy = p.y - 40;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 35) {
                    let nx = dx / dist;
                    let ny = dy / dist;
                    let dotProduct = p.vx * nx + p.vy * ny;
                    p.vx = p.vx - 2 * dotProduct * nx;
                    p.vy = p.vy - 2 * dotProduct * ny;
                    p.x = 40 + nx * 34;
                    p.y = 40 + ny * 34;
                }
                p.el.style.left = p.x - 4 + "px";
                p.el.style.top = p.y - 4 + "px";
            }
            activeAnimationId = requestAnimationFrame(tickQ);
        }
        tickQ();
        
        // Quiz bank of scenarios
        const scenarios = [
            {
                q: "Kapur barus yang diletakkan di dalam lemari pakaian lama-kelamaan mengecil lalu habis menjadi gas wangi.",
                choices: ["Mencair", "Menyublim", "Menguap", "Mengkristal"],
                ans: "Menyublim",
                pathId: "path-menyublim-q",
                isHot: true,
                source: "box-padat-q",
                desc: "Kapur barus menyerap energi panas dari lingkungan sehingga langsung berubah dari wujud padat ke gas."
            },
            {
                q: "Terbentuknya tetesan-tetesan air embun di permukaan luar gelas kaca yang diisi es batu dingin.",
                choices: ["Mengembun", "Membeku", "Mengkristal", "Menguap"],
                ans: "Mengembun",
                pathId: "path-mengembun-q",
                isHot: false,
                source: "box-gas-q",
                desc: "Uap air gas di udara luar gelas melepaskan energi panas saat menyentuh gelas dingin, lalu berubah menjadi air cair."
            },
            {
                q: "Membuat es lilin dengan cara memasukkan air jus buah manis ke dalam pembeku (freezer).",
                choices: ["Mencair", "Membeku", "Menyublim", "Mengembun"],
                ans: "Membeku",
                pathId: "path-membeku-q",
                isHot: false,
                source: "box-cair-q",
                desc: "Air jus buah melepaskan energi panas ke lingkungan dingin freezer sehingga ikatannya mengunci dan menjadi es padat."
            },
            {
                q: "Mentega padat ditaruh di atas wajan panas, perlahan meleleh menjadi cairan minyak mentega.",
                choices: ["Menguap", "Mencair", "Menyublim", "Membeku"],
                ans: "Mencair",
                pathId: "path-mencair-q",
                isHot: true,
                source: "box-padat-q",
                desc: "Mentega padat menyerap panas dari wajan sehingga partikelnya melemahkan ikatan dan mencair."
            },
            {
                q: "Air basah di pakaian mengering hilang ke udara saat dijemur di bawah terik sinar matahari.",
                choices: ["Menguap", "Mengembun", "Menyublim", "Mengkristal"],
                ans: "Menguap",
                pathId: "path-menguap-q",
                isHot: true,
                source: "box-cair-q",
                desc: "Partikel air menyerap panas matahari hingga bergerak bebas acak lalu terlepas menguap menjadi gas."
            },
            {
                q: "Terbentuknya kepingan salju padat secara langsung dari uap air dingin di awan atmosfer atas.",
                choices: ["Menyublim", "Mengkristal", "Membeku", "Mengembun"],
                ans: "Mengkristal",
                pathId: "path-mengkristal-q",
                isHot: false,
                source: "box-gas-q",
                desc: "Uap air melepaskan energi panas secara ekstrem sehingga langsung mengkristal menjadi salju padat tanpa mencair dahulu."
            }
        ];
        
        // Shuffle and choose 4 questions
        scenarios.sort(() => Math.random() - 0.5);
        let qIdx = 0;
        let correctAnswers = 0;
        
        function showQuestion() {
            const current = scenarios[qIdx];
            document.getElementById("p2-quiz-title").innerText = `Tantangan Soal ${qIdx + 1} / 4`;
            document.getElementById("p2-quiz-question").innerText = current.q;
            
            // Reset arrows opacity
            document.querySelectorAll("svg path").forEach(p => {
                p.setAttribute("stroke", "#e2e8f0");
                p.setAttribute("stroke-width", "4");
            });
            
            const btnNextQ = document.getElementById("btn-p2-quiz-next");
            btnNextQ.classList.add("hidden");
            
            const choicesBox = document.getElementById("p2-quiz-choices");
            choicesBox.innerHTML = current.choices.map(c => `
                <button class="quiz-btn" style="text-align:center; padding:10px 15px; font-weight:800;">${c}</button>
            `).join("");
            
            choicesBox.querySelectorAll("button").forEach(btn => {
                btn.addEventListener("click", () => {
                    const chosen = btn.innerText;
                    if (chosen === current.ans) {
                        SoundEffects.playCorrect();
                        btn.classList.add("correct");
                        choicesBox.querySelectorAll("button").forEach(b => { if (b !== btn) b.disabled = true; });
                        
                        // Highlight path
                        const path = document.getElementById(current.pathId);
                        path.setAttribute("stroke", current.isHot ? "#f97316" : "#3b82f6");
                        path.setAttribute("stroke-width", "6");
                        
                        // Fire flying dot
                        const dot = document.getElementById("wc-flying-dot-q");
                        let len = path.getTotalLength();
                        let start = null;
                        dot.style.opacity = "1";
                        dot.style.background = current.isHot ? "#f97316" : "#3b82f6";
                        
                        function runDotQ(timestamp) {
                            if (!start) start = timestamp;
                            let progress = (timestamp - start) / 800;
                            if (progress > 1) progress = 1;
                            
                            let pt = path.getPointAtLength(progress * len);
                            dot.style.left = pt.x - 6 + "px";
                            dot.style.top = pt.y - 6 + "px";
                            
                            if (progress < 1) {
                                requestAnimationFrame(runDotQ);
                            } else {
                                dot.style.opacity = "0";
                            }
                        }
                        requestAnimationFrame(runDotQ);
                        
                        // Show overlay icon under source container
                        const overlay = document.getElementById("wc-temp-overlay-q");
                        overlay.innerText = current.isHot ? "🔥" : "❄️";
                        overlay.style.opacity = "1";
                        const sBox = document.getElementById(current.source);
                        const parentRect = document.getElementById("p2-triangle-container-q").getBoundingClientRect();
                        const boxRect = sBox.getBoundingClientRect();
                        overlay.style.left = (boxRect.left - parentRect.left + 20) + "px";
                        overlay.style.top = (boxRect.top - parentRect.top + 70) + "px";
                        setTimeout(() => { overlay.style.opacity = "0"; }, 1500);
                        
                        setAvatar("celebrate", `Benar! ${current.desc}`);
                        correctAnswers++;
                        updateStars(10);
                        
                        btnNextQ.classList.remove("hidden");
                        if (qIdx === 3) {
                            btnNextQ.innerText = "Selesaikan Tantangan Segitiga 🏆";
                        }
                    } else {
                        SoundEffects.playWrong();
                        btn.classList.add("wrong");
                        setAvatar("sad", `Kurang tepat. Peristiwa ini adalah perubahan dari ${current.ans.toLowerCase()}! Coba pilih jawaban yang benar.`);
                    }
                });
            });
        }
        
        showQuestion();
        
        document.getElementById("btn-p2-quiz-next").addEventListener("click", () => {
            if (qIdx < 3) {
                qIdx++;
                showQuestion();
            } else {
                SoundEffects.playCorrect();
                setAvatar("celebrate", "Hebat! Kamu telah menyelesaikan seluruh tantangan kuis Segitiga Perubahan Wujud Zat! Klik Lanjut!");
                enableNextButton(btnNext);
                activeLoopQ = false;
            }
        });
        
    } else if (activeSubStep === 3) {
        setAvatar("thinking", "Aktivitas 2.5 Partikel & Panas: Geser tuas suhu di bawah untuk memanaskan partikel, lalu lengkapilah Lembar Penyelidikan tentang Hubungan Energi & Gerak Partikel!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:15px; margin:1.5rem 0; width:100%;">
                <div class="simulation-panel" style="width:100%; border-radius:24px;">
                    <canvas id="canvas-misi-p2" style="height:220px;"></canvas>
                </div>
                <div class="slider-container" style="width:100%">
                    <span>❄️ Dingin (Lepas Panas)</span>
                    <input type="range" id="temp-slider-misi-p2" min="0" max="100" value="10">
                    <span>🔥 Panas (Serap Panas)</span>
                </div>
                <p id="temp-text-p2" style="font-weight:800; font-size:1.15rem; color:var(--primary); margin: 5px 0 15px 0;"></p>
                
                <!-- Lembar Penyelidikan Energi & Gerak Partikel -->
                <div style="width:100%; background:#f8fafc; border:3px solid #e2e8f0; border-radius:24px; padding:20px; box-sizing:border-box;" id="p2-worksheet-box">
                    <h4 style="font-weight:900; font-size:1.1rem; color:var(--primary); margin:0 0 15px 0; text-align:center;">📋 Lembar Penyelidikan: Energi & Gerak Partikel</h4>
                    
                    <!-- Question 1 -->
                    <div style="margin-bottom:15px; text-align:left;">
                        <p style="font-weight:800; font-size:0.9rem; color:#475569; margin:0 0-6px 0; line-height:1.4;">1. Apa perbedaan perpindahan energi pada proses mencair dibanding membeku?</p>
                        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                            <button class="quiz-btn" style="text-align:left; font-size:0.85rem;" id="p2-q1-opt1">A. Mencair menyerap energi panas dari lingkungan, sedangkan membeku melepaskan energi panas ke lingkungan.</button>
                            <button class="quiz-btn" style="text-align:left; font-size:0.85rem;" id="p2-q1-opt2">B. Mencair melepaskan energi panas ke lingkungan, sedangkan membeku menyerap energi panas dari lingkungan.</button>
                        </div>
                    </div>
                    
                    <!-- Question 2 -->
                    <div style="margin-bottom:15px; text-align:left;">
                        <p style="font-weight:800; font-size:0.9rem; color:#475569; margin:0 0-6px 0; line-height:1.4;">2. Mengapa proses mencair memerlukan/menyerap energi?</p>
                        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                            <button class="quiz-btn" style="text-align:left; font-size:0.85rem;" id="p2-q2-opt1">A. Energi panas diserap digunakan untuk memutus/melemahkan ikatan antarpartikel padat agar partikel bisa bergeser.</button>
                            <button class="quiz-btn" style="text-align:left; font-size:0.85rem;" id="p2-q2-opt2">B. Energi panas diserap digunakan untuk merapatkan jarak antarpartikel agar zat berubah menjadi semakin tegar dan padat.</button>
                        </div>
                    </div>

                    <!-- Question 3 -->
                    <div style="margin-bottom:15px; text-align:left;">
                        <p style="font-weight:800; font-size:0.9rem; color:#475569; margin:0 0-6px 0; line-height:1.4;">3. Mengapa proses membeku melepaskan energi panas ke sekitar?</p>
                        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                            <button class="quiz-btn" style="text-align:left; font-size:0.85rem;" id="p2-q3-opt1">A. Agar partikel kehilangan energi geraknya, memperlambat gerakannya, dan merapat saling mengunci membentuk kisi-kisi padat.</button>
                            <button class="quiz-btn" style="text-align:left; font-size:0.85rem;" id="p2-q3-opt2">B. Agar partikel mendapatkan tambahan energi gerak untuk melompat bebas berhamburan.</button>
                        </div>
                    </div>

                    <!-- Question 4 -->
                    <div style="margin-bottom:15px; text-align:left;">
                        <p style="font-weight:800; font-size:0.9rem; color:#475569; margin:0 0-6px 0; line-height:1.4;">4. Bagaimana perubahan energi memengaruhi kecepatan gerak partikel?</p>
                        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                            <button class="quiz-btn" style="text-align:left; font-size:0.85rem;" id="p2-q4-opt1">A. Energi yang diserap (diterima) mempercepat gerak partikel, sedangkan energi yang dilepas memperlambat gerak partikel.</button>
                            <button class="quiz-btn" style="text-align:left; font-size:0.85rem;" id="p2-q4-opt2">B. Perubahan energi tidak memiliki pengaruh apa pun terhadap kecepatan getaran dan gerak partikel.</button>
                        </div>
                    </div>

                    <!-- Kesimpulan Hubungan Energi & Gerak Partikel -->
                    <div style="background:#fff7ed; border:2px dashed #f97316; border-radius:18px; padding:15px; text-align:left; box-sizing:border-box;">
                        <p style="font-weight:900; font-size:0.95rem; color:#c2410c; margin:0 0 10px 0;">✍️ Kesimpulan Penting:</p>
                        
                        <div style="margin-bottom:12px;">
                            <span style="font-weight:800; font-size:0.85rem; color:#475569;">Semakin banyak energi diterima zat ➔</span>
                            <select id="p2-kesimpulan-1" style="width:100%; padding:8px; border:2px solid #cbd5e1; border-radius:10px; font-weight:800; font-family:var(--font); outline:none; margin-top:4px;">
                                <option value="">-- Pilih Kelanjutan Kalimat --</option>
                                <option value="correct">Gerak partikel zat akan semakin cepat dan jarak antarpartikel semakin renggang</option>
                                <option value="wrong">Gerak partikel zat akan semakin melambat dan jarak antarpartikel semakin merapat</option>
                            </select>
                        </div>

                        <div>
                            <span style="font-weight:800; font-size:0.85rem; color:#475569;">Semakin banyak energi dilepaskan zat ➔</span>
                            <select id="p2-kesimpulan-2" style="width:100%; padding:8px; border:2px solid #cbd5e1; border-radius:10px; font-weight:800; font-family:var(--font); outline:none; margin-top:4px;">
                                <option value="">-- Pilih Kelanjutan Kalimat --</option>
                                <option value="correct">Gerak partikel zat akan semakin melambat dan jarak antarpartikel semakin rapat saling mengunci</option>
                                <option value="wrong">Gerak partikel zat akan semakin cepat dan partikel berhamburan keluar wadah</option>
                            </select>
                        </div>
                    </div>
                    
                    <button class="btn-icon" style="width:100%; margin-top:20px;" id="btn-p2-check-worksheet">Verifikasi Jawaban Penyelidikan 🔍</button>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        const canvas = document.getElementById("canvas-misi-p2");
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 220;
        
        const slider = document.getElementById("temp-slider-misi-p2");
        const text = document.getElementById("temp-text-p2");
        
        let particles = [];
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2
            });
        }
        
        let loop = true;
        
        function tick() {
            if(!loop) return;
            ctx.clearRect(0,0, canvas.width, canvas.height);
            let val = parseInt(slider.value);
            
            let speedFactor = 0.2 + (val / 100) * 8;
            let hue = 210 - (val / 100) * 210;
            ctx.fillStyle = `hsl(${hue}, 85%, 50%)`;
            
            if (val < 30) {
                text.innerText = "Fase Padat: Partikel rapat bergetar di tempat (ikatan kuat, melepaskan panas)";
            } else if (val < 70) {
                text.innerText = "Fase Cair: Partikel renggang mulai bergeser/mengalir (menyerap panas)";
            } else {
                text.innerText = "Fase Gas: Partikel sangat renggang bergerak bebas acak (menyerap panas)";
            }
            
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI*2);
                ctx.fill();
                
                if (val < 30) {
                    p.x += (Math.random() - 0.5) * speedFactor * 0.2;
                    p.y += (Math.random() - 0.5) * speedFactor * 0.2;
                } else {
                    p.x += p.vx * speedFactor;
                    p.y += p.vy * speedFactor;
                    if (p.x < 10 || p.x > canvas.width - 10) p.vx *= -1;
                    if (p.y < 10 || p.y > canvas.height - 10) p.vy *= -1;
                }
            });
            
            activeAnimationId = requestAnimationFrame(tick);
        }
        tick();
        
        // Interactive Worksheet selections
        let qAnswers = { q1: null, q2: null, q3: null, q4: null };
        
        function setupOpt(qId, optNum, val) {
            document.getElementById(`p2-${qId}-opt${optNum}`).addEventListener("click", () => {
                SoundEffects.playClick();
                qAnswers[qId] = val;
                
                const opposite = optNum === 1 ? 2 : 1;
                document.getElementById(`p2-${qId}-opt${optNum}`).style.borderColor = "var(--primary)";
                document.getElementById(`p2-${qId}-opt${optNum}`).style.background = "#eff6ff";
                document.getElementById(`p2-${qId}-opt${opposite}`).style.borderColor = "#cbd5e1";
                document.getElementById(`p2-${qId}-opt${opposite}`).style.background = "white";
            });
        }
        
        setupOpt("q1", 1, "A");
        setupOpt("q1", 2, "B");
        setupOpt("q2", 1, "A");
        setupOpt("q2", 2, "B");
        setupOpt("q3", 1, "A");
        setupOpt("q3", 2, "B");
        setupOpt("q4", 1, "A");
        setupOpt("q4", 2, "B");
        
        document.getElementById("btn-p2-check-worksheet").addEventListener("click", () => {
            const c1 = document.getElementById("p2-kesimpulan-1").value;
            const c2 = document.getElementById("p2-kesimpulan-2").value;
            
            if (!qAnswers.q1 || !qAnswers.q2 || !qAnswers.q3 || !qAnswers.q4 || !c1 || !c2) {
                alert("Harap jawab semua pertanyaan dan kesimpulan terlebih dahulu!");
                return;
            }
            
            if (qAnswers.q1 === "A" && qAnswers.q2 === "A" && qAnswers.q3 === "A" && qAnswers.q4 === "A" && c1 === "correct" && c2 === "correct") {
                SoundEffects.playCorrect();
                updateStars(15);
                alert("Selamat! Semua jawabanmu benar. Hubungan energi, kekuatan ikatan, dan gerak partikel terbukti sempurna.");
                setAvatar("celebrate", "Hebat sekali! Kamu memahami dengan sangat baik bagaimana energi panas memengaruhi ikatan dan kecepatan partikel zat! Klik Lanjut!");
                enableNextButton(btnNext);
                loop = false; // stop animation tick loop
            } else {
                SoundEffects.playWrong();
                setAvatar("sad", "Beberapa jawaban masih kurang tepat. Ingat: menyerap energi panas membuat partikel bergerak cepat untuk melemahkan ikatan, sedangkan melepaskan energi panas memperlambat partikel!");
            }
        });
        
    } else if (activeSubStep === 4) {
        setAvatar("thinking", "Gambar 2.11 Buku Halaman 55: Bedakan konsep menguap dengan mendidih pada air!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:20px; margin: 1.5rem 0;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; width:100%;">
                    <div style="background:white; border:3px solid #cbd5e1; padding:10px; border-radius:18px; text-align:center;" id="btn-comp-boil">
                        <span style="font-size:3.5rem;">🔥🫖</span><br>
                        <strong>Air Mendidih</strong>
                    </div>
                    <div style="background:white; border:3px solid #cbd5e1; padding:10px; border-radius:18px; text-align:center;" id="btn-comp-evap">
                        <span style="font-size:3.5rem;">👕☀️</span><br>
                        <strong>Air Menguap</strong>
                    </div>
                </div>
                
                <div class="hidden" id="p2-m4-details" style="background:#eff6ff; border:2px solid #3b82f6; border-radius:18px; padding:15px; animation:fadeIn 0.3s ease;">
                    <p style="font-weight:800;" id="p2-m4-details-text"></p>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        let checked = new Set();
        
        document.getElementById("btn-comp-boil").addEventListener("click", () => {
            SoundEffects.playClick();
            resetSelect();
            document.getElementById("btn-comp-boil").style.borderColor = "var(--primary)";
            document.getElementById("p2-m4-details").classList.remove("hidden");
            document.getElementById("p2-m4-details-text").innerHTML = "<strong>Air Mendidih:</strong> Terjadi pada seluruh bagian zat cair pada titik didihnya (100°C), ditandai dengan gelembung-gelembung air naik ke permukaan.";
            checked.add("boil");
            checkWin();
        });
        
        document.getElementById("btn-comp-evap").addEventListener("click", () => {
            SoundEffects.playClick();
            resetSelect();
            document.getElementById("btn-comp-evap").style.borderColor = "var(--primary)";
            document.getElementById("p2-m4-details").classList.remove("hidden");
            document.getElementById("p2-m4-details-text").innerHTML = "<strong>Air Menguap:</strong> Terjadi hanya pada permukaan zat cair pada suhu berapa pun di bawah titik didihnya (misal menjemur pakaian basah).";
            checked.add("evap");
            checkWin();
        });
        
        function resetSelect() {
            document.getElementById("btn-comp-boil").style.borderColor = "#cbd5e1";
            document.getElementById("btn-comp-evap").style.borderColor = "#cbd5e1";
        }
        
        function checkWin() {
            if (checked.size === 2) {
                enableNextButton(btnNext);
                updateStars(10);
                setAvatar("celebrate", "Hebat! Kamu telah menguasai perbedaan Gambar 2.11. Misi selesai! Klik Lanjut!");
            } else {
                setAvatar("thinking", `Bagus! Kamu telah mempelajari ${checked.size}/2 materi perbedaan. Pelajari yang satunya lagi!`);
            }
        }
    }
}

function renderP3Missions(wrapper, btnNext) {
    if (activeSubStep === 1) {
        setAvatar("thinking", "Halaman 64-65: Tarik kartu perubahan materi di bawah ke dalam wadah Perubahan Fisika atau Perubahan Kimia yang tepat (atau klik kartu lalu klik wadah untuk memindahkannya)!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div class="drag-drop-game">
                <div class="items-container" id="p3-items-box"></div>
                <div class="drop-zones">
                    <div class="drop-zone" id="zone-fisika" style="cursor:pointer; transition: transform 0.2s;">
                        <h4>🔄 FISIKA</h4>
                        <p>(Reversible/Komposisi Tetap)</p>
                    </div>
                    <div class="drop-zone" id="zone-kimia" style="cursor:pointer; transition: transform 0.2s;">
                        <h4>✨ KIMIA</h4>
                        <p>(Irreversible/Zat Baru)</p>
                    </div>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        const items = [
            { id: "es", text: "Es Krim Meleleh", type: "fisika" },
            { id: "larut", text: "Gula Larut di Air", type: "fisika" },
            { id: "beras", text: "Beras Ditumbuk Tepung", type: "fisika" },
            { id: "karat", text: "Besi Berkarat", type: "kimia" },
            { id: "korek", text: "Korek Api Dinyalakan", type: "kimia" },
            { id: "kue", text: "Memanggang Kue", type: "kimia" }
        ];
        
        let selectedItem = null;
        const itemsBox = document.getElementById("p3-items-box");
        items.sort(() => Math.random() - 0.5).forEach(item => {
            let div = document.createElement("div");
            div.className = "drag-item";
            div.draggable = true;
            div.id = item.id;
            div.innerText = item.text;
            div.dataset.type = item.type;
            
            // Drag start
            div.addEventListener("dragstart", e => {
                SoundEffects.playClick();
                e.dataTransfer.setData("text/plain", e.target.id);
                document.querySelectorAll(".drag-item").forEach(el => {
                    el.style.border = "";
                    el.style.boxShadow = "";
                });
                selectedItem = div;
            });
            
            // Click selection fallback (Touch/Mobile)
            div.addEventListener("click", () => {
                SoundEffects.playClick();
                document.querySelectorAll(".drag-item").forEach(el => {
                    el.style.border = "";
                    el.style.boxShadow = "";
                });
                div.style.border = "3px solid #3b82f6";
                div.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.5)";
                selectedItem = div;
            });
            
            itemsBox.appendChild(div);
        });
        
        let correctCount = 0;
        document.querySelectorAll(".drop-zone").forEach(zone => {
            zone.addEventListener("dragover", e => e.preventDefault());
            zone.addEventListener("drop", e => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                const el = document.getElementById(id);
                if (!el) return;
                handleMatch(el, zone);
            });
            
            // Click drop zone fallback
            zone.addEventListener("click", () => {
                if (!selectedItem) return;
                handleMatch(selectedItem, zone);
            });
        });
        
        function handleMatch(el, zone) {
            const targetType = zone.id.replace("zone-", "");
            if (el.dataset.type === targetType) {
                SoundEffects.playCorrect();
                zone.appendChild(el);
                el.classList.add("correct");
                el.draggable = false;
                el.style.border = "";
                el.style.boxShadow = "";
                el.style.cursor = "default";
                el.onclick = null;
                
                if (selectedItem === el) {
                    selectedItem = null;
                }
                
                correctCount++;
                updateStars(5);
                setAvatar("celebrate", "Tepat sekali!");
                
                if (correctCount === items.length) {
                    enableNextButton(btnNext);
                    setAvatar("celebrate", "Hebat! Semua perubahan terkelompokkan dengan benar. Klik Lanjut!");
                }
            } else {
                SoundEffects.playWrong();
                el.classList.add("wrong");
                setAvatar("sad", "Salah kelompok! Inegat perbedaan ciri fisika dan kimia.");
                setTimeout(() => el.classList.remove("wrong"), 1000);
            }
        }
        
    } else if (activeSubStep === 2) {
        setAvatar("thinking", "Percobaan Halaman 61-64: Klik tombol sobek atau bakar kertas untuk memicu perubahan zat di laboratorium virtual!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:20px; margin: 1.5rem 0;">
                <div id="paper-graphic-box" style="width:200px; height:150px; display:flex; align-items:center; justify-content:center; transition: all 0.3s ease;"></div>
                <div class="syringe-buttons">
                    <button class="btn-icon btn-secondary" id="btn-paper-tear">✂️ Sobek Kertas</button>
                    <button class="btn-icon btn-exit" id="btn-paper-burn">🔥 Bakar Kertas</button>
                </div>
                <div class="hidden" id="paper-feedback" style="background:#f8fafc; border:2px solid #cbd5e1; border-radius:18px; padding:15px; text-align:center; max-width:550px;">
                    <p style="font-weight:800; margin:0;" id="paper-feedback-text"></p>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        function drawPaperState(state) {
            const box = document.getElementById("paper-graphic-box");
            if (!box) return;
            if (state === "normal") {
                box.innerHTML = `
                    <svg width="120" height="140" viewBox="0 0 100 100" style="transition: all 0.5s ease;">
                        <rect x="25" y="10" width="50" height="70" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="2" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.1));" />
                        <path d="M 65 10 L 75 20 L 65 20 Z" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" />
                        <line x1="35" y1="30" x2="65" y2="30" stroke="#cbd5e1" stroke-width="2" />
                        <line x1="35" y1="45" x2="65" y2="45" stroke="#cbd5e1" stroke-width="2" />
                        <line x1="35" y1="60" x2="55" y2="60" stroke="#cbd5e1" stroke-width="2" />
                    </svg>
                `;
            } else if (state === "torn") {
                box.innerHTML = `
                    <svg width="160" height="140" viewBox="0 0 120 100" style="transition: all 0.5s ease;">
                        <g style="transform: rotate(-10deg) translate(5px, 15px);">
                            <path d="M 15 10 L 45 10 L 40 25 L 47 40 L 42 55 L 48 70 L 40 80 L 15 80 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="2" style="filter: drop-shadow(-2px 4px 5px rgba(0,0,0,0.1));" />
                            <line x1="22" y1="30" x2="38" y2="30" stroke="#cbd5e1" stroke-width="2" />
                            <line x1="22" y1="45" x2="40" y2="45" stroke="#cbd5e1" stroke-width="2" />
                        </g>
                        <g style="transform: rotate(10deg) translate(60px, 10px);">
                            <path d="M 45 10 L 75 10 L 75 80 L 40 80 L 48 70 L 42 55 L 47 40 L 40 25 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="2" style="filter: drop-shadow(2px 4px 5px rgba(0,0,0,0.1));" />
                            <line x1="50" y1="30" x2="68" y2="30" stroke="#cbd5e1" stroke-width="2" />
                            <line x1="48" y1="45" x2="68" y2="45" stroke="#cbd5e1" stroke-width="2" />
                        </g>
                    </svg>
                `;
            } else if (state === "burned") {
                box.innerHTML = `
                    <svg width="130" height="140" viewBox="0 0 100 100" style="transition: all 0.5s ease;">
                        <path d="M 25 20 Q 30 15 45 22 Q 60 15 70 25 Q 75 45 65 65 Q 45 75 30 65 Q 20 45 25 20 Z" fill="#334155" stroke="#1e293b" stroke-width="2" style="filter: drop-shadow(0px 6px 12px rgba(239,68,68,0.45));" />
                        <path d="M 30 35 L 60 38" stroke="#1e293b" stroke-width="2" />
                        <path d="M 32 50 L 55 52" stroke="#1e293b" stroke-width="2" />
                        <circle cx="35" cy="30" r="3" fill="#f97316" />
                        <circle cx="55" cy="45" r="4" fill="#ef4444" />
                        <circle cx="48" cy="25" r="2" fill="#facc15" />
                        <text x="35" y="62" font-size="22">🔥</text>
                        <text x="50" y="38" font-size="14">💨</text>
                    </svg>
                `;
            }
        }
        
        drawPaperState("normal");
        
        let done = new Set();
        
        document.getElementById("btn-paper-tear").addEventListener("click", () => {
            SoundEffects.playClick();
            drawPaperState("torn");
            const feedback = document.getElementById("paper-feedback");
            feedback.classList.remove("hidden");
            document.getElementById("paper-feedback-text").innerHTML = "<strong>Perubahan Fisika (Sobek Kertas):</strong> Ukuran kertas mengecil, komposisi kimianya tetap sama (tetap kertas), tidak terbentuk zat baru.";
            done.add("tear");
            updateStars(10);
            checkWin();
        });
        
        document.getElementById("btn-paper-burn").addEventListener("click", () => {
            SoundEffects.playClick();
            drawPaperState("burned");
            const feedback = document.getElementById("paper-feedback");
            feedback.classList.remove("hidden");
            document.getElementById("paper-feedback-text").innerHTML = "<strong>Perubahan Kimia (Bakar Kertas):</strong> Terbentuk zat jenis baru berupa abu arang hitam dan asap gas. Perubahan bersifat tidak bisa balik (irreversible).";
            done.add("burn");
            updateStars(10);
            checkWin();
        });
        
        function checkWin() {
            if (done.size === 2) {
                enableNextButton(btnNext);
                setAvatar("celebrate", "Kamu sudah mencoba kedua eksperimen kertas! Klik Lanjut!");
            } else {
                setAvatar("thinking", `Bagus! Kamu sudah mempelajari ${done.size}/2 jenis perubahan kertas. Coba eksperimen satunya lagi!`);
            }
        }
        
    } else if (activeSubStep === 3) {
        setAvatar("thinking", "Siklus Air Dunia (Halaman 63): Klik tahapan siklus air pada ilustrasi di bawah!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div class="water-cycle-container" style="position:relative; border:3px solid #cbd5e1; border-radius:24px; background:#e0f2fe; height:350px; overflow:hidden; margin:1.5rem 0;">
                <!-- Sky background that changes color based on condensation -->
                <div id="sky-bg" style="position:absolute; top:0; left:0; right:0; bottom:0; background:#e0f2fe; transition:background 0.8s ease; z-index:1;"></div>
                
                <!-- Mountains and Sea layout -->
                <div style="position:absolute; left:0; right:0; bottom:0; height:60px; background:#0284c7; z-index:2; border-top:3px solid #0369a1; font-weight:900; color:white; padding:10px 20px; font-size:1.2rem;">🌊 Samudra Luas</div>
                <div style="position:absolute; right:0; bottom:50px; width:120px; height:120px; background:#22c55e; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); z-index:2; text-align:center;">
                    <span style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); font-weight:bold; color:white; font-size:0.9rem;">🏔️ Daratan</span>
                </div>
                <div id="snow-mountain" style="position:absolute; right:0; bottom:50px; width:120px; height:120px; background:#ffffff; clip-path: polygon(50% 0%, 25% 50%, 75% 50%); z-index:3; opacity:0; transition:opacity 0.8s ease;"></div>

                <!-- The Sun ☀️ -->
                <div id="wc-sun" style="position:absolute; left:20px; top:20px; font-size:4rem; transition:transform 0.5s ease, text-shadow 0.5s ease; z-index:2;">☀️</div>

                <!-- The Cloud ☁️ -->
                <div id="wc-cloud" style="position:absolute; left:50%; top:50px; transform:translateX(-50%); font-size:4.5rem; transition:all 0.8s ease; z-index:3; cursor:default;">☁️</div>
                
                <!-- Lightning Flash effect -->
                <div id="lightning-flash" style="position:absolute; top:0; left:0; right:0; bottom:0; background:white; opacity:0; pointer-events:none; z-index:9; transition:opacity 0.1s ease;"></div>

                <!-- Falling Rain/Snow particles container -->
                <div id="weather-particles" style="position:absolute; top:100px; left:20%; right:20%; bottom:60px; z-index:2; pointer-events:none;"></div>
                
                <!-- Rising Vapor particles container -->
                <div id="vapor-particles" style="position:absolute; bottom:60px; left:20px; width:100px; height:200px; z-index:2; pointer-events:none;"></div>

                <!-- Interactive cycle nodes -->
                <div class="water-cycle-node" style="left:20px; bottom:90px;" id="node-eva">1. Evaporasi</div>
                <div class="water-cycle-node" style="left:50%; top:120px; transform:translateX(-50%);" id="node-kon">2. Kondensasi</div>
                <div class="water-cycle-node" style="right:120px; bottom:140px;" id="node-pre">3. Presipitasi</div>
            </div>
            
            <!-- Interactive control panel beneath -->
            <div id="wc-controls" style="background:#f8fafc; border:3px solid #cbd5e1; border-radius:24px; padding:15px; margin-bottom:15px; min-height:80px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;">
                <p style="font-weight:800; color:#475569; margin:0;" id="wc-control-instruction">Silakan klik tombol siklus 1. Evaporasi untuk memulai!</p>
                <div id="wc-interactive-area" style="width:100%; text-align:center;"></div>
            </div>

            <!-- Curiosity Question / Info Box -->
            <div class="hidden" id="cycle-desc-box" style="background:#eff6ff; border:3px solid #3b82f6; border-bottom:6px solid #3b82f6; border-radius:24px; padding:20px; animation:fadeIn 0.4s ease; margin-top:15px;">
                <h4 style="font-weight:900; color:#1d4ed8; margin-bottom:12px; font-size:1.15rem; display:flex; align-items:center; gap:8px; margin-top:0;">
                    💡 Pojok Rasa Ingin Tahu
                </h4>
                <p style="font-weight:800; margin-bottom:15px; font-size:1rem;" id="cycle-desc-text"></p>
                <div id="cycle-curiosity-options" style="display:flex; flex-direction:column; gap:8px;"></div>
                <div id="cycle-curiosity-feedback" style="font-weight:900; margin-top:10px; min-height:24px; color:#16a34a;"></div>
            </div>
        `;
        wrapper.appendChild(container);
        
        let clicked = new Set();
        let currentActiveTab = "";
        let vaporInterval = null;
        let rainInterval = null;
        
        function clearAllIntervals() {
            if (vaporInterval) clearInterval(vaporInterval);
            if (rainInterval) clearInterval(rainInterval);
        }
        
        function resetActive() {
            document.querySelectorAll(".water-cycle-node").forEach(n => n.classList.remove("active"));
            document.getElementById("cycle-desc-box").classList.add("hidden");
            document.getElementById("cycle-curiosity-feedback").innerText = "";
            document.getElementById("cycle-curiosity-options").innerHTML = "";
            clearAllIntervals();
        }
        
        // Evaporasi click event
        document.getElementById("node-eva").addEventListener("click", () => {
            SoundEffects.playClick();
            resetActive();
            currentActiveTab = "eva";
            document.getElementById("node-eva").classList.add("active");
            document.getElementById("wc-control-instruction").innerText = "Geser tuas untuk memanaskan lautan dengan matahari!";
            
            const interactive = document.getElementById("wc-interactive-area");
            interactive.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                    <span>🧊 Dingin</span>
                    <input type="range" id="slider-eva" min="1" max="5" value="1" style="width:200px;">
                    <span>🔥 Terik</span>
                </div>
            `;
            
            const slider = document.getElementById("slider-eva");
            const sun = document.getElementById("wc-sun");
            
            function updateVapor(val) {
                sun.style.transform = `scale(${1 + val * 0.15})`;
                sun.style.textShadow = `0 0 ${val * 10}px #eab308`;
                
                // start vapor particles
                const vBox = document.getElementById("vapor-particles");
                if (vBox) {
                    clearInterval(vaporInterval);
                    vaporInterval = setInterval(() => {
                        const p = document.createElement("div");
                        p.style.position = "absolute";
                        p.style.bottom = "0px";
                        p.style.left = Math.random() * 100 + "%";
                        p.style.fontSize = "1rem";
                        p.style.opacity = "0.7";
                        p.style.transition = "all 1.5s ease-out";
                        p.innerText = "💨";
                        vBox.appendChild(p);
                        setTimeout(() => {
                            p.style.bottom = "180px";
                            p.style.opacity = "0";
                        }, 50);
                        setTimeout(() => {
                            if (p.parentNode) p.parentNode.removeChild(p);
                        }, 1600);
                    }, 400 / val);
                }
                
                if (val >= 4) {
                    revealEvaQuestion();
                }
            }
            
            slider.addEventListener("input", () => {
                SoundEffects.playClick();
                updateVapor(parseInt(slider.value));
            });
            
            updateVapor(1);
        });
        
        function revealEvaQuestion() {
            const descBox = document.getElementById("cycle-desc-box");
            if (!descBox.classList.contains("hidden")) return; // already shown
            
            descBox.classList.remove("hidden");
            document.getElementById("cycle-desc-text").innerText = "Mengapa air laut yang rasanya asin, ketika menguap dan menjadi air hujan berubah menjadi air tawar? Ke mana perginya garamnya?";
            
            const options = document.getElementById("cycle-curiosity-options");
            options.innerHTML = `
                <button class="quiz-btn" id="eva-opt-a" style="text-align:left; font-size:0.95rem;">A. Garam ikut menguap ke awan tapi mengendap kembali di langit.</button>
                <button class="quiz-btn" id="eva-opt-b" style="text-align:left; font-size:0.95rem;">B. Hanya partikel air murni yang menguap pada titik didihnya, sedangkan partikel garam yang berat dan titik lelehnya sangat tinggi (804°C) tetap tertinggal di laut.</button>
            `;
            
            document.getElementById("eva-opt-a").addEventListener("click", () => {
                SoundEffects.playWrong();
                document.getElementById("eva-opt-a").classList.add("wrong");
                document.getElementById("cycle-curiosity-feedback").innerText = "❌ Kurang tepat. Pikirkan perbedaan titik leleh garam dan air!";
                document.getElementById("cycle-curiosity-feedback").style.color = "#ef4444";
            });
            
            document.getElementById("eva-opt-b").addEventListener("click", () => {
                SoundEffects.playCorrect();
                document.getElementById("eva-opt-b").classList.add("correct");
                document.getElementById("eva-opt-a").disabled = true;
                document.getElementById("cycle-curiosity-feedback").innerText = "🎉 Benar! Garam tertinggal di laut karena tidak ikut menguap. Siklus 1 Selesai! Klik 2. Kondensasi.";
                document.getElementById("cycle-curiosity-feedback").style.color = "#16a34a";
                clicked.add("eva");
                updateStars(5);
                checkWin();
            });
        }
        
        // Kondensasi click event
        document.getElementById("node-kon").addEventListener("click", () => {
            if (!clicked.has("eva")) {
                alert("Silakan selesaikan siklus 1. Evaporasi terlebih dahulu!");
                return;
            }
            SoundEffects.playClick();
            resetActive();
            currentActiveTab = "kon";
            document.getElementById("node-kon").classList.add("active");
            document.getElementById("wc-control-instruction").innerText = "Geser tuas untuk menurunkan suhu udara and mendinginkan uap air!";
            
            const interactive = document.getElementById("wc-interactive-area");
            interactive.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                    <span>🌡️ 30°C</span>
                    <input type="range" id="slider-kon" min="0" max="30" value="30" style="width:200px;">
                    <span>❄️ 0°C</span>
                </div>
            `;
            
            const slider = document.getElementById("slider-kon");
            const sky = document.getElementById("sky-bg");
            const cloud = document.getElementById("wc-cloud");
            const flash = document.getElementById("lightning-flash");
            
            function updateCondensation(val) {
                // val goes from 30 down to 0
                const percent = (30 - val) / 30; // 0 to 1
                
                // background color transitions from sky blue to charcoal
                const r = Math.round(224 - percent * 170);
                const g = Math.round(242 - percent * 170);
                const b = Math.round(254 - percent * 170);
                sky.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                
                // cloud transitions from white ☁️ to dark grey
                const cloudGrey = Math.round(255 - percent * 180);
                cloud.style.color = `rgb(${cloudGrey}, ${cloudGrey}, ${cloudGrey})`;
                cloud.style.transform = `translateX(-50%) scale(${1 + percent * 0.4})`;
                
                // lightning effect
                if (val <= 8) {
                    if (Math.random() > 0.7) {
                        flash.style.opacity = "0.8";
                        setTimeout(() => { flash.style.opacity = "0"; }, 100);
                    }
                }
                
                if (val <= 5) {
                    revealKonQuestion();
                }
            }
            
            slider.addEventListener("input", () => {
                SoundEffects.playClick();
                // We reverse slider so going right lowers the temperature
                updateCondensation(30 - parseInt(slider.value));
            });
            
            updateCondensation(30);
        });
        
        function revealKonQuestion() {
            const descBox = document.getElementById("cycle-desc-box");
            if (!descBox.classList.contains("hidden")) return;
            
            descBox.classList.remove("hidden");
            document.getElementById("cycle-desc-text").innerText = "Mengapa awan mendung berwarna gelap kelabu, sedangkan awan biasa berwarna putih bersih?";
            
            const options = document.getElementById("cycle-curiosity-options");
            options.innerHTML = `
                <button class="quiz-btn" id="kon-opt-a" style="text-align:left; font-size:0.95rem;">A. Karena awan mendung menyerap debu dan polusi dari bumi.</button>
                <button class="quiz-btn" id="kon-opt-b" style="text-align:left; font-size:0.95rem;">B. Karena awan mendung sangat tebal dan rapat dengan butiran air hasil kondensasi, sehingga menghalangi dan menyerap cahaya matahari agar tidak menembusnya.</button>
            `;
            
            document.getElementById("kon-opt-a").addEventListener("click", () => {
                SoundEffects.playWrong();
                document.getElementById("kon-opt-a").classList.add("wrong");
                document.getElementById("cycle-curiosity-feedback").innerText = "❌ Kurang tepat. Awan hitam bukan karena kotoran debu!";
                document.getElementById("cycle-curiosity-feedback").style.color = "#ef4444";
            });
            
            document.getElementById("kon-opt-b").addEventListener("click", () => {
                SoundEffects.playCorrect();
                document.getElementById("kon-opt-b").classList.add("correct");
                document.getElementById("kon-opt-a").disabled = true;
                document.getElementById("cycle-curiosity-feedback").innerText = "🎉 Benar! Kerapatan air awan mendung menghalangi cahaya matahari sehingga tampak gelap dari bawah. Siklus 2 Selesai! Klik 3. Presipitasi.";
                document.getElementById("cycle-curiosity-feedback").style.color = "#16a34a";
                clicked.add("kon");
                updateStars(5);
                checkWin();
            });
        }
        
        // Presipitasi click event
        document.getElementById("node-pre").addEventListener("click", () => {
            if (!clicked.has("kon")) {
                alert("Silakan selesaikan siklus 2. Kondensasi terlebih dahulu!");
                return;
            }
            SoundEffects.playClick();
            resetActive();
            currentActiveTab = "pre";
            document.getElementById("node-pre").classList.add("active");
            document.getElementById("wc-control-instruction").innerText = "Geser tuas untuk menurunkan suhu udara bawah hingga ekstrem dingin!";
            
            const interactive = document.getElementById("wc-interactive-area");
            interactive.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                    <span>🌡️ Panas 25°C</span>
                    <input type="range" id="slider-pre" min="-10" max="25" value="25" style="width:200px;">
                    <span>❄️ Beku -10°C</span>
                </div>
            `;
            
            const slider = document.getElementById("slider-pre");
            const snowMt = document.getElementById("snow-mountain");
            
            function updatePrecipitation(val) {
                // val is temperature from 25 down to -10
                const pBox = document.getElementById("weather-particles");
                if (pBox) {
                    clearInterval(rainInterval);
                    let emoji = val <= 0 ? "❄️" : "💧";
                    rainInterval = setInterval(() => {
                        const p = document.createElement("div");
                        p.style.position = "absolute";
                        p.style.top = "0px";
                        p.style.left = Math.random() * 100 + "%";
                        p.style.fontSize = val <= 0 ? "1.2rem" : "0.9rem";
                        p.style.transition = "all 1s linear";
                        p.innerText = emoji;
                        pBox.appendChild(p);
                        setTimeout(() => {
                            p.style.top = "200px";
                            p.style.opacity = "0.2";
                        }, 50);
                        setTimeout(() => {
                            if (p.parentNode) p.parentNode.removeChild(p);
                        }, 1050);
                    }, val <= 0 ? 100 : 70);
                }
                
                // Show snow on mountain if temp is below freezing
                if (val <= 0) {
                    snowMt.style.opacity = "1";
                    revealPreQuestion();
                } else {
                    snowMt.style.opacity = "0";
                }
            }
            
            slider.addEventListener("input", () => {
                SoundEffects.playClick();
                // We reverse the range input logic so right means colder
                updatePrecipitation(15 - parseInt(slider.value));
            });
            
            updatePrecipitation(25);
        });
        
        function revealPreQuestion() {
            const descBox = document.getElementById("cycle-desc-box");
            if (!descBox.classList.contains("hidden")) return;
            
            descBox.classList.remove("hidden");
            document.getElementById("cycle-desc-text").innerText = "Apakah Indonesia yang beriklim tropis khatulistiwa pernah mengalami fenomena hujan es? Bagaimana es batu terbentuk di langit Indonesia?";
            
            const options = document.getElementById("cycle-curiosity-options");
            options.innerHTML = `
                <button class="quiz-btn" id="pre-opt-a" style="text-align:left; font-size:0.95rem;">A. Tidak pernah sama sekali karena Indonesia beriklim tropis yang selalu panas.</button>
                <button class="quiz-btn" id="pre-opt-b" style="text-align:left; font-size:0.95rem;">B. Pernah, karena adanya awan Cumulonimbus menjulang tinggi yang mengembunkan uap air ke ketinggian bersuhu di bawah 0°C membentuk es, lalu jatuh sebelum sempat mencair sempurna.</button>
            `;
            
            document.getElementById("pre-opt-a").addEventListener("click", () => {
                SoundEffects.playWrong();
                document.getElementById("pre-opt-a").classList.add("wrong");
                document.getElementById("cycle-curiosity-feedback").innerText = "❌ Kurang tepat. Hujan es (hail) sering dilaporkan terjadi di beberapa kota Indonesia!";
                document.getElementById("cycle-curiosity-feedback").style.color = "#ef4444";
            });
            
            document.getElementById("pre-opt-b").addEventListener("click", () => {
                SoundEffects.playCorrect();
                document.getElementById("pre-opt-b").classList.add("correct");
                document.getElementById("pre-opt-a").disabled = true;
                document.getElementById("cycle-curiosity-feedback").innerText = "🎉 Benar! Hujan es terjadi karena awan Cumulonimbus membawa air membeku ke atas langit dingin. Siklus selesai!";
                document.getElementById("cycle-curiosity-feedback").style.color = "#16a34a";
                clicked.add("pre");
                updateStars(10);
                checkWin();
            });
        }
        
        function checkWin() {
            if (clicked.size === 3) {
                enableNextButton(btnNext);
                setAvatar("celebrate", "Hebat! Kamu telah menyelesaikan seluruh tantangan rasa ingin tahu Siklus Air. Klik Lanjut!");
                clearAllIntervals();
            } else {
                setAvatar("thinking", `Bagus! Kamu telah memecahkan ${clicked.size}/3 teka-teki siklus air. Klik tahapan berikutnya!`);
            }
        }
        
    } else if (activeSubStep === 4) {
        setAvatar("thinking", "Detektif Tanda Reaksi Kimia (Halaman 65-67): Klik tabung reaksi kimia untuk mencatat reaksinya!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:12px; margin: 1.5rem 0;">
                <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;">
                    <button class="quiz-btn" id="btn-det-1">🧪 Timbal (II) Nitrat + Kalium Iodida</button>
                    <button class="quiz-btn" id="btn-det-2">🧪 Natrium Karbonat + Kalsium Klorida</button>
                </div>
                <div class="hidden" id="det-box" style="background:#eff6ff; border:2px solid #3b82f6; border-left:6px solid #3b82f6; border-radius:18px; padding:15px; animation:fadeIn 0.3s ease;">
                    <p style="font-weight:800;" id="det-text"></p>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        let checked = new Set();
        
        document.getElementById("btn-det-1").addEventListener("click", () => {
            SoundEffects.playClick();
            document.getElementById("det-box").classList.remove("hidden");
            document.getElementById("det-text").innerHTML = "<strong>Tanda Perubahan Warna (Halaman 66):</strong> Cairan bening bereaksi menghasilkan zat berwarna <strong>kuning</strong> (timbal (II) iodida).<br>Persamaan kata: <code>timbal (II) nitrat + kalium iodida ➔ timbal (II) iodida + kalium nitrat</code>";
            checked.add("warna");
            updateStars(10);
            checkWin();
        });
        
        document.getElementById("btn-det-2").addEventListener("click", () => {
            SoundEffects.playClick();
            document.getElementById("det-box").classList.remove("hidden");
            document.getElementById("det-text").innerHTML = "<strong>Tanda Terbentuk Endapan (Halaman 67):</strong> Cairan bening bereaksi menghasilkan padatan putih yang tidak larut dan mengendap di bawah tabung (kalsium karbonat).<br>Persamaan kata: <code>larutan natrium karbonat + larutan kalsium klorida ➔ endapan kalsium karbonat + larutan natrium klorida</code>";
            checked.add("endapan");
            updateStars(10);
            checkWin();
        });
        
        function checkWin() {
            if (checked.size === 2) {
                enableNextButton(btnNext);
                setAvatar("celebrate", "Hebat! Kamu telah menemukan tanda reaksi kimia sesuai buku teks. Misi selesai! Klik Lanjut!");
            } else {
                setAvatar("thinking", `Bagus! Kamu telah mempelajari ${checked.size}/2 reaksi kimia. Klik tabung reaksi satunya lagi!`);
            }
        }
    }
}

function renderP4Missions(wrapper, btnNext) {
    if (activeSubStep === 1) {
        setAvatar("thinking", "Bandingkan kerapatan partikel batu bata (padat) vs air (cair) menggunakan alat pemampat (piston) di bawah!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <style>
                @keyframes vibrate-fast {
                    0% { transform: translate(0, 0); }
                    25% { transform: translate(1px, -1px); }
                    50% { transform: translate(-1px, 1px); }
                    75% { transform: translate(1px, 1px); }
                    100% { transform: translate(-1px, -1px); }
                }
                .vibrate-particle {
                    animation: vibrate-fast 0.15s infinite;
                }
            </style>
            <div style="display:flex; flex-direction:column; align-items:center; gap:20px; margin: 1.5rem 0; width:100%;">
                <div style="display:flex; gap:30px; justify-content:center; align-items:center; flex-wrap:wrap; width:100%;">
                    <!-- Cylinder and Piston Container -->
                    <div style="position:relative; width:180px; height:200px; border:4px solid #475569; border-top:none; border-radius:0 0 18px 18px; background:#f1f5f9; overflow:hidden;" id="piston-cylinder">
                        <!-- Piston Head -->
                        <div id="piston-head" style="position:absolute; top:0; left:0; right:0; height:20px; background:#475569; border-bottom:4px solid #1e293b; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.1); z-index:5;">
                            <!-- Piston Rod -->
                            <div style="position:absolute; top:-60px; left:50%; transform:translateX(-50%); width:20px; height:60px; background:#64748b;"></div>
                        </div>
                        
                        <!-- Particles box -->
                        <div id="piston-particles-box" style="position:absolute; bottom:0; left:0; right:0; height:180px; pointer-events:none;"></div>
                    </div>
                    
                    <div style="text-align:center; max-width:250px;">
                        <p style="font-weight:800; margin-bottom:5px;">Keadaan Partikel:</p>
                        <div style="background:#eff6ff; border:2px solid #2563eb; border-radius:12px; padding:8px 12px; font-weight:900; color:#1d4ed8; font-size:1.1rem; margin-bottom:15px;" id="piston-state-label">GAS (Renggang)</div>
                        
                        <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                            <span style="font-size:0.8rem; font-weight:800; color:#64748b;">Geser untuk Memampatkan:</span>
                            <input type="range" id="slider-piston" min="1" max="3" value="1" style="width:180px;">
                            <div style="display:flex; justify-content:space-between; width:180px; font-size:0.75rem; font-weight:bold; color:#64748b; margin-top:3px;">
                                <span>Gas 💨</span>
                                <span>Cair 💧</span>
                                <span>Padat 🧱</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="hidden" id="p4-m1-q-box" style="width:100%; border-top:2px dashed #cbd5e1; padding-top:15px; animation:fadeIn 0.4s ease;">
                    <p style="font-weight:800; text-align:center; font-size:1.05rem; color:var(--text); margin-bottom:12px;">
                        💡 <strong>Rasa Ingin Tahu:</strong> Mengapa kejatuhan air tidak sakit, sedangkan batu bata (volume sama) sangat sakit mengenai kaki?
                    </p>
                    <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
                        <button class="quiz-btn" id="btn-p4-m1-opt1" style="font-size:0.95rem; text-align:left; padding:10px 15px;">
                            A. Partikel batu bata tersusun sangat rapat dengan ikatan antarpartikel yang sangat kuat sehingga keras dan tegar, sedangkan partikel air memiliki jarak renggang and ikatan lemah sehingga mudah bergeser saat bertabrakan dengan kaki.
                        </button>
                        <button class="quiz-btn" id="btn-p4-m1-opt2" style="font-size:0.95rem; text-align:left; padding:10px 15px;">
                            B. Karena air memiliki massa total nol di bumi sedangkan batu bata ditarik lebih kuat oleh gravitasi.
                        </button>
                    </div>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        const pBox = document.getElementById("piston-particles-box");
        const pistonHead = document.getElementById("piston-head");
        const stateLabel = document.getElementById("piston-state-label");
        const slider = document.getElementById("slider-piston");
        
        function renderPistonParticles(state) {
            pBox.innerHTML = "";
            let count = 16;
            
            if (state === 1) { // Gas
                pistonHead.style.top = "0px";
                stateLabel.innerText = "GAS (Sangat Renggang)";
                stateLabel.style.background = "#fee2e2";
                stateLabel.style.color = "#ef4444";
                stateLabel.style.borderColor = "#ef4444";
                
                // Spawn randomly scattered bouncing gas particles
                for (let i = 0; i < count; i++) {
                    const d = document.createElement("div");
                    d.style.position = "absolute";
                    d.style.width = "12px";
                    d.style.height = "12px";
                    d.style.borderRadius = "50%";
                    d.style.background = "#ef4444";
                    d.style.left = Math.random() * 85 + 5 + "%";
                    d.style.top = Math.random() * 140 + 30 + "px";
                    d.style.transition = "all 0.5s ease";
                    pBox.appendChild(d);
                }
            } else if (state === 2) { // Liquid
                pistonHead.style.top = "60px";
                stateLabel.innerText = "CAIR (Renggang/Bebas)";
                stateLabel.style.background = "#e0f2fe";
                stateLabel.style.color = "#0284c7";
                stateLabel.style.borderColor = "#0284c7";
                
                // Spawn particles sliding at the bottom half
                for (let i = 0; i < count; i++) {
                    const d = document.createElement("div");
                    d.style.position = "absolute";
                    d.style.width = "12px";
                    d.style.height = "12px";
                    d.style.borderRadius = "50%";
                    d.style.background = "#38bdf8";
                    d.style.border = "1px solid #0284c7";
                    d.style.left = Math.random() * 85 + 5 + "%";
                    d.style.bottom = Math.random() * 50 + "px";
                    pBox.appendChild(d);
                }
            } else if (state === 3) { // Solid
                pistonHead.style.top = "120px";
                stateLabel.innerText = "PADAT (Sangat Rapat)";
                stateLabel.style.background = "#dcfce7";
                stateLabel.style.color = "#15803d";
                stateLabel.style.borderColor = "#15803d";
                
                // Spawn in a rigid, vibrating grid
                let rows = 4;
                let cols = 4;
                let gridWidth = 120;
                let gridHeight = 45;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const d = document.createElement("div");
                        d.className = "vibrate-particle";
                        d.style.position = "absolute";
                        d.style.width = "12px";
                        d.style.height = "12px";
                        d.style.borderRadius = "50%";
                        d.style.background = "#22c55e";
                        d.style.border = "1px solid #15803d";
                        d.style.left = 30 + c * 28 + "px";
                        d.style.bottom = 5 + r * 13 + "px";
                        pBox.appendChild(d);
                    }
                }
                
                // Reveal the question once they fully compress to solid!
                document.getElementById("p4-m1-q-box").classList.remove("hidden");
            }
        }
        
        slider.addEventListener("input", () => {
            SoundEffects.playClick();
            renderPistonParticles(parseInt(slider.value));
        });
        
        renderPistonParticles(1);
        
        document.getElementById("btn-p4-m1-opt1").addEventListener("click", () => {
            SoundEffects.playCorrect();
            document.getElementById("btn-p4-m1-opt1").classList.add("correct");
            document.getElementById("btn-p4-m1-opt2").disabled = true;
            updateStars(10);
            setAvatar("celebrate", "Luar biasa! Kamu memecahkan teka-tekinya! Struktur padat tegar and sulit ditembus sedangkan cair lentur. Klik Lanjut!");
            enableNextButton(btnNext);
        });
        
        document.getElementById("btn-p4-m1-opt2").addEventListener("click", () => {
            SoundEffects.playWrong();
            document.getElementById("btn-p4-m1-opt2").classList.add("wrong");
            setAvatar("sad", "Pilihan kurang tepat. Hubungkan dengan kerapatan partikel!");
        });
        
    } else if (activeSubStep === 2) {
        setAvatar("thinking", "Penyelidikan Archimedes: Klik tombol celupkan batu, lalu amati efek percikan air and tentukan volume batu!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:20px; margin: 1.5rem 0;">
                <div style="display:flex; gap:40px; justify-content:center; align-items:center; flex-wrap:wrap; width:100%;">
                    <div style="position:relative; width:130px; height:170px; border:4px solid #475569; border-top:none; border-radius:0 0 12px 12px; background:#f8fafc; overflow:hidden;" id="p4-beaker">
                        <!-- Water level -->
                        <div style="position:absolute; bottom:0; left:0; right:0; height:80px; background:rgba(56,189,248,0.6); transition:all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);" id="p4-beaker-water"></div>
                        <div style="position:absolute; left:5px; bottom:75px; width:120px; height:2px; background:#3b82f6; opacity:0.8; transition:all 0.8s ease;" id="p4-beaker-line"></div>
                        <div style="position:absolute; left:10px; bottom:80px; font-size:0.75rem; font-weight:bold; color:#1d4ed8; transition:all 0.8s ease;" id="p4-beaker-label">Air: 50 ml</div>
                        
                        <!-- Falling Stone -->
                        <div style="position:absolute; left:50px; top:-40px; width:30px; height:30px; background:#64748b; border:2px solid #334155; border-radius:40% 60% 50% 50%; opacity:0; transition:all 0.8s cubic-bezier(0.6, -0.28, 0.735, 0.045);" id="p4-beaker-stone"></div>
                    </div>
                    
                    <div style="text-align:center;">
                        <button class="btn-icon btn-secondary" id="btn-p4-drop-stone" style="margin-bottom:15px;">Celupkan Batu ke Air 🪨</button>
                        <div class="hidden" id="p4-m2-input-box" style="animation:fadeIn 0.4s ease;">
                            <p style="font-weight:800; margin-bottom:8px;">Berapakah volume batu dalam ml?</p>
                            <div style="display:flex; gap:10px; justify-content:center;">
                                <input type="number" id="input-p4-stone-vol" placeholder="Volume (ml)..." style="width:120px; padding:10px; border:2px solid #cbd5e1; border-radius:12px; font-weight:800; outline:none; text-align:center;">
                                <button class="btn-icon" id="btn-p4-m2-submit">Periksa</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        wrapper.appendChild(container);
        
        document.getElementById("btn-p4-drop-stone").addEventListener("click", () => {
            SoundEffects.playClick();
            document.getElementById("btn-p4-drop-stone").disabled = true;
            const stone = document.getElementById("p4-beaker-stone");
            stone.style.opacity = "1";
            stone.style.top = "115px";
            
            // Spawn splash droplets at impact
            setTimeout(() => {
                const beaker = document.getElementById("p4-beaker");
                if (beaker) {
                    for (let i = 0; i < 7; i++) {
                        const d = document.createElement("div");
                        d.style.position = "absolute";
                        d.style.left = "65px";
                        d.style.bottom = "80px";
                        d.style.width = "6px";
                        d.style.height = "6px";
                        d.style.borderRadius = "50%";
                        d.style.background = "#38bdf8";
                        d.style.transition = "all 0.4s ease-out";
                        d.style.pointerEvents = "none";
                        d.style.zIndex = "4";
                        beaker.appendChild(d);
                        
                        setTimeout(() => {
                            d.style.transform = `translate(${(Math.random() - 0.5) * 70}px, -${25 + Math.random() * 35}px)`;
                            d.style.opacity = "0";
                        }, 10);
                        setTimeout(() => d.remove(), 450);
                    }
                }
                
                // Elevate water level and bob it slightly
                document.getElementById("p4-beaker-water").style.height = "120px";
                document.getElementById("p4-beaker-line").style.bottom = "115px";
                
                const label = document.getElementById("p4-beaker-label");
                label.style.bottom = "120px";
                label.innerText = "Air + Batu: 80 ml";
                
                document.getElementById("p4-m2-input-box").classList.remove("hidden");
                setAvatar("happy", "Splash! Batu tenggelam dan air terdesak naik. Berapa selisih volume airnya?");
            }, 600);
        });
        
        document.getElementById("btn-p4-m2-submit").addEventListener("click", () => {
            const val = document.getElementById("input-p4-stone-vol").value.trim();
            if (val === "30") {
                SoundEffects.playCorrect();
                updateStars(10);
                alert("Benar! Volume batu = 80 ml - 50 ml = 30 ml.");
                setAvatar("celebrate", "Bagus! Kamu paham metode Archimedes mengukur volume benda tak beraturan. Klik Lanjut!");
                enableNextButton(btnNext);
            } else {
                SoundEffects.playWrong();
                setAvatar("sad", "Kurang tepat. Kurangkan volume air akhir (80ml) dengan volume air awal (50ml)!");
            }
        });
        
    } else if (activeSubStep === 3) {
        setAvatar("thinking", "Timbangan Massa Jenis: Hitung nilai kerapatan (\u03c1 = m / V) kayu dan besi di bawah!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:20px; margin: 1.5rem 0; width:100%;">
                <p style="font-weight:800; text-align:center; font-size:1.1rem; color:var(--primary);">
                    Ayo hitung massa jenis (\u03c1 = m / V) untuk dua benda di laboratorium!
                </p>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; width:100%;">
                    <!-- Wood spring scale -->
                    <div style="background:white; border:3px solid #cbd5e1; border-radius:18px; padding:15px; text-align:center; display:flex; flex-direction:column; align-items:center;" id="p4-m3-card1">
                        <strong style="color:#b45309;">🪵 Balok Kayu</strong>
                        
                        <!-- spring scale illustration -->
                        <svg width="40" height="90" viewBox="0 0 40 90" style="margin:10px 0;">
                            <rect x="18" y="0" width="4" height="20" fill="#94a3b8" />
                            <circle cx="20" cy="5" r="5" fill="#475569" />
                            <rect x="10" y="20" width="20" height="40" rx="3" fill="#3b82f6" />
                            <!-- weight marker -->
                            <line x1="10" y1="40" x2="30" y2="40" stroke="#ffffff" stroke-width="2" />
                            <rect x="12" y="30" width="16" height="8" fill="#1e3a8a" />
                            <text x="14" y="37" fill="white" font-size="6" font-weight="bold">120g</text>
                            <line x1="20" y1="60" x2="20" y2="75" stroke="#475569" stroke-width="2" />
                            <rect x="10" y="75" width="20" height="15" fill="#d97706" rx="2" />
                        </svg>
                        
                        <span style="font-size:0.9rem; color:#64748b; font-weight:700;">m = 120 g | V = 120 cm³</span>
                        <div style="margin-top:10px;">
                            <input type="number" id="input-p4-density-1" placeholder="\u03c1 (g/cm³)..." style="width:100px; padding:8px; border:2px solid #cbd5e1; border-radius:10px; text-align:center; font-weight:800; outline:none;">
                        </div>
                    </div>
                    
                    <!-- Iron spring scale -->
                    <div style="background:white; border:3px solid #cbd5e1; border-radius:18px; padding:15px; text-align:center; display:flex; flex-direction:column; align-items:center;" id="p4-m3-card2">
                        <strong style="color:#475569;">🔩 Balok Besi</strong>
                        
                        <!-- spring scale illustration -->
                        <svg width="40" height="90" viewBox="0 0 40 90" style="margin:10px 0;">
                            <rect x="18" y="0" width="4" height="10" fill="#94a3b8" />
                            <circle cx="20" cy="5" r="5" fill="#475569" />
                            <rect x="10" y="10" width="20" height="40" rx="3" fill="#3b82f6" />
                            <line x1="10" y1="35" x2="30" y2="35" stroke="#ffffff" stroke-width="2" />
                            <rect x="12" y="25" width="16" height="8" fill="#1e3a8a" />
                            <text x="14" y="32" fill="white" font-size="6" font-weight="bold">240g</text>
                            <line x1="20" y1="50" x2="20" y2="70" stroke="#475569" stroke-width="2" />
                            <rect x="12" y="70" width="16" height="18" fill="#475569" rx="1" />
                        </svg>
                        
                        <span style="font-size:0.9rem; color:#64748b; font-weight:700;">m = 240 g | V = 30 cm³</span>
                        <div style="margin-top:10px;">
                            <input type="number" id="input-p4-density-2" placeholder="\u03c1 (g/cm³)..." style="width:100px; padding:8px; border:2px solid #cbd5e1; border-radius:10px; text-align:center; font-weight:800; outline:none;">
                        </div>
                    </div>
                </div>
                
                <button class="btn-icon" style="width:100%;" id="btn-p4-m3-submit">Verifikasi Perhitungan 🧮</button>
            </div>
        `;
        wrapper.appendChild(container);
        
        document.getElementById("btn-p4-m3-submit").addEventListener("click", () => {
            const ans1 = document.getElementById("input-p4-density-1").value.trim();
            const ans2 = document.getElementById("input-p4-density-2").value.trim();
            
            if (ans1 === "1" && ans2 === "8") {
                SoundEffects.playCorrect();
                updateStars(10);
                alert("Benar! Kayu = 120/120 = 1 g/cm³, Besi = 240/30 = 8 g/cm³.");
                setAvatar("celebrate", "Perhitunganmu sempurna! Kayu terapung (1 = air) sedangkan besi tenggelam (8 > air). Klik Lanjut!");
                enableNextButton(btnNext);
            } else {
                SoundEffects.playWrong();
                setAvatar("sad", "Perhitungan masih salah. Bagilah Massa (m) dengan Volume (V)!");
            }
        });
        
    } else if (activeSubStep === 4) {
        setAvatar("thinking", "Laboratorium Salinitas Laut Mati: Geser tuas salinitas untuk melarutkan garam and lihat tubuh astronot mengapung!");
        
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:20px; margin: 1.5rem 0; width:100%;">
                <div style="display:flex; gap:35px; justify-content:center; align-items:center; flex-wrap:wrap; width:100%;">
                    
                    <!-- Salinity Beaker container -->
                    <div style="position:relative; width:180px; height:200px; border:4px solid #475569; border-top:none; border-radius:0 0 16px 16px; background:#f8fafc; overflow:hidden; box-shadow:0 10px 15px rgba(0,0,0,0.05);" id="salinity-beaker">
                        <!-- Water block -->
                        <div id="salinity-water" style="position:absolute; bottom:0; left:0; right:0; height:130px; background:rgba(56,189,248,0.5); transition:all 0.5s ease; z-index:1;"></div>
                        
                        <!-- Floating Human -->
                        <div id="salinity-human" style="position:absolute; left:60px; bottom:15px; font-size:3rem; transition:all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); z-index:3; filter:drop-shadow(0 3px 5px rgba(0,0,0,0.15)); text-shadow:none;">🧑‍🚀</div>
                        
                        <!-- Water surface line -->
                        <div style="position:absolute; bottom:128px; left:0; right:0; height:4px; background:rgba(56,189,248,0.8); z-index:2;"></div>
                    </div>
                    
                    <div style="text-align:center; min-width:240px; background:#f8fafc; border:2px solid #e2e8f0; border-radius:18px; padding:15px;">
                        <p style="font-weight:800; color:#475569; margin:0 0 10px 0;">Salinitas Air Laut:</p>
                        
                        <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:15px;">
                            <span>Tawar (0%)</span>
                            <input type="range" id="slider-salinity" min="0" max="100" value="0" style="width:140px;">
                            <span>Asin (100%)</span>
                        </div>
                        
                        <div style="text-align:left; font-size:0.9rem; font-weight:700; color:#334155; display:flex; flex-direction:column; gap:5px;">
                            <div>Kadar Garam: <span id="lbl-salt-pct" style="color:#0284c7;">0%</span></div>
                            <div>Massa Jenis Cairan: <span id="lbl-water-den" style="color:#0284c7;">1.00 g/cm³</span></div>
                            <div>Kondisi Astronot: <span id="lbl-human-state" style="color:#ef4444; font-weight:900;">Tenggelam (Sinking) ⚓</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="hidden" id="p4-m4-feedback" style="background:#f0fdf4; border:3px solid #16a34a; border-bottom:6px solid #16a34a; border-radius:24px; padding:18px; text-align:center; max-width:550px; animation:fadeIn 0.4s ease;">
                    <p style="font-weight:800; font-size:0.95rem; color:#15803d; margin:0;">
                        🎉 <strong>Hebat!</strong> Massa jenis tubuh manusia (0.985 g/cm³) sekarang lebih kecil dari air Laut Mati (1.24 g/cm³), sehingga tubuh astronot terdorong ke atas oleh gaya apung dan terapung santai di permukaan tanpa tenggelam!
                    </p>
                </div>
                
                <button class="btn-icon hidden" style="width:100%;" id="btn-p4-m4-done">Selesaikan Eksplorasi Kerapatan 🏆</button>
            </div>
        `;
        wrapper.appendChild(container);
        
        const slider = document.getElementById("slider-salinity");
        const water = document.getElementById("salinity-water");
        const human = document.getElementById("salinity-human");
        const lblPct = document.getElementById("lbl-salt-pct");
        const lblDen = document.getElementById("lbl-water-den");
        const lblState = document.getElementById("lbl-human-state");
        const feedback = document.getElementById("p4-m4-feedback");
        const btnDone = document.getElementById("btn-p4-m4-done");
        
        function updateBuoyancy(pct) {
            lblPct.innerText = pct + "%";
            // Density scales from 1.00 up to 1.25
            const density = 1.00 + (pct / 100) * 0.25;
            lblDen.innerText = density.toFixed(2) + " g/cm³";
            
            // Adjust water tint opacity to represent heavy salt saturation
            water.style.backgroundColor = `rgba(${Math.round(56 - pct * 0.35)}, ${Math.round(189 - pct * 0.4)}, 248, ${0.5 + (pct/100) * 0.25})`;
            
            if (pct <= 25) {
                // Sinking state
                human.style.bottom = "15px";
                human.style.transform = "rotate(0deg)";
                lblState.innerText = "Tenggelam (Sinking) ⚓";
                lblState.style.color = "#ef4444";
                feedback.classList.add("hidden");
                btnDone.classList.add("hidden");
            } else if (pct > 25 && pct < 70) {
                // Suspended / neutral state
                human.style.bottom = "55px";
                human.style.transform = "rotate(35deg)";
                lblState.innerText = "Melayang (Suspended) 🧭";
                lblState.style.color = "#d97706";
                feedback.classList.add("hidden");
                btnDone.classList.add("hidden");
            } else {
                // Floating high state
                human.style.bottom = "95px";
                human.style.transform = "rotate(90deg)"; // lying down relaxing!
                lblState.innerText = "Terapung Tinggi (Floating) 🏝️";
                lblState.style.color = "#16a34a";
                feedback.classList.remove("hidden");
                btnDone.classList.remove("hidden");
                
                // Play splash/giggle sound on first float
                if (btnDone.dataset.triggered !== "true") {
                    SoundEffects.playCorrect();
                    btnDone.dataset.triggered = "true";
                }
            }
        }
        
        slider.addEventListener("input", () => {
            SoundEffects.playClick();
            updateBuoyancy(parseInt(slider.value));
        });
        
        updateBuoyancy(0);
        
        btnDone.addEventListener("click", () => {
            SoundEffects.playCorrect();
            updateStars(20);
            alert("Misi Eksplorasi Kerapatan Selesai! Dapat ★ 20 Bintang!");
            setAvatar("celebrate", "Hebat! Kamu telah menguasai konsep Kerapatan Zat and Archimedes. Misi selesai! Klik Lanjut!");
            enableNextButton(btnNext);
            nextStep();
        });
    }
}

// 8. Presentasi Hasil Penyelidikan
function renderPresentasi(card, btnNext) {
    enableNextButton(btnNext);
    setAvatar("happy", "Tuliskan hasil kesimpulan penyelidikanmu di kotak catatan presentasi di bawah, lalu klik tombol untuk latihan!");
    
    card.innerHTML = `
        <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 1rem; text-align:center;">📢 Lembar Presentasi Hasil</h3>
        <p style="font-weight:700; color:var(--text-muted); margin-bottom:15px;">Persiapkan dirimu untuk berbagi temuan sainsmu dengan teman kelas!</p>
        
        <textarea id="presentation-text" placeholder="Ketik ringkasan hasil eksplorasimu di sini (contoh: wujud zat meja adalah padat...)" style="width:100%; height:120px; padding:15px; border:3px solid #cbd5e1; border-radius:18px; font-family:var(--font); font-size:1rem; outline:none; font-weight:800; margin-bottom:15px;"></textarea>
        
        <button class="btn-icon" style="width:100%;" id="btn-start-present">Mulai Latihan Presentasi 🎤</button>
        
        <div class="hidden" id="presentation-slides" style="background:#0f172a; color:#f8fafc; border-radius:24px; padding:2rem; text-align:center; margin-top:20px; animation:fadeIn 0.4s ease;">
            <h4 style="font-size:1.8rem; font-weight:900; color:#38bdf8; margin-bottom:1rem;">Presentasi Anda:</h4>
            <p id="present-slide-content" style="font-size:1.4rem; font-weight:800; line-height:1.6;"></p>
            <button class="btn-icon btn-secondary" style="margin-top:20px;" id="btn-finish-present">Selesai Presentasi ✔</button>
        </div>
    `;
    
    const txtArea = document.getElementById("presentation-text");
    const presentSlides = document.getElementById("presentation-slides");
    const slideContent = document.getElementById("present-slide-content");
    
    document.getElementById("btn-start-present").addEventListener("click", () => {
        const val = txtArea.value.trim();
        if (val.length < 5) {
            alert("Harap tuliskan minimal satu kalimat ringkasan kesimpulan terlebih dahulu!");
            return;
        }
        SoundEffects.playCorrect();
        slideContent.innerText = `"${val}"`;
        presentSlides.classList.remove("hidden");
        document.getElementById("btn-start-present").disabled = true;
    });
    
    document.getElementById("btn-finish-present").addEventListener("click", () => {
        SoundEffects.playCorrect();
        updateStars(10);
        const val = txtArea.value.trim();
        sendDataToGoogleSheet({
            type: "Presentasi",
            score: "-",
            details: val
        });
        setAvatar("celebrate", "Bagus sekali presentasimu! Kamu memperoleh ⭐ 10 Bintang Presentasi. Klik Lanjut!");
        enableNextButton(btnNext);
        nextStep();
    });
}

// 9. Penguatan Guru (Canva Slides Carousel)
let activeCanvaSlide = 0;
function renderPenguatanGuru(card, btnNext) {
    enableNextButton(btnNext);
    activeCanvaSlide = 0;
    
    const slides = teacherSlidesDeck[activeMeeting];
    setAvatar("happy", "Ayo baca slide Penguatan Canva interaktif dari Guru di bawah untuk memperdalam pemahamanmu!");
    
    let slidesHtml = slides.map((slide, idx) => `
        <div class="canva-slide slide-g${idx+1} ${idx === 0 ? 'active' : ''}" id="canva-s-${idx}">
            <div class="canva-slide-title">${slide.title}</div>
            <div class="canva-slide-body">
                <div class="canva-slide-text">
                    <div class="canva-slide-content">${slide.content}</div>
                </div>
                <div class="canva-slide-graphic">
                    ${slide.graphic}
                </div>
            </div>
        </div>
    `).join("");
    
    let dotsHtml = slides.map((s, idx) => `
        <div class="canva-dot ${idx === 0 ? 'active' : ''}" id="canva-dot-${idx}" onclick="goCanvaSlide(${idx})"></div>
    `).join("");
    
    card.innerHTML = `
        <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 5px; text-align:center;">Canva Slide Penguatan Guru 👩‍🏫</h3>
        
        <div class="canva-deck">
            ${slidesHtml}
        </div>
        <div class="canva-dots">
            ${dotsHtml}
        </div>
        
        <div style="display:flex; justify-content:center; gap:20px; margin-top:20px;">
            <button class="btn-icon btn-secondary" id="btn-canva-prev">◀ Slide Sebelum</button>
            <button class="btn-icon" id="btn-canva-next">Slide Lanjut ▶</button>
        </div>
    `;
    
    const nextBtn = document.getElementById("btn-canva-next");
    const prevBtn = document.getElementById("btn-canva-prev");
    
    nextBtn.addEventListener("click", () => {
        SoundEffects.playClick();
        if (activeCanvaSlide < slides.length - 1) {
            goCanvaSlide(activeCanvaSlide + 1);
        } else {
            updateStars(10);
            enableNextButton(btnNext);
            setAvatar("celebrate", "Kamu sudah menyelesaikan seluruh materi penguatan guru! Klik Lanjut untuk Game Latihan!");
            alert("Penguatan selesai dibaca! Bintang bonus ditambahkan.");
        }
    });
    
    prevBtn.addEventListener("click", () => {
        SoundEffects.playClick();
        if (activeCanvaSlide > 0) {
            goCanvaSlide(activeCanvaSlide - 1);
        }
    });
}

function goCanvaSlide(idx) {
    activeCanvaSlide = idx;
    const slides = teacherSlidesDeck[activeMeeting];
    
    slides.forEach((s, i) => {
        document.getElementById(`canva-s-${i}`).classList.remove("active");
        document.getElementById(`canva-dot-${i}`).classList.remove("active");
    });
    
    document.getElementById(`canva-s-${idx}`).classList.add("active");
    document.getElementById(`canva-dot-${idx}`).classList.add("active");
    
    const nextBtn = document.getElementById("btn-canva-next");
    if (idx === slides.length - 1) {
        nextBtn.innerHTML = "Selesai Baca ✔";
        nextBtn.style.background = "var(--success)";
    } else {
        nextBtn.innerHTML = "Slide Lanjut ▶";
        nextBtn.style.background = "var(--primary)";
    }
}

// 10. Kesimpulan Interaktif
function renderKesimpulan(card, btnNext) {
    enableNextButton(btnNext);
    setAvatar("happy", "Ayo baca poin-poin kesimpulan di bawah! Klik tombol 'Paham! 👍' pada setiap poin untuk mendapatkan bonus bintang!");

    let points = [];
    if (activeMeeting === "p1") {
        points = [
            {
                title: "Tiga Wujud Zat",
                desc: "<b>Padat:</b> bentuk & volume tetap, tidak dapat ditekan.<br><b>Cair:</b> bentuk berubah mengikuti wadah, volume tetap, sulit ditekan.<br><b>Gas:</b> bentuk & volume berubah mengisi seluruh ruangan, mudah ditekan.",
                icon: "📦"
            },
            {
                title: "Model Partikel Zat",
                desc: "<b>Zat Padat:</b> partikel sangat rapat, teratur, gaya tarik kuat.<br><b>Zat Cair:</b> partikel agak renggang, acak, gaya tarik sedang, dapat mengalir.<br><b>Zat Gas:</b> partikel sangat berjauhan, acak sekali, bergerak cepat bebas.",
                icon: "⚛️"
            },
            {
                title: "Peristiwa Difusi",
                desc: "Proses penyebaran partikel secara spontan dari daerah berkonsentrasi tinggi ke konsentrasi rendah. Terjadi sangat cepat pada gas (misalnya aroma masakan yang menyebar di udara).",
                icon: "💨"
            }
        ];
    } else if (activeMeeting === "p2") {
        points = [
            {
                title: "6 Perubahan Wujud",
                desc: "<b>Menyerap Kalor (Panas):</b> Mencair (padat ke cair), Menguap (cair ke gas), Menyublim (padat ke gas).<br><b>Melepas Kalor:</b> Membeku (cair ke padat), Mengembun (gas ke cair), Mengkristal (gas ke padat).",
                icon: "❄️"
            },
            {
                title: "Menguap vs Mendidih",
                desc: "<b>Menguap:</b> Terjadi hanya di permukaan cairan pada suhu berapapun.<br><b>Mendidih:</b> Terjadi di seluruh bagian cairan dan gelembung terbentuk pada suhu titik didih tertentu.",
                icon: "💧"
            },
            {
                title: "Grafik Pemanasan & Suhu Konstan",
                desc: "Saat suatu zat mengalami perubahan wujud (meleleh atau mendidih), suhunya akan <b>tetap konstan/tidak naik</b>. Energi kalor sepenuhnya dipakai untuk memutus ikatan antarpartikel.",
                icon: "📈"
            }
        ];
    } else if (activeMeeting === "p3") {
        points = [
            {
                title: "Perubahan Fisika vs Kimia",
                desc: "<b>Perubahan Fisika:</b> Tidak menghasilkan zat baru, hanya bentuk/wujud berubah (contoh: lilin meleleh, es mencair).<br><b>Perubahan Kimia:</b> Menghasilkan zat baru dengan sifat kimia berbeda (contoh: kayu dibakar, nasi membusuk).",
                icon: "🔄"
            },
            {
                title: "4 Tanda Reaksi Kimia",
                desc: "Reaksi kimia dapat diidentifikasi melalui tanda-tanda berikut:<br>1. Terbentuknya gas/gelembung.<br>2. Terbentuknya endapan.<br>3. Terjadi perubahan warna.<br>4. Terjadi perubahan suhu/energi panas.",
                icon: "🧪"
            },
            {
                title: "Siklus Air Alami",
                desc: "Daur air melibatkan perubahan fisika: <b>Evaporasi</b> (penguapan), <b>Kondensasi</b> (uap air menjadi awan), <b>Presipitasi</b> (hujan), dan <b>Infiltrasi</b> (penyerapan air ke dalam tanah).",
                icon: "🌧️"
            }
        ];
    } else if (activeMeeting === "p4") {
        points = [
            {
                title: "Kerapatan & Massa Jenis",
                desc: "Kerapatan partikel ditunjukkan oleh Massa Jenis (&rho;), yaitu massa zat per satuan volume wadahnya: <b>&rho; = m / V</b>. Zat padat umumnya lebih rapat daripada zat cair dan gas.",
                icon: "⚖️"
            },
            {
                title: "Mengapung, Melayang, Tenggelam",
                desc: "Benda akan <b>mengapung</b> jika &rho; benda < &rho; cairan.<br>Benda akan <b>melayang</b> jika &rho; benda = &rho; cairan.<br>Benda akan <b>tenggelam</b> jika &rho; benda > &rho; cairan.",
                icon: "⛵"
            },
            {
                title: "Metode Archimedes",
                desc: "Volume benda padat yang tidak beraturan bentuknya dapat diukur secara akurat menggunakan gelas ukur berisi air dengan menghitung volume air yang tumpah atau dipindahkan oleh benda tersebut.",
                icon: "🏺"
            }
        ];
    }

    let hasClaimedBonus = false;
    let checkedStates = points.map(() => false);

    let cardsHtml = points.map((p, idx) => `
        <div class="kesimpulan-card" id="kes-card-${idx}" style="background:#fff; border:3px solid #e2e8f0; border-radius:20px; padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: all 0.3s ease;">
            <div>
                <div style="font-size: 2.5rem; margin-bottom: 10px; text-align:center;">${p.icon}</div>
                <h4 style="font-size: 1.25rem; font-weight:900; color:var(--text); text-align:center; margin-bottom:10px;">${p.title}</h4>
                <p style="font-size: 0.95rem; font-weight:700; color:var(--text-muted); line-height:1.5; text-align:left;">${p.desc}</p>
            </div>
            <button class="btn-icon" id="btn-paham-${idx}" style="margin-top: 15px; width:100%; font-size:1rem; padding:8px 12px; background:var(--primary);" onclick="markKesimpulanPaham(${idx})">Paham! 👍</button>
        </div>
    `).join("");

    card.innerHTML = `
        <h3 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 5px; text-align:center;">📝 Kesimpulan Petualangan Hari Ini 💡</h3>
        <p style="font-size:1.05rem; font-weight:700; color:var(--text-muted); text-align:center; margin-bottom:20px;">Bacalah rangkuman materi di bawah ini agar ingatanmu semakin kuat!</p>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px; width:100%; margin-bottom:20px;">
            ${cardsHtml}
        </div>
        
        <div id="bonus-info" style="display:none; background:#ecfdf5; border:3px solid #10b981; border-radius:20px; padding:1.2rem; text-align:center; margin-top:15px; animation: float 3s ease-in-out infinite;">
            <span style="font-size:1.8rem;">🎉</span>
            <p style="font-size:1.15rem; font-weight:900; color:#065f46; margin: 5px 0 0 0;">Hebat! Kamu telah mereview seluruh kesimpulan. Bonus +5 Bintang telah ditambahkan!</p>
        </div>
    `;

    window.markKesimpulanPaham = function(idx) {
        SoundEffects.playClick();
        if (checkedStates[idx]) return;

        checkedStates[idx] = true;
        const cCard = document.getElementById(`kes-card-${idx}`);
        const cBtn = document.getElementById(`btn-paham-${idx}`);

        if (cCard) {
            cCard.style.borderColor = "var(--success)";
            cCard.style.background = "#f0fdf4";
        }
        if (cBtn) {
            cBtn.innerHTML = "Dipahami! ✔";
            cBtn.style.background = "var(--success)";
            cBtn.disabled = true;
        }

        if (checkedStates.every(v => v) && !hasClaimedBonus) {
            hasClaimedBonus = true;
            updateStars(5);
            const bonusDiv = document.getElementById("bonus-info");
            if (bonusDiv) {
                bonusDiv.style.display = "block";
            }
            setAvatar("celebrate", "Bagus sekali! Semua kesimpulan sudah kamu pahami. Sekarang, bersiaplah untuk Game Latihan!");
            btnNext.classList.add("btn-unlocked-pulse");
        }
    };
}

// 11. Latihan Kompetisi (Mini Games Sesuai Bab)
function renderLatihan(card, btnNext) {
    enableNextButton(btnNext);
    
    card.innerHTML = `
        <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 1rem; text-align:center;">🎮 Arena Game Latihan 🎮</h3>
        <div id="game-arena-target" style="width:100%;"></div>
    `;
    
    const target = document.getElementById("game-arena-target");
    
    if (activeMeeting === "p1") {
        runFroggyJump(target, btnNext);
    } else if (activeMeeting === "p2") {
        runUlarTangga(target, btnNext);
    } else if (activeMeeting === "p3") {
        runCrossword(target, btnNext);
    } else if (activeMeeting === "p4") {
        runBalloonPop(target, btnNext);
    }
}

// --- GAME P1: FROGGY JUMP ---
let frogPad = 0;
let frogLives = 3;
function runFroggyJump(target, btnNext) {
    frogPad = 0;
    frogLives = 3;
    
    showFroggyQuestion(target, btnNext);
}

function showFroggyQuestion(target, btnNext) {
    const list = meetingsConfig.p1.latihan;
    const q = list[frogPad];
    
    let hearts = "❤️".repeat(frogLives);
    
    target.innerHTML = `
        <div class="hearts-row">Sisa Nyawa Katak: ${hearts}</div>
        <div class="pond-visual">
            <!-- 10 Lilypads -->
            <div class="lilypad-row" style="gap: 2px;">
                <div class="lilypad">1</div>
                <div class="lilypad">2</div>
                <div class="lilypad">3</div>
                <div class="lilypad">4</div>
                <div class="lilypad">5</div>
                <div class="lilypad">6</div>
                <div class="lilypad">7</div>
                <div class="lilypad">8</div>
                <div class="lilypad">9</div>
                <div class="lilypad">🏁</div>
            </div>
            <!-- Frog Character -->
            <div class="frog-char" id="froggy-char" style="left: ${5 + (frogPad / 9) * 80}%;">🐸</div>
        </div>
        
        <p style="font-weight:800; font-size:1.1rem; margin-bottom:15px; text-align:center;">
            Soal ${frogPad+1}: ${q.q}
        </p>
        <div style="display:flex; flex-direction:column; gap:10px;" id="froggy-choices">
            ${q.a.map((ans, idx) => `
                <button class="quiz-btn" style="text-align:left;" onclick="answerFroggy(${idx}, ${q.c})">${ans}</button>
            `).join("")}
        </div>
    `;
}

function answerFroggy(chosen, correct) {
    const target = document.getElementById("game-arena-target");
    const btnNext = document.getElementById("btn-next-step");
    
    if (chosen === correct) {
        SoundEffects.playCorrect();
        frogPad++;
        if (frogPad === 10) {
            updateStars(30);
            sendDataToGoogleSheet({
                type: "Latihan",
                score: "Katak Sampai (Lulus)",
                details: `Menyelesaikan Froggy Jump dengan sisa nyawa: ${frogLives}`
            });
            target.innerHTML = `
                <div style="text-align:center; padding: 2rem 0;">
                    <div style="font-size: 5rem;">🐸🎉</div>
                    <h3 style="font-size: 2rem; font-weight: 900; color: var(--primary); margin-bottom: 1rem;">Hore, Katak Sampai!</h3>
                    <p style="font-size:1.2rem; font-weight:800; margin-bottom:1.5rem;">Katak berhasil menyeberangi kolam dengan aman! Kamu memperoleh ⭐ 30 Bintang Latihan!</p>
                </div>
            `;
            enableNextButton(btnNext);
        } else {
            showFroggyQuestion(target, btnNext);
        }
    } else {
        SoundEffects.playWrong();
        frogLives--;
        if (frogLives === 0) {
            sendDataToGoogleSheet({
                type: "Latihan",
                score: "Katak Tenggelam (Gagal)",
                details: `Gagal menyelesaikan Froggy Jump pada pad ke-${frogPad}`
            });
            target.innerHTML = `
                <div style="text-align:center; padding: 2rem 0;">
                    <div style="font-size: 5rem;">💀🌊</div>
                    <h3 style="font-size: 2rem; font-weight: 900; color: var(--accent); margin-bottom: 1rem;">Katak Tenggelam!</h3>
                    <p style="font-size:1.2rem; font-weight:800; margin-bottom:1.5rem;">Nyawamu habis karena 3 kali salah menjawab.</p>
                    <button class="btn-icon" onclick="startMeeting('p1')">Ulangi Kuis / Bab</button>
                </div>
            `;
        } else {
            alert("Salah! Nyawa berkurang 1.");
            showFroggyQuestion(target, btnNext);
        }
    }
}

// --- GAME P2: ULAR TANGGA ---
let playerTile = 1;
let snakesQuestionsIdx = 0;
function runUlarTangga(target, btnNext) {
    playerTile = 1;
    snakesQuestionsIdx = 0;
    showSnakesQuestion(target, btnNext);
}

function showSnakesQuestion(target, btnNext) {
    const list = meetingsConfig.p2.latihan;
    const q = list[snakesQuestionsIdx];
    
    // Draw board
    let gridHtml = "";
    for (let i = 1; i <= 10; i++) {
        let label = i;
        let cName = "snakes-tile";
        if (i === 3) {
            label = "3 🪜➔7";
            cName += " ladder-tile";
        }
        else if (i === 8) {
            label = "8 🐍➔4";
            cName += " snake-tile";
        }
        else if (i === 10) label = "10 🏁";
        
        let pClass = (i === playerTile) ? " active-player" : "";
        gridHtml += `<div class="${cName}${pClass}">${label}</div>`;
    }
    
    target.innerHTML = `
        <div class="snakes-board">
            ${gridHtml}
        </div>
        
        <p style="font-weight:800; font-size:1.1rem; margin-bottom:12px; text-align:center;">
            Soal ${snakesQuestionsIdx + 1}: ${q.q}
        </p>
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${q.a.map((ans, idx) => `
                <button class="quiz-btn" style="text-align:left;" onclick="answerSnakes(${idx}, ${q.c})">${ans}</button>
            `).join("")}
        </div>
    `;
}

function answerSnakes(chosen, correct) {
    const target = document.getElementById("game-arena-target");
    const btnNext = document.getElementById("btn-next-step");
    
    if (chosen === correct) {
        SoundEffects.playCorrect();
        let dice = 1 + Math.floor(Math.random() * 3); // 1 s.d 3 langkah
        playerTile += dice;
        if (playerTile > 10) playerTile = 10;
        alert(`Benar! Dadu bergulir: ${dice}. Token melangkah ke petak ${playerTile}.`);
        
        if (playerTile === 3) {
            playerTile = 7;
            alert("🪜 Naik Tangga ke Petak 7!");
        } else if (playerTile === 8) {
            playerTile = 4;
            alert("🐍 Digigit Ular! Turun ke Petak 4.");
        }
    } else {
        SoundEffects.playWrong();
        alert("Jawaban salah! Token tetap diam di tempat.");
    }
    
    snakesQuestionsIdx++;
    
    if (snakesQuestionsIdx === 10) {
        if (playerTile >= 10) {
            updateStars(30);
            sendDataToGoogleSheet({
                type: "Latihan",
                score: "Token Sampai (Menang)",
                details: "Menyelesaikan game Ular Tangga hingga petak 10 setelah 10 soal"
            });
            target.innerHTML = `
                <div style="text-align:center; padding: 2rem 0;">
                    <div style="font-size: 5rem;">🎲🎉</div>
                    <h3 style="font-size: 2rem; font-weight: 900; color: var(--primary); margin-bottom: 1rem;">Kamu Menang!</h3>
                    <p style="font-size:1.2rem; font-weight:800; margin-bottom:1.5rem;">Token berhasil mencapai petak finish ke-10 setelah menjawab 10 soal! Dapat ⭐ 30 Bintang!</p>
                </div>
            `;
            enableNextButton(btnNext);
        } else {
            sendDataToGoogleSheet({
                type: "Latihan",
                score: "Belum Sampai (Gagal)",
                details: `Menyelesaikan 10 soal Ular Tangga namun berakhir di petak ${playerTile}`
            });
            target.innerHTML = `
                <div style="text-align:center; padding: 2rem 0;">
                    <div style="font-size: 5rem;">😢🎲</div>
                    <h3 style="font-size: 2rem; font-weight: 900; color: var(--accent); margin-bottom: 1rem;">Belum Mencapai Finish!</h3>
                    <p style="font-size:1.2rem; font-weight:800; margin-bottom:1.5rem;">Kamu sudah menjawab 10 soal, namun tokenmu berakhir di petak ${playerTile} (belum mencapai finish petak 10).</p>
                    <button class="btn-icon" onclick="startMeeting('p2')">Ulangi Kuis / Bab</button>
                </div>
            `;
        }
    } else {
        showSnakesQuestion(target, btnNext);
    }
}

// --- GAME P3: TEKA TEKI SILANG (CROSSWORD) ---
function runCrossword(target, btnNext) {
    const gridRows = 7;
    const gridCols = 10;
    
    const cellConfig = {
        "0-7": { letter: "K", number: 2 },
        "0-9": { letter: "F", number: 3 },
        "1-1": { letter: "E", number: 1 },
        "1-2": { letter: "V", number: 8 },
        "1-3": { letter: "A", number: 9 },
        "1-4": { letter: "P", number: 10 },
        "1-5": { letter: "O" },
        "1-6": { letter: "R" },
        "1-7": { letter: "A" },
        "1-8": { letter: "S", number: 6 },
        "1-9": { letter: "I" },
        "2-1": { letter: "S" },
        "2-2": { letter: "O" },
        "2-3": { letter: "S" },
        "2-4": { letter: "A" },
        "2-7": { letter: "R" },
        "2-8": { letter: "E" },
        "2-9": { letter: "S" },
        "3-2": { letter: "L" },
        "3-3": { letter: "A" },
        "3-4": { letter: "H", number: 4 },
        "3-5": { letter: "U" },
        "3-6": { letter: "J" },
        "3-7": { letter: "A" },
        "3-8": { letter: "N" },
        "3-9": { letter: "I" },
        "4-2": { letter: "U" },
        "4-3": { letter: "P" },
        "4-4": { letter: "A" },
        "4-7": { letter: "T" },
        "4-8": { letter: "G" },
        "4-9": { letter: "K" },
        "5-2": { letter: "M" },
        "5-4": { letter: "T" },
        "5-5": { letter: "K", number: 5 },
        "5-6": { letter: "I" },
        "5-7": { letter: "M" },
        "5-8": { letter: "I" },
        "5-9": { letter: "A" },
        "6-2": { letter: "E" }
    };

    let gridHtml = "";
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const key = `${r}-${c}`;
            const conf = cellConfig[key];
            if (conf) {
                const numSpan = conf.number ? `<span class="crossword-number">${conf.number}</span>` : "";
                gridHtml += `
                    <div class="crossword-cell-wrapper">
                        ${numSpan}
                        <input type="text" class="crossword-cell" maxlength="1" id="cell-${r}-${c}">
                    </div>
                `;
            } else {
                gridHtml += `<div class="crossword-cell black-cell"></div>`;
            }
        }
    }

    target.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:15px; align-items:center; width:100%;">
            <!-- Grid Crossword -->
            <div class="crossword-grid" style="--grid-cols: repeat(10, 42px); --grid-rows: repeat(7, 42px); --grid-cols-mobile: repeat(10, 31px); --grid-rows-mobile: repeat(7, 31px); gap: 5px; justify-content: center; margin: 1.5rem auto; display: grid;">
                ${gridHtml}
            </div>
            
            <!-- Pertanyaan Clues -->
            <div style="background:white; padding:20px; border-radius:18px; border:2px solid #cbd5e1; width:100%; text-align:left; box-sizing:border-box; font-size:0.95rem; line-height:1.6;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                    <div>
                        <h4 style="margin:0 0 10px 0; color:var(--primary); font-weight:900; font-size:1.1rem;">➡️ MENDATAR:</h4>
                        <p style="margin:4px 0;"><strong>1:</strong> Proses penguapan air permukaan karena panas matahari (9 Kotak)</p>
                        <p style="margin:4px 0;"><strong>4:</strong> Hasil presipitasi uap air di awan dalam siklus air (5 Kotak)</p>
                        <p style="margin:4px 0;"><strong>5:</strong> Perubahan zat yang menghasilkan zat jenis baru (5 Kotak)</p>
                    </div>
                    <div>
                        <h4 style="margin:0 0 10px 0; color:var(--secondary); font-weight:900; font-size:1.1rem;">⬇️ MENURUN:</h4>
                        <p style="margin:4px 0;"><strong>1:</strong> Zat air dalam wujud padat (2 Kotak)</p>
                        <p style="margin:4px 0;"><strong>2:</strong> Kerusakan logam besi akibat bereaksi dengan air & oksigen (5 Kotak)</p>
                        <p style="margin:4px 0;"><strong>3:</strong> Perubahan zat tanpa menghasilkan zat baru (6 Kotak)</p>
                        <p style="margin:4px 0;"><strong>6:</strong> Logam anti karat yang sering dipakai melapisi atap seng (4 Kotak)</p>
                        <p style="margin:4px 0;"><strong>8:</strong> Ukuran banyaknya ruang yang ditempati suatu materi (6 Kotak)</p>
                        <p style="margin:4px 0;"><strong>9:</strong> Gas sisa pembakaran yang melayang di udara (4 Kotak)</p>
                        <p style="margin:4px 0;"><strong>10:</strong> Alat pertukangan untuk melubangi atau mengukir kayu (5 Kotak)</p>
                    </div>
                </div>
            </div>
            
            <button class="btn-icon" style="width:100%;" id="btn-check-crossword">Periksa Teka-Teki ✍️</button>
        </div>
    `;
    
    document.getElementById("btn-check-crossword").addEventListener("click", () => {
        const answers = {
            m1: getGridWord(["1-1", "1-2", "1-3", "1-4", "1-5", "1-6", "1-7", "1-8", "1-9"]), // EVAPORASI
            m4: getGridWord(["3-4", "3-5", "3-6", "3-7", "3-8"]), // HUJAN
            m5: getGridWord(["5-5", "5-6", "5-7", "5-8", "5-9"]), // KIMIA
            d1: getGridWord(["1-1", "2-1"]), // ES
            d2: getGridWord(["0-7", "1-7", "2-7", "3-7", "4-7"]), // KARAT
            d3: getGridWord(["0-9", "1-9", "2-9", "3-9", "4-9", "5-9"]), // FISIKA
            d6: getGridWord(["1-8", "2-8", "3-8", "4-8"]), // SENG
            d8: getGridWord(["1-2", "2-2", "3-2", "4-2", "5-2", "6-2"]), // VOLUME
            d9: getGridWord(["1-3", "2-3", "3-3", "4-3"]), // ASAP
            d10: getGridWord(["1-4", "2-4", "3-4", "4-4", "5-4"]) // PAHAT
        };
        
        if (
            answers.m1 === "EVAPORASI" &&
            answers.m4 === "HUJAN" &&
            answers.m5 === "KIMIA" &&
            answers.d1 === "ES" &&
            answers.d2 === "KARAT" &&
            answers.d3 === "FISIKA" &&
            answers.d6 === "SENG" &&
            answers.d8 === "VOLUME" &&
            answers.d9 === "ASAP" &&
            answers.d10 === "PAHAT"
        ) {
            winTTS();
        } else {
            SoundEffects.playWrong();
            alert("Beberapa huruf masih salah atau kosong! Silakan periksa kembali.");
        }
    });
    
    function getGridWord(ids) {
        return ids.map(id => {
            const el = document.getElementById(`cell-${id}`);
            return el ? el.value.trim().toUpperCase() : "";
        }).join("");
    }
    
    function winTTS() {
        SoundEffects.playCorrect();
        updateStars(30);
        sendDataToGoogleSheet({
            type: "Latihan",
            score: "TTS Selesai (Menang)",
            details: "Berhasil menyelesaikan teka-teki silang dengan 10 soal secara benar"
        });
        target.innerHTML = `
            <div style="text-align:center; padding: 2rem 0;">
                <div style="font-size: 5rem;">✍️🎉</div>
                <h3 style="font-size: 2rem; font-weight: 900; color: var(--primary); margin-bottom: 1rem;">TTS Berhasil Terisi!</h3>
                <p style="font-size:1.2rem; font-weight:800; margin-bottom:1.5rem;">Sangat hebat! Teka-teki silang materi perubahan fisika, kimia &amp; siklus air selesai. Dapat ⭐ 30 Bintang!</p>
            </div>
        `;
        enableNextButton(btnNext);
    }
}

// --- GAME P4: PECAH BALON ---
let balloonPoints = 0;
let balloonRound = 1;
function runBalloonPop(target, btnNext) {
    balloonPoints = 0;
    balloonRound = 1;
    showBalloonRound(target, btnNext);
}

function showBalloonRound(target, btnNext) {
    const list = meetingsConfig.p4.latihan;
    const q = list[balloonRound - 1];
    
    let balloonsHtml = "";
    if (q.a.length === 4) {
        balloonsHtml = `
            <!-- 4 Balloons -->
            <div class="balloon-item" style="left:10%; bottom:30px; background:#ef4444;" onclick="popBalloon(0, ${q.c})">${q.a[0]}</div>
            <div class="balloon-item" style="left:32%; bottom:90px; background:#3b82f6;" onclick="popBalloon(1, ${q.c})">${q.a[1]}</div>
            <div class="balloon-item" style="left:55%; bottom:50px; background:#10b981;" onclick="popBalloon(2, ${q.c})">${q.a[2]}</div>
            <div class="balloon-item" style="left:76%; bottom:110px; background:#f59e0b;" onclick="popBalloon(3, ${q.c})">${q.a[3]}</div>
        `;
    } else {
        // True/False (2 Balloons)
        balloonsHtml = `
            <!-- 2 Balloons -->
            <div class="balloon-item" style="left:20%; bottom:60px; background:#10b981;" onclick="popBalloon(0, ${q.c})">${q.a[0]}</div>
            <div class="balloon-item" style="left:60%; bottom:60px; background:#ef4444;" onclick="popBalloon(1, ${q.c})">${q.a[1]}</div>
        `;
    }
    
    target.innerHTML = `
        <div style="text-align:center; font-weight:850; margin-bottom:10px;">Ronde ${balloonRound}/10. Skor: ${balloonPoints} Poin</div>
        <p style="font-weight:900; font-size:1.15rem; text-align:center; margin-bottom:15px; color:var(--primary);">${q.q}</p>
        
        <div class="balloon-arena">
            ${balloonsHtml}
        </div>
    `;
}

function popBalloon(idx, correct) {
    const target = document.getElementById("game-arena-target");
    const btnNext = document.getElementById("btn-next-step");
    
    if (idx === correct) {
        SoundEffects.playCorrect();
        balloonPoints += 10;
        alert("💥 POP! Jawaban Benar!");
        
        if (balloonRound < 10) {
            balloonRound++;
            showBalloonRound(target, btnNext);
        } else {
            updateStars(30);
            sendDataToGoogleSheet({
                type: "Latihan",
                score: balloonPoints + " Poin",
                details: `Menyelesaikan game Pecah Balon 10 ronde dengan total skor: ${balloonPoints} Poin`
            });
            target.innerHTML = `
                <div style="text-align:center; padding: 2rem 0;">
                    <div style="font-size: 5rem;">🎈🎉</div>
                    <h3 style="font-size: 2rem; font-weight: 900; color: var(--primary); margin-bottom: 1rem;">Semua Balon Dipecahkan!</h3>
                    <p style="font-size:1.2rem; font-weight:800; margin-bottom:1.5rem;">Luar biasa! Skor akhirmu: ${balloonPoints} Poin. Kamu memperoleh ⭐ 30 Bintang!</p>
                </div>
            `;
            enableNextButton(btnNext);
        }
    } else {
        SoundEffects.playWrong();
        alert("Aduh, salah balon! Balonnya membal saja.");
    }
}

// 11. Refleksi (Emoji + Mentimeter Wall Tanggapan)
async function renderRefleksi(card, btnNext) {
    disableNextButton(btnNext);

    card.innerHTML = `
        <div style="text-align:center; padding: 3rem 0;">
            <div style="font-size:3.5rem; margin-bottom:1rem; animation: spin 2s linear infinite; display: inline-block;">⏳</div>
            <p style="font-weight:800; font-size:1.15rem; color: var(--primary);">Memuat Mentimeter Wall Kelas...</p>
            <p style="font-size:0.95rem; color: var(--text-muted); margin-top:5px;">Mengambil tanggapan dari teman sekelas...</p>
        </div>
    `;
    
    await fetchOnlineClassroomData();
    
    const meetingTitle = getMeetingTitle();
    const realComments = [];
    const seenNames = new Set();
    
    for (let i = onlineClassroomData.length - 1; i >= 0; i--) {
        const row = onlineClassroomData[i];
        if (row.type === "Refleksi" && row.meeting === meetingTitle && row.name !== studentName) {
            if (!seenNames.has(row.name)) {
                seenNames.add(row.name);
                realComments.push(row);
            }
        }
    }
    
    realComments.reverse();

    let bubblesHtml = "";
    if (realComments.length === 0) {
        bubblesHtml = `<div style="text-align:center; padding: 15px; font-weight:800; color:var(--text-muted); font-size:0.95rem;" id="no-comments-placeholder">Belum ada respon dari teman sekelas. Jadilah yang pertama mengisi! ✍️</div>`;
    } else {
        realComments.forEach(c => {
            bubblesHtml += getBubbleHtml(c.name, c.details);
        });
    }

    card.innerHTML = `
        <h3 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 1rem; text-align:center;">✍️ Refleksi Belajar Hari Ini</h3>
        <p style="font-weight: 800; margin-bottom: 10px; text-align:center;">Bagaimana perasaanmu setelah belajar petualangan hari ini?</p>
        
        <div style="display:flex; justify-content:center; gap:20px; font-size:3rem; margin-bottom:1.5rem;" id="ref-emojis">
            <span style="cursor:pointer; transition: transform 0.2s;" id="emoji-g">😊</span>
            <span style="cursor:pointer; transition: transform 0.2s;" id="emoji-n">😐</span>
            <span style="cursor:pointer; transition: transform 0.2s;" id="emoji-b">☹️</span>
        </div>

        <div class="hidden" id="ref-opinion-container" style="animation:fadeIn 0.3s ease;">
            <div style="margin-bottom: 12px; text-align: left;">
                <p style="font-weight:800; margin-bottom:8px;">1. Tuliskan apa yang kamu rasakan atau pelajari hari ini:</p>
                <input type="text" id="ref-opinion-input" placeholder="Contoh: Sangat menyenangkan belajar partikel..." style="width:100%; padding:12px; border:3px solid #cbd5e1; border-radius:15px; font-weight:800; outline:none; font-family:var(--font); box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 15px; text-align: left;">
                <p style="font-weight:800; margin-bottom:8px;">2. Setelah pembelajaran hari ini, hal apa yang masih ingin kamu ketahui atau coba cari tahu?</p>
                <input type="text" id="ref-curiosity-input" placeholder="Contoh: Mengapa minyak goreng tidak larut dalam air..." style="width:100%; padding:12px; border:3px solid #cbd5e1; border-radius:15px; font-weight:800; outline:none; font-family:var(--font); box-sizing: border-box;">
            </div>
            
            <button class="btn-icon" style="width:100%;" id="btn-submit-ref-menti">Kirim ke Mentimeter Wall 🚀</button>
        </div>

        <!-- Mentimeter Wall -->
        <div class="hidden" id="menti-wall-container" style="animation:fadeIn 0.4s ease;">
            <h4 style="font-weight:900; font-size:1.1rem; color:var(--primary); margin-bottom:5px; text-align:center;">💬 MENTIMETER WALL KELAS</h4>
            <div class="menti-wall" id="menti-bubbles-box">
                ${bubblesHtml}
            </div>
        </div>
    `;

    let selectedEmoji = false;
    const emojis = ["emoji-g", "emoji-n", "emoji-b"];
    
    emojis.forEach(eId => {
        document.getElementById(eId).addEventListener("click", () => {
            SoundEffects.playClick();
            emojis.forEach(id => {
                document.getElementById(id).style.transform = "scale(1)";
                document.getElementById(id).style.filter = "grayscale(80%)";
            });
            document.getElementById(eId).style.transform = "scale(1.3)";
            document.getElementById(eId).style.filter = "none";
            selectedEmoji = true;
            
            document.getElementById("ref-opinion-container").classList.remove("hidden");
        });
    });

    document.getElementById("btn-submit-ref-menti").addEventListener("click", () => {
        const textVal = document.getElementById("ref-opinion-input").value.trim();
        const curiosityVal = document.getElementById("ref-curiosity-input").value.trim();
        
        if (textVal.length < 3 || curiosityVal.length < 3) {
            alert("Harap jawab kedua pertanyaan refleksi terlebih dahulu ya!");
            return;
        }
        
        SoundEffects.playCorrect();
        document.getElementById("btn-submit-ref-menti").disabled = true;
        document.getElementById("btn-submit-ref-menti").innerText = "Terkirim ✔";
        
        // Show wall
        const wall = document.getElementById("menti-wall-container");
        wall.classList.remove("hidden");
        
        const box = document.getElementById("menti-bubbles-box");
        const placeholder = document.getElementById("no-comments-placeholder");
        if (placeholder) placeholder.remove();
        
        box.innerHTML += `
            <div class="menti-bubble player-bubble">
                ${studentName || "Anda"}: ${textVal}
                <br><span style="font-size:0.85rem; opacity:0.9; font-weight:700;">🔍 Ingin tahu: ${curiosityVal}</span>
            </div>
        `;
        box.scrollTop = box.scrollHeight;
        
        updateStars(10);
        sendDataToGoogleSheet({
            type: "Refleksi",
            score: "-",
            details: `Pelajari: ${textVal} | Ingin Tahu: ${curiosityVal}`
        });
        enableNextButton(btnNext);
        setAvatar("celebrate", "Refleksimu masuk Mentimeter kelas! Klik Lanjut ke Ujian Posttest!");
    });
}

async function renderPosttest(card, btnNext) {
    const localScores = JSON.parse(localStorage.getItem("ppgStudentScores")) || {};
    const studentMeetingScores = (localScores[activeMeeting] && localScores[activeMeeting][studentName]) || {};
    const hasCompletedPosttest = studentMeetingScores.posttest !== undefined && studentMeetingScores.posttest !== null;
    
    if (hasCompletedPosttest || currentStep < maxStepReached) {
        enableNextButton(btnNext);
        showCompetitionPodium();
        return;
    }
    
    disableNextButton(btnNext);
    compType = "posttest";
    compQuestionsList = meetingsConfig[activeMeeting].posttest;
    
    card.innerHTML = `
        <div style="text-align:center; padding: 3rem 0;">
            <div style="font-size:3.5rem; margin-bottom:1rem; animation: spin 2s linear infinite; display: inline-block;">⏳</div>
            <p style="font-weight:800; font-size:1.15rem; color: var(--primary);">Menghubungkan ke Papan Skor Kelas Online...</p>
            <p style="font-size:0.95rem; color: var(--text-muted); margin-top:5px;">Mengambil data ujian teman sekelas...</p>
        </div>
    `;
    
    await syncOnlineData();
    startCompetitionQuiz(card);
}

function startCompetitionQuiz(card) {
    compQuestionIdx = 0;
    compPlayerScore = 0;
    compActive = true;
    posttestAnalysis = [];
    posttestCorrectCount = 0;
    
    compBots.forEach(b => {
        b.score = 0;
    });
    
    showCompetitionQuestion(card);
}

function showCompetitionQuestion(card) {
    clearInterval(compTimerInterval);
    const item = compQuestionsList[compQuestionIdx];
    
    compBots.forEach(b => {
        b.hasAnswered = false;
        b.thinkTime = 2000 + Math.random() * 12000;
    });
    
    setAvatar("thinking", `Soal ${compQuestionIdx + 1}/${compQuestionsList.length}. Jawab cepat dan tepat untuk nilai tinggi!`);
    
    card.innerHTML = `
        <div class="comp-arena">
            <div class="comp-leaderboard-panel">
                <div class="comp-leaderboard-title">🏆 KLASEMEN LIVE</div>
                <div id="comp-leaderboard-rows" style="display:flex; flex-direction:column; gap:8px;"></div>
            </div>
            
            <div class="comp-question-panel">
                <div class="quiz-timer-container">
                    <div class="quiz-timer-bar" id="quiz-timer-bar" style="width:100%;"></div>
                </div>
                <div class="test-quiz-progress" style="margin-bottom:5px;">
                    ${compType === "latihan" ? "Latihan Kompetisi" : "Ujian Akhir"} - Soal ${compQuestionIdx + 1}/${compQuestionsList.length}
                </div>
                <div class="question-text" style="font-size:1.25rem; margin-bottom:1rem;">${item.q}</div>
                <div style="display:flex; flex-direction:column; gap:10px;" id="comp-choices-box"></div>
                <div class="quiz-feedback hidden" id="comp-feedback-box" style="margin-top:15px;"></div>
                <button class="btn-icon hidden" id="btn-next-comp-question" style="width:100%; margin-top:15px;">Lanjut ➔</button>
            </div>
        </div>
    `;
    
    const choicesBox = document.getElementById("comp-choices-box");
    item.a.forEach((ans, idx) => {
        choicesBox.innerHTML += `
            <button class="quiz-btn" style="text-align:left; padding:10px 15px;" id="comp-opt-${idx}">
                ${String.fromCharCode(65 + idx)}. ${ans}
            </button>
        `;
    });
    
    renderLiveLeaderboard();
    
    compTimerVal = 20;
    const timerBar = document.getElementById("quiz-timer-bar");
    
    compTimerInterval = setInterval(() => {
        compTimerVal -= 0.1;
        if (compTimerVal <= 0) {
            compTimerVal = 0;
            clearInterval(compTimerInterval);
            timerBar.style.width = "0%";
            handlePlayerAnswer(-1);
        } else {
            let pct = (compTimerVal / 20) * 100;
            timerBar.style.width = `${pct}%`;
            
            let elapsed = 20 - compTimerVal;
            compBots.forEach(b => {
                if (!b.hasAnswered && elapsed >= b.thinkTime / 1000) {
                    b.hasAnswered = true;
                    const isCorrect = Math.random() < b.accuracy;
                    if (isCorrect) {
                        b.score += 500 + Math.round(500 * (compTimerVal / 20));
                    }
                    renderLiveLeaderboard();
                }
            });
        }
    }, 100);
    
    item.a.forEach((ans, idx) => {
        document.getElementById(`comp-opt-${idx}`).addEventListener("click", () => {
            clearInterval(compTimerInterval);
            handlePlayerAnswer(idx);
        });
    });
}

function handlePlayerAnswer(playerChoiceIdx) {
    const item = compQuestionsList[compQuestionIdx];
    const buttons = document.querySelectorAll("#comp-choices-box button");
    buttons.forEach(b => b.disabled = true);
    
    compBots.forEach(b => {
        if (!b.hasAnswered) {
            b.hasAnswered = true;
            const isCorrect = Math.random() < b.accuracy;
            if (isCorrect) {
                b.score += 500 + Math.round(500 * (compTimerVal / 20));
            }
        }
    });
    
    const isCorrect = playerChoiceIdx === item.c;
    if (isCorrect) {
        posttestCorrectCount++;
    }
    const chosenChar = playerChoiceIdx === -1 ? "Tidak Menjawab" : String.fromCharCode(65 + playerChoiceIdx);
    const correctChar = String.fromCharCode(65 + item.c);
    posttestAnalysis.push(`No ${compQuestionIdx + 1}: ${isCorrect ? '✅ Benar' : `❌ Salah (Pilih: ${chosenChar}, Kunci: ${correctChar})`}`);
    let earnedPoints = 0;
    
    const feedbackBox = document.getElementById("comp-feedback-box");
    const nextQBtn = document.getElementById("btn-next-comp-question");
    
    if (isCorrect) {
        SoundEffects.playCorrect();
        earnedPoints = 500 + Math.round(500 * (compTimerVal / 20));
        compPlayerScore += earnedPoints;
        
        document.getElementById(`comp-opt-${playerChoiceIdx}`).classList.add("correct");
        feedbackBox.className = "quiz-feedback success-msg";
        feedbackBox.innerHTML = `🎉 <strong>Benar Cepat!</strong> Anda menjawab dalam ${(20 - compTimerVal).toFixed(1)} detik. Mendapatkan <strong>${earnedPoints} Poin</strong>!`;
        setAvatar("celebrate", "Kerja bagus! Kecepatanmu membuahkan poin tinggi!");
    } else {
        SoundEffects.playWrong();
        if (playerChoiceIdx !== -1) {
            document.getElementById(`comp-opt-${playerChoiceIdx}`).classList.add("wrong");
        }
        buttons[item.c].classList.add("correct");
        feedbackBox.className = "quiz-feedback error-msg";
        feedbackBox.innerHTML = `❌ <strong>Kurang Tepat!</strong> Jawaban yang benar: ${String.fromCharCode(65 + item.c)}. ${item.a[item.c]}`;
        setAvatar("sad", "Kurang beruntung. Uji kemampuanmu kembali!");
    }
    
    feedbackBox.classList.remove("hidden");
    nextQBtn.classList.remove("hidden");
    
    renderLiveLeaderboard();
    
    nextQBtn.addEventListener("click", () => {
        SoundEffects.playClick();
        if (compQuestionIdx < compQuestionsList.length - 1) {
            compQuestionIdx++;
            showCompetitionQuestion(document.getElementById("step-card"));
        } else {
            showCompetitionPodium();
        }
    });
}

function renderLiveLeaderboard() {
    const list = [
        { name: studentName || "Anda", score: compPlayerScore, isPlayer: true, hasAnswered: true },
        ...compBots.map(b => ({ name: b.name, score: b.score, isPlayer: false, hasAnswered: b.hasAnswered }))
    ];
    
    list.sort((a, b) => b.score - a.score);
    
    const container = document.getElementById("comp-leaderboard-rows");
    if (!container) return;
    container.innerHTML = "";
    
    list.forEach((item, idx) => {
        let rowClass = item.isPlayer ? "player" : "bot-status";
        
        container.innerHTML += `
            <div class="comp-leader-row ${rowClass}">
                <span class="comp-leader-rank">${idx + 1}</span>
                <span class="comp-leader-name">${item.name}</span>
                <span class="comp-leader-score">${item.score}</span>
            </div>
        `;
    });
}

function showCompetitionPodium() {
    clearInterval(compTimerInterval);
    const list = [
        { name: studentName || "Anda", score: compPlayerScore, isPlayer: true },
        ...compBots.map(b => ({ name: b.name, score: b.score, isPlayer: false }))
    ];
    list.sort((a, b) => b.score - a.score);
    
    const p1 = list[0];
    const p2 = list[1] || { name: "-", score: 0 };
    const p3 = list[2] || { name: "-", score: 0 };
    
    let starsReward = 20;
    if (p1.isPlayer) starsReward = 50;
    else if (p2.isPlayer) starsReward = 40;
    else if (p3.isPlayer) starsReward = 30;
    
    updateStars(starsReward);
    SoundEffects.playFanfare();
    
    const playerRank = list.findIndex(item => item.isPlayer) + 1;
    const posttestTotalQ = compQuestionsList.length;
    const posttestScoreVal = Math.round((posttestCorrectCount / posttestTotalQ) * 100);
    
    // Automatically save posttest score
    saveScoreLocal(activeMeeting, studentName, "posttest", posttestScoreVal);
    
    // Read pretest score and calculate final score
    const localScores = JSON.parse(localStorage.getItem("ppgStudentScores")) || {};
    const studentMeetingScores = (localScores[activeMeeting] && localScores[activeMeeting][studentName]) || {};
    const preScore = studentMeetingScores.pretest !== undefined && studentMeetingScores.pretest !== null ? studentMeetingScores.pretest : 0;
    const finalScore = Math.round(0.3 * preScore + 0.7 * posttestScoreVal);
    
    let analysisHtml = posttestAnalysis.map((item, idx) => {
        const isCorrect = item.includes("✅ Benar");
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:${isCorrect ? '#f0fdf4' : '#fef2f2'}; border:1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}; border-radius:10px; font-size:0.85rem; font-weight:700; color:${isCorrect ? '#15803d' : '#b91c1c'};">
                <span>Soal No. ${idx + 1}</span>
                <span>${isCorrect ? '✅ Benar' : '❌ Salah'}</span>
            </div>
        `;
    }).join("");

    const card = document.getElementById("step-card");
    card.innerHTML = `
        <div style="text-align:center; max-height:560px; overflow-y:auto; padding: 5px;">
            <h3 style="font-size:2.2rem; font-weight:900; color:var(--secondary); margin-bottom:1rem;">🏆 Hasil Kompetisi Kelas 🏆</h3>
            <p style="font-size:1.15rem; font-weight:800; color:var(--text-muted); margin-bottom:15px;">Selamat! Kamu mendapatkan tambahan ⭐ ${starsReward} Bintang!</p>
            
            <div class="podium-container" style="margin-bottom:20px;">
                <div class="podium-step silver">
                    <span class="podium-badge">🥈</span>
                    <span class="podium-name">${p2.name}</span>
                    <span class="podium-score">${p2.score}</span>
                </div>
                
                <div class="podium-step gold">
                    <span class="podium-badge" style="top:-30px; font-size:2.5rem;">👑</span>
                    <span class="podium-name">${p1.name}</span>
                    <span class="podium-score">${p1.score}</span>
                </div>
                
                <div class="podium-step bronze">
                    <span class="podium-badge">🥉</span>
                    <span class="podium-name">${p3.name}</span>
                    <span class="podium-score">${p3.score}</span>
                </div>
            </div>
            
            <!-- Analisis Jawaban Posttest -->
            <div style="background:#f8fafc; border:3px solid #cbd5e1; border-radius:24px; padding:1.2rem; max-width:400px; margin:15px auto; text-align:left; box-sizing:border-box;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #cbd5e1; padding-bottom:8px; margin-bottom:12px;">
                    <span style="font-weight:900; font-size:1.05rem; color:var(--primary);">📊 Ujian Posttest Anda:</span>
                    <span style="font-weight:900; font-size:1.2rem; background:var(--primary); color:white; padding:4px 10px; border-radius:10px;">Nilai: ${posttestScoreVal} / 100</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; max-height: 150px; overflow-y: auto; padding-right:5px;">
                    ${analysisHtml}
                </div>
            </div>

            <!-- Rekapitulasi Otomatis -->
            <div style="background:#f8fafc; border:3px solid #cbd5e1; border-radius:24px; padding:1.5rem; max-width:400px; margin:20px auto; text-align:left; box-sizing:border-box;">
                <p style="font-weight:900; margin-bottom:8px; font-size:1.1rem; color:var(--success); text-align:center;">🏆 Rekor Skor Otomatis Direkap!</p>
                <div style="font-weight:800; font-size:1rem; line-height:1.6; color:var(--text);">
                    • Nama Siswa: <span style="color:var(--primary);">${studentName || "Anonim"}</span><br>
                    • Nilai Pretest (30%): <span style="color:var(--text-muted);">${preScore}%</span><br>
                    • Nilai Posttest (70%): <span style="color:var(--text-muted);">${posttestScoreVal}%</span><br>
                    • Nilai Akhir Peringkat: <span style="color:var(--secondary); font-size:1.1rem; font-weight:900;">${finalScore}</span>
                </div>
            </div>
            
            <button class="btn-icon btn-secondary" id="btn-podium-continue" style="width:100%;">Lanjut Petualangan ➔</button>
        </div>
    `;
    
    sendDataToGoogleSheet({
        type: "Posttest",
        score: posttestScoreVal + "/100",
        details: `Jawaban benar: ${posttestCorrectCount} dari ${posttestTotalQ} soal. Juara: ${playerRank} dari 5 peserta (Poin game: ${compPlayerScore}). Analisis: ${posttestAnalysis.join(", ")}`
    });
    
    enableNextButton(document.getElementById("btn-next-step"));
    
    if (p1.isPlayer) {
        setAvatar("celebrate", "Luar biasa! Kamu memenangkan podium JUARA 1 kelas hari ini!");
        spawnConfetti();
    } else {
        setAvatar("happy", "Hebat! Kamu berhasil menyelesaikan kuis kompetisi dengan gemilang.");
    }
    
    document.getElementById("btn-podium-continue").addEventListener("click", () => {
        nextStep();
    });
}

function saveRecordToDatabase(playerName, score) {
    if (playerName.toLowerCase() === "guru") {
        console.log("Aktivitas guru dideteksi. Rekor tidak disimpan ke database papan peringkat.");
        return;
    }
    const leaderboardData = JSON.parse(localStorage.getItem("ppgClassroomLeaderboard")) || {};
    if (!leaderboardData[activeMeeting]) {
        leaderboardData[activeMeeting] = [];
    }
    
    leaderboardData[activeMeeting].push({ name: playerName, score: score });
    
    leaderboardData[activeMeeting].sort((a,b) => b.score - a.score);
    leaderboardData[activeMeeting] = leaderboardData[activeMeeting].slice(0, 10);
    
    localStorage.setItem("ppgClassroomLeaderboard", JSON.stringify(leaderboardData));
}

// 13. Penutup & Badge
function renderPenutup(card, btnNext) {
    enableNextButton(btnNext);
    spawnConfetti();
    SoundEffects.playFanfare();
    const config = meetingsConfig[activeMeeting];
    
    // Mark as completed
    if (activeMeeting) {
        localStorage.setItem(activeMeeting + "_completed", "true");
        updateLevelCards();
    }
    
    let summaryHtml = "";
    if (activeMeeting === "p4") {
        summaryHtml = `
            <div style="background:#f8fafc; border:3px solid #cbd5e1; border-radius:24px; padding:1.5rem; text-align:left; margin-bottom:1.5rem;">
                <h4 style="font-weight:900; color:var(--primary); margin-bottom:10px; text-align:center;">🗺️ Peta Konsep Bab Zat & Perubahannya</h4>
                <p style="font-size:0.95rem; line-height:1.6; font-weight:600; color:var(--text);">
                    • <strong>Wujud Zat</strong> (Padat 🧱, Cair 💧, Gas 💨) terhubung dengan <strong>Model Partikel</strong>.<br>
                    • Suhu & pemanasan menyebabkan <strong>Perubahan Wujud</strong> (Mencair, Membeku, dll) and dipengaruhi oleh Titik Didih & Titik Leleh.<br>
                    • Setiap materi memiliki <strong>Kerapatan Zat</strong> (Massa Jenis &rho; = m / V) yang menentukan apakah benda terapung, melayang, atau tenggelam.<br>
                    • Perubahan zat terbagi menjadi <strong>Perubahan Fisika</strong> (lilin mencair, sobek kertas) & <strong>Perubahan Kimia</strong> (besi berkarat, kayu terbakar) yang terangkum dalam <strong>Siklus Air Dunia</strong>!
                </p>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="badge-award-card">
            <span class="badge-sprite-anim">${config.badgeEmoji}</span>
            <div class="badge-title">Lencana Terbuka!</div>
            <h3 style="font-size: 1.8rem; font-weight: 900; color: var(--text); margin-bottom: 1.5rem;">
                "${config.badgeName}"
            </h3>
            
            ${summaryHtml}
            
            <p style="font-size:1.15rem; font-weight:700; color:var(--text-muted); line-height:1.6; max-width:550px; margin:0 auto 2rem auto;">
                "Ilmu pengetahuan selalu dimulai dari rasa ingin tahu. Teruslah mengamati fenomena di sekitarmu dan jadilah ilmuwan muda!"
            </p>
        </div>
    `;
    
    setAvatar("celebrate", "Kamu luar biasa! Selamat atas pencapaian barumu hari ini!");
}

function spawnConfetti() {
    const activeCard = document.getElementById("step-card");
    const container = document.createElement("div");
    container.className = "confetti-wrapper";
    activeCard.appendChild(container);
    
    const colors = ["#ff5a5f", "#3b82f6", "#2ec4b6", "#ff9f1c", "#fde047"];
    for(let i=0; i<40; i++) {
        let div = document.createElement("div");
        div.className = "confetti-piece";
        div.style.left = `${Math.random() * 100}%`;
        div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        div.style.animationDelay = `${Math.random() * 2}s`;
        div.style.width = `${6 + Math.random() * 6}px`;
        div.style.height = `${10 + Math.random() * 10}px`;
        container.appendChild(div);
    }
}
