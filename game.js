(function () {
  'use strict';

  const COLS = 12;  // 좌우 1칸씩 증가 (10→12)
  const ROWS = 24;  // 상하 2칸씩 증가 (20→24)
  const BLOCK_SIZE = 30;
  const COLORS = [
    null,
    '#00f5ff', // I - cyan
    '#ffea00', // O - yellow
    '#bf5fff', // T - purple
    '#00ff88', // S - green
    '#ff3366', // Z - red
    '#0088ff', // J - blue
    '#ff8800', // L - orange
  ];

  const SHAPES = [
    null,
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[2, 2], [2, 2]],                                           // O
    [[0, 3, 0], [3, 3, 3], [0, 0, 0]],                         // T
    [[0, 4, 4], [4, 4, 0], [0, 0, 0]],                         // S
    [[5, 5, 0], [0, 5, 5], [0, 0, 0]],                         // Z
    [[6, 0, 0], [6, 6, 6], [0, 0, 0]],                         // J
    [[0, 0, 7], [7, 7, 7], [0, 0, 0]],                         // L
  ];

  const canvas = document.getElementById('game-board');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('next-canvas');
  const nextCtx = nextCanvas.getContext('2d');

  let board = [];
  let currentPiece = null;
  let nextPiece = null;
  let score = 0;
  let level = 1;
  let lines = 0;
  let gameOver = false;
  let paused = false;
  let lastDrop = 0;
  let animationId = null;
  let postDropNudgeLeft = 0;
  let postDropNudgeRight = 0;
  let lockDelayTimer = null;
  const LOCK_DELAY_MS = 500;
  let gameOverLockUntil = 0;
  const GAME_OVER_LOCK_MS = 1000;

  // 아무 입력 없을 때의 자동 낙하 속도만 증가 (유저 컨트롤(↓ 등)과 무관)
  const BASE_DROP_INTERVAL_MS = 1000;
  const MIN_DROP_INTERVAL_MS = 100;
  const LEVEL_DROP_FASTER_MS = 80;
  const POINTS_PER_SPEED_STEP = 10;
  const SPEED_INCREASE_PERCENT_PER_STEP = 2; // 10점당 2%, 시작 100%

  function getDropSpeedPercent() {
    return 100 + Math.floor(score / POINTS_PER_SPEED_STEP) * SPEED_INCREASE_PERCENT_PER_STEP;
  }

  // 낙하 속도 % → 구간별 텍스트 (UI 표시용)
  function getDropSpeedLabel(percent) {
    if (percent >= 1300) return '극한';
    if (percent >= 1000) return '초고속';
    if (percent >= 700) return '고속';
    if (percent >= 400) return '빠름';
    return '보통'; // 100 ~ 399
  }

  // 자동 낙하(키 입력 없을 때): 낙하 속도 %가 올라가면 인터벌이 줄어들어 블록이 더 빨리 내려옴
  function getDropInterval() {
    const baseByLevel = Math.max(MIN_DROP_INTERVAL_MS, BASE_DROP_INTERVAL_MS - (level - 1) * LEVEL_DROP_FASTER_MS);
    const speedMultiplier = getDropSpeedPercent() / 100;
    return baseByLevel / speedMultiplier;
  }

  // 즉시 낙하는 낙하 속도 증가의 20%만 적용. 예: 300%일 때 1+(3-1)*0.2 = 1.4 (140%)
  function getInstantDropMultiplier() {
    const pct = getDropSpeedPercent() / 100;
    return 1 + (pct - 1) * 0.2;
  }

  const startOverlay = document.getElementById('start-overlay');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const dropSpeedEl = document.getElementById('drop-speed');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');
  const finalScoreEl = document.getElementById('final-score');
  const scoreboardListEl = document.getElementById('scoreboard-list');
  const googleLoginBtn = document.getElementById('google-login-btn');
  const authUserArea = document.getElementById('auth-user-area');
  const authUserName = document.getElementById('auth-user-name');
  const logoutBtn = document.getElementById('logout-btn');
  const myStatsEl = document.getElementById('my-stats');
  const myBestScoreEl = document.getElementById('my-best-score');
  const myRankEl = document.getElementById('my-rank');

  const PLAYER_ID_COOKIE = 'tetris_player_id';
  const GUEST_NAME_COOKIE = 'tetris_guest_name';
  const PLAYER_ID_MAX_AGE_DAYS = 365;

  let currentUser = null;

  function getOrCreatePlayerId() {
    const match = document.cookie.match(new RegExp('(^| )' + PLAYER_ID_COOKIE + '=([^;]+)'));
    if (match && match[2]) return match[2];
    const id = 'pid_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
    document.cookie = PLAYER_ID_COOKIE + '=' + id + '; path=/; max-age=' + (PLAYER_ID_MAX_AGE_DAYS * 86400) + '; SameSite=Lax';
    return id;
  }

  function getOrCreateGuestName() {
    const match = document.cookie.match(new RegExp('(^| )' + GUEST_NAME_COOKIE + '=([^;]+)'));
    if (match && match[2]) return decodeURIComponent(match[2]);
    const num = String(Math.floor(100000 + Math.random() * 900000));
    const name = '게스트' + num;
    document.cookie = GUEST_NAME_COOKIE + '=' + encodeURIComponent(name) + '; path=/; max-age=' + (PLAYER_ID_MAX_AGE_DAYS * 86400) + '; SameSite=Lax';
    return name;
  }

  function getCurrentPlayerId() {
    return currentUser ? currentUser.id : getOrCreatePlayerId();
  }

  function getPlayerDisplayName() {
    if (currentUser) {
      const meta = currentUser.user_metadata || {};
      return (meta.full_name || meta.name || currentUser.email || 'User').trim() || 'User';
    }
    return getOrCreateGuestName();
  }

  let supabase = null;
  if (typeof window !== 'undefined' && window.TETRIS_SUPABASE_URL && window.TETRIS_SUPABASE_ANON_KEY && window.supabase) {
    try {
      const { createClient } = window.supabase;
      if (typeof createClient === 'function') {
        supabase = createClient(window.TETRIS_SUPABASE_URL, window.TETRIS_SUPABASE_ANON_KEY);
      }
    } catch (e) {
      console.warn('Supabase init failed', e);
    }
  }

  function updateAuthUI() {
    if (!googleLoginBtn || !authUserArea || !authUserName) return;
    if (currentUser) {
      googleLoginBtn.classList.add('hidden');
      authUserArea.classList.remove('hidden');
      authUserName.textContent = getPlayerDisplayName();
    } else {
      googleLoginBtn.classList.remove('hidden');
      authUserArea.classList.add('hidden');
    }
  }

  async function initAuth() {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      currentUser = session?.user ?? null;
      updateAuthUI();
      supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user ?? null;
        updateAuthUI();
        fetchTop10();
      });
    } catch (e) {
      console.warn('Auth init failed', e);
    }
  }

  async function signInWithGoogle() {
    if (!supabase) return;
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (e) {
      console.warn('Google sign in failed', e);
    }
  }

  async function signOut() {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      currentUser = null;
      updateAuthUI();
      fetchTop10();
    } catch (e) {
      console.warn('Sign out failed', e);
    }
  }

  const CLEAR_EFFECT_MS = 480;
  const CLEAR_PULSE_INTERVAL = 120;
  let clearingRows = [];
  let clearEffectStartTime = 0;
  let pendingScoreFromClear = 0;
  let pendingLinesFromClear = 0;

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function randomPiece() {
    const type = Math.floor(Math.random() * 7) + 1;
    const shape = SHAPES[type].map(row => [...row]);
    return { type, shape, x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2), y: 0 };
  }

  function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return rotated;
  }

  function collision(piece, offsetX = 0, offsetY = 0) {
    const { shape, x, y } = piece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c + offsetX;
          const newY = y + r + offsetY;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  }

  function mergePiece() {
    if (!currentPiece) return;
    const { shape, x, y, type } = currentPiece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardY = y + r;
          const boardX = x + c;
          if (boardY >= 0) board[boardY][boardX] = type;
        }
      }
    }
  }

  function getFullRowIndices() {
    const full = [];
    for (let row = 0; row < ROWS; row++) {
      if (board[row].every(cell => cell !== 0)) full.push(row);
    }
    return full;
  }

  function startClearEffect() {
    const fullRows = getFullRowIndices();
    if (fullRows.length === 0) return false;
    clearingRows = fullRows;
    clearEffectStartTime = performance.now();
    const points = [0, 100, 300, 500, 800];
    pendingScoreFromClear = (points[clearingRows.length] || 1200) * level;
    pendingLinesFromClear = clearingRows.length;
    return true;
  }

  function finishClearEffect() {
    const sorted = [...clearingRows].sort((a, b) => b - a);
    for (const row of sorted) {
      board.splice(row, 1);
    }
    for (let i = 0; i < sorted.length; i++) {
      board.unshift(Array(COLS).fill(0));
    }
    score += pendingScoreFromClear;
    lines += pendingLinesFromClear;
    level = Math.floor(lines / 10) + 1;
    clearingRows = [];
    pendingScoreFromClear = 0;
    pendingLinesFromClear = 0;
    spawnPiece();
    updateUI();
  }

  function clearLines() {
    if (startClearEffect()) return;
  }

  function spawnPiece() {
    currentPiece = nextPiece || randomPiece();
    nextPiece = randomPiece();
    drawNext();
    if (collision(currentPiece)) {
      gameOver = true;
      gameOverOverlay.classList.remove('hidden');
      finalScoreEl.textContent = `점수: ${score}`;
      cancelAnimationFrame(animationId);
      gameOverLockUntil = performance.now() + GAME_OVER_LOCK_MS;
      setTimeout(() => {
        const playerId = getCurrentPlayerId();
        const displayName = getPlayerDisplayName();
        submitScore(playerId, displayName, score);
      }, GAME_OVER_LOCK_MS);
    }
  }

  function clearPostDropState() {
    if (lockDelayTimer) clearTimeout(lockDelayTimer);
    lockDelayTimer = null;
    postDropNudgeLeft = 0;
    postDropNudgeRight = 0;
  }

  function applyLockAfterHardDrop() {
    lockDelayTimer = null;
    postDropNudgeLeft = 0;
    postDropNudgeRight = 0;
    if (!collision(currentPiece, 0, 1)) return; // 떨어질 공간 있으면 락하지 않고 기본 낙하로
    mergePiece();
    clearLines();
    if (clearingRows.length === 0) spawnPiece();
    updateUI();
  }

  function hardDrop() {
    if (!currentPiece || gameOver || paused) return;
    if (lockDelayTimer) {
      clearTimeout(lockDelayTimer);
      lockDelayTimer = null;
    }
    const instantMult = getInstantDropMultiplier();
    while (!collision(currentPiece, 0, 1)) {
      currentPiece.y++;
      score += Math.round(2 * instantMult);
    }
    postDropNudgeLeft = 1;
    postDropNudgeRight = 1;
    lockDelayTimer = setTimeout(applyLockAfterHardDrop, LOCK_DELAY_MS);
    updateUI();
  }

  function moveDown() {
    if (!currentPiece || gameOver || paused) return;
    if (lockDelayTimer) return; // 즉시 낙하 락 딜레이 중에는 일반 낙하로 락하지 않음
    if (collision(currentPiece, 0, 1)) {
      mergePiece();
      clearLines();
      if (clearingRows.length === 0) spawnPiece();
      score += 10;
    } else {
      currentPiece.y++;
    }
    updateUI();
  }

  function moveLeft() {
    if (!currentPiece || gameOver || paused) return;
    if (postDropNudgeLeft > 0 && !collision(currentPiece, -1, 0)) {
      currentPiece.x--;
      postDropNudgeLeft--;
      if (!collision(currentPiece, 0, 1)) clearPostDropState(); // 떨어질 공간 있으면 기본 낙하로
      return;
    }
    if (!collision(currentPiece, -1, 0)) currentPiece.x--;
  }

  function moveRight() {
    if (!currentPiece || gameOver || paused) return;
    if (postDropNudgeRight > 0 && !collision(currentPiece, 1, 0)) {
      currentPiece.x++;
      postDropNudgeRight--;
      if (!collision(currentPiece, 0, 1)) clearPostDropState(); // 떨어질 공간 있으면 기본 낙하로
      return;
    }
    if (!collision(currentPiece, 1, 0)) currentPiece.x++;
  }

  // 월킥: 회전 후 벽/블록과 겹치면 좌우로 밀어가며 회전 시도 (대부분 회전 성공하도록)
  function rotate() {
    if (!currentPiece || gameOver || paused) return;
    const rotated = rotateMatrix(currentPiece.shape);
    const prevShape = currentPiece.shape;
    const prevX = currentPiece.x;

    currentPiece.shape = rotated;
    if (!collision(currentPiece)) return; // 회전 성공

    // 벽/블록과 겹침 → 좌우 오프셋 순서로 시도
    const left = getPieceMinX(currentPiece);
    const right = getPieceMaxX(currentPiece);
    const hitLeft = left < 0;
    const hitRight = right >= COLS;

    // 막힌 쪽 반대방향을 먼저 시도 (왼쪽 벽이면 오른쪽으로, 오른쪽 벽이면 왼쪽으로)
    const order = hitLeft ? [1, 2, 3, -1, -2, -3] : hitRight ? [-1, -2, -3, 1, 2, 3] : [-1, 1, -2, 2, -3, 3];

    for (const offset of order) {
      currentPiece.x = prevX + offset;
      if (!collision(currentPiece)) return; // 월킥으로 회전 성공
    }

    // 모든 시도 실패 → 원복
    currentPiece.shape = prevShape;
    currentPiece.x = prevX;
  }

  function getPieceMinX(piece) {
    let min = COLS;
    const { shape, x } = piece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) min = Math.min(min, x + c);
      }
    }
    return min;
  }

  function getPieceMaxX(piece) {
    let max = -1;
    const { shape, x } = piece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) max = Math.max(max, x + c);
      }
    }
    return max;
  }

  function drawBlock(ctx, x, y, type, size = BLOCK_SIZE) {
    if (!type) return;
    const padding = size * 0.08;
    ctx.fillStyle = COLORS[type];
    ctx.fillRect(x * size + padding, y * size + padding, size - padding * 2, size - padding * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x * size + padding, y * size + padding, size - padding * 2, (size - padding * 2) * 0.3);
  }

  function drawBoard() {
    ctx.fillStyle = '#0f0f18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) drawBlock(ctx, c, r, board[r][c]);
      }
    }

    if (currentPiece) {
      const { shape, x, y, type } = currentPiece;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) drawBlock(ctx, x + c, y + r, type);
        }
      }
    }

    if (clearingRows.length > 0) {
      const elapsed = performance.now() - clearEffectStartTime;
      const beat = Math.floor(elapsed / CLEAR_PULSE_INTERVAL);
      const step = beat % 4;
      const intensity = step === 0 ? 1 : step === 1 ? 0.2 : step === 2 ? 0.9 : 0.15;
      ctx.fillStyle = `rgba(0, 245, 255, ${0.9 * intensity})`;
      for (const row of clearingRows) {
        ctx.fillRect(0, row * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
      }
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * intensity})`;
      for (const row of clearingRows) {
        ctx.fillRect(0, row * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
      }
    }
  }

  function drawNext() {
    nextCtx.fillStyle = '#0f0f18';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return;
    const shape = nextPiece.shape;
    const size = 28;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) drawBlock(nextCtx, offsetX + c, offsetY + r, nextPiece.type, size);
      }
    }
  }

  function updateUI() {
    dropSpeedEl.textContent = getDropSpeedLabel(getDropSpeedPercent());
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
  }

  async function fetchTop10() {
    if (!supabase || !scoreboardListEl) return;
    const myPlayerId = getCurrentPlayerId();
    try {
      const { data, error } = await supabase.from('tetris_scores').select('player_id, player_name, score').order('score', { ascending: false }).limit(10);
      if (error) throw error;
      scoreboardListEl.innerHTML = '';
      scoreboardListEl.classList.toggle('empty', !data || data.length === 0);
      if (!data || data.length === 0) {
        scoreboardListEl.innerHTML = '<li>기록 없음</li>';
        updateMyStats(null, null);
        return;
      }
      data.forEach((row, index) => {
        const rank = index + 1;
        const isMine = row.player_id === myPlayerId;
        const li = document.createElement('li');
        if (isMine) li.classList.add('my-score');
        if (isMine && rank <= 3) li.classList.add('top-three');
        li.innerHTML = `<span class="name">${escapeHtml(row.player_name || 'Player')}</span><span class="score-value">${Number(row.score).toLocaleString()}</span>`;
        scoreboardListEl.appendChild(li);
      });
      await fetchMyBestAndRank();
    } catch (e) {
      scoreboardListEl.innerHTML = '<li>불러오기 실패</li>';
      scoreboardListEl.classList.add('empty');
      updateMyStats(null, null);
    }
  }

  function updateMyStats(bestScore, rank) {
    if (!myStatsEl || !myBestScoreEl || !myRankEl) return;
    if (bestScore == null && rank == null) {
      myStatsEl.classList.add('hidden');
      return;
    }
    myStatsEl.classList.remove('hidden');
    myBestScoreEl.textContent = bestScore != null ? Number(bestScore).toLocaleString() + '점' : '-';
    myRankEl.textContent = rank != null ? rank + '위' : '-';
  }

  async function fetchMyBestAndRank() {
    if (!supabase || !myStatsEl) return;
    const myPlayerId = getCurrentPlayerId();
    try {
      const { data: myScores, error: err1 } = await supabase.from('tetris_scores').select('score').eq('player_id', myPlayerId).order('score', { ascending: false }).limit(1);
      if (err1 || !myScores || myScores.length === 0) {
        updateMyStats(null, null);
        return;
      }
      const myBest = Number(myScores[0].score);
      const { count, error: err2 } = await supabase.from('tetris_scores').select('*', { count: 'exact', head: true }).gt('score', myBest);
      if (err2) {
        updateMyStats(myBest, null);
        return;
      }
      const rank = (count ?? 0) + 1;
      updateMyStats(myBest, rank);
    } catch (e) {
      updateMyStats(null, null);
    }
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  async function submitScore(playerId, playerName, finalScore) {
    if (!supabase) {
      console.warn('Supabase client not ready – score not saved');
      return;
    }
    const name = (playerName || 'Player').trim() || 'Player';
    const scoreNum = Math.floor(Number(finalScore)) || 0;
    try {
      const { error } = await supabase.from('tetris_scores').insert({ player_id: playerId, player_name: name, score: scoreNum });
      if (error) throw error;
      await fetchTop10();
    } catch (e) {
      console.warn('Score submit failed', e);
    }
  }

  function gameLoop(timestamp) {
    if (gameOver) return;
    if (clearingRows.length > 0) {
      if (timestamp - clearEffectStartTime >= CLEAR_EFFECT_MS) finishClearEffect();
      drawBoard();
      animationId = requestAnimationFrame(gameLoop);
      return;
    }
    if (!paused && currentPiece && timestamp - lastDrop > getDropInterval()) {
      moveDown();
      lastDrop = timestamp;
    }
    drawBoard();
    animationId = requestAnimationFrame(gameLoop);
  }

  function init() {
    board = createBoard();
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    paused = false;
    clearingRows = [];
    pendingScoreFromClear = 0;
    pendingLinesFromClear = 0;
    if (lockDelayTimer) clearTimeout(lockDelayTimer);
    lockDelayTimer = null;
    postDropNudgeLeft = 0;
    postDropNudgeRight = 0;
    nextPiece = randomPiece();
    updateUI();
    drawBoard();
    spawnPiece();
    lastDrop = performance.now();
    gameOverOverlay.classList.add('hidden');
    animationId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    startOverlay.classList.add('hidden');
    init();
  }

  if (googleLoginBtn) googleLoginBtn.addEventListener('click', signInWithGoogle);
  if (logoutBtn) logoutBtn.addEventListener('click', signOut);

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    init();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !startOverlay.classList.contains('hidden')) {
      e.preventDefault();
      startGame();
      return;
    }
    if (e.code === 'Space' && !gameOverOverlay.classList.contains('hidden')) {
      e.preventDefault();
      if (performance.now() < gameOverLockUntil) return; // 1초 락 동안 다시 시작 불가
      gameOverOverlay.classList.add('hidden');
      init();
      return;
    }
    if (gameOver) return;
    if (e.code === 'KeyP') {
      paused = !paused;
      return;
    }
    if (paused) return;

    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        moveLeft();
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveRight();
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveDown();
        break;
      case 'ArrowUp':
        e.preventDefault();
        rotate();
        break;
      case 'Space':
        e.preventDefault();
        if (lockDelayTimer) return; // 즉시 낙하 후에는 방향키만 가능, 스페이스 사용 불가
        hardDrop();
        break;
    }
  });

  initAuth().then(() => {
    fetchTop10();
  });
  drawBoard();
})();
