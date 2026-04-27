// ═══════════════════════════════════════════════════════════
//  scores.js — Global leaderboard via Firebase Firestore
//
//  SETUP (5 minutes, free forever):
//  1. Go to https://console.firebase.google.com
//  2. Click "Add project" → name it "rose-arcade" → Create
//  3. Click the </> (Web) icon → register app → copy firebaseConfig
//  4. Paste the values into FB_CONFIG below
//  5. In Firebase Console → Firestore Database → Create database
//     → choose "Start in production mode" → pick a region → Done
//  6. In Firestore → Rules tab, paste the rules block at the bottom
//     of this file and click Publish
//  7. git add . ; git commit -m "add Firebase" ; git push
// ═══════════════════════════════════════════════════════════

(function () {

  // ── Firebase config ───────────────────────────────────────
  var FB_CONFIG = {
    apiKey:            "AIzaSyD7Ma0iEStWU0m9vQDX5UgvtU-gWYWZVgg",
    authDomain:        "rose-arcade.firebaseapp.com",
    projectId:         "rose-arcade",
    storageBucket:     "rose-arcade.firebasestorage.app",
    messagingSenderId: "822267120428",
    appId:             "1:822267120428:web:f14cb5b42c9fa90c1bba89",
    measurementId:     "G-EGR8PRVS8C"
  };
  // ─────────────────────────────────────────────────────────

  var GAME_NAMES = {
    'snake':       '🐍 Snake',
    'pacman':      '🟡 Pac-Man',
    'asteroids':   '☄️ Asteroids',
    'racing':      '🏎️ Road Racer',
    'pinball':     '🎱 Pinball',
    'tictactoe':   '❌ Tic-Tac-Toe',
    'pong':        '🏓 Pong',
    'memory':      '🧠 Memory',
    '2048':        '🔢 2048',
    'whackamole':  '🔨 Whack-a-Mole',
    'rps':         '✂️ Rock Paper Scissors',
    'minesweeper': '💣 Minesweeper',
    'tetris':      '🟦 Tetris',
    'breakout':    '🧱 Breakout',
    'invaders':    '👾 Invaders',
    'flappy':      '🐦 Flappy'
  };

  var db = null;
  var configured = FB_CONFIG.projectId && FB_CONFIG.projectId.indexOf('PASTE') === -1;

  if (configured) {
    try {
      if (typeof firebase === 'undefined') throw new Error('Firebase SDK not loaded');
      if (!firebase.apps.length) firebase.initializeApp(FB_CONFIG);
      db = firebase.firestore();
      console.log('[RoseArcade] Firebase connected ✓');
    } catch (e) {
      console.warn('[RoseArcade] Firebase init failed:', e.message);
    }
  }

  // ── Get the player's display name ──
  function getPlayerName() {
    var stored = localStorage.getItem('arcade_global_name');
    if (stored && stored.trim()) return stored.trim();
    // Fall back to P1 avatar name
    if (window.arcadeAvatars) {
      var av = arcadeAvatars.get('p1');
      if (av && av.n && av.n !== 'P1') return av.n;
    }
    return '';
  }

  function setPlayerName(n) {
    localStorage.setItem('arcade_global_name', n.trim().slice(0, 20));
  }

  function hasPlayerName() {
    return !!getPlayerName();
  }

  // ── Submit a score ──
  function submit(gameId, score) {
    if (!db || !score || score <= 0) return;
    var player = getPlayerName() || 'Anonymous';
    db.collection('scores').add({
      game:     gameId,
      gameName: GAME_NAMES[gameId] || gameId,
      player:   player,
      score:    Number(score),
      ts:       firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function (e) { console.warn('[RoseArcade] score submit failed', e); });
  }

  // ── Top N scores for one game ──
  function getGameTop(gameId, limit, cb) {
    if (!db) { cb([]); return; }
    db.collection('scores')
      .where('game', '==', gameId)
      .orderBy('score', 'desc')
      .limit(limit || 10)
      .get()
      .then(function (snap) { cb(snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })); })
      .catch(function () { cb([]); });
  }

  // ── Hall of Fame: per-game personal bests ranked ──
  // Returns an array of { game, gameName, player, score } sorted by score desc
  function getHallOfFame(limit, cb) {
    if (!db) { cb([]); return; }
    db.collection('scores')
      .orderBy('score', 'desc')
      .limit(limit || 25)
      .get()
      .then(function (snap) { cb(snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })); })
      .catch(function () { cb([]); });
  }

  window.arcadeScores = {
    submit:        submit,
    getGameTop:    getGameTop,
    getHallOfFame: getHallOfFame,
    getPlayerName: getPlayerName,
    setPlayerName: setPlayerName,
    hasPlayerName: hasPlayerName,
    isReady:       function () { return !!db; },
    GAME_NAMES:    GAME_NAMES
  };

})();

/*
═══════════════════════════════════════════════════════════
  FIRESTORE SECURITY RULES
  (Firebase Console → Firestore Database → Rules tab)
═══════════════════════════════════════════════════════════

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{doc} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['game','player','score','ts'])
                    && request.resource.data.score is number
                    && request.resource.data.score >= 0
                    && request.resource.data.player is string
                    && request.resource.data.player.size() >= 1
                    && request.resource.data.player.size() <= 20;
      allow update, delete: if false;
    }
  }
}

═══════════════════════════════════════════════════════════
*/
