// ---------- หน้าที่ของไพ่แต่ละแต้ม (แก้ไขได้ที่นี่) ----------
const ROLES = {
  A:  { name: "จิบ 1 จิบ",     desc: "คนจับได้ดื่ม 1 จิบ" },
  2:  { name: "จิบ 2 จิบ",     desc: "คนจับได้ดื่ม 2 จิบ" },
  3:  { name: "จิบ 3 จิบ",     desc: "คนจับได้ดื่ม 3 จิบ" },
  4:  { name: "หมดแก้ว",       desc: "คนจับได้ดื่มหมดแก้ว" },
  5:  { name: "บัดดี้",         desc: "เลือกเพื่อน 1 คนเป็นบัดดี้ ใครโดนดื่ม อีกคนต้องดื่มด้วย" },
  6:  { name: "หมวดหมู่",      desc: "ตั้งหมวด เช่น ยี่ห้อรถ ชื่อผลไม้ แล้วไล่ตอบทีละคน ใครตอบช้าหรือตอบซ้ำ ดื่ม" },
  7:  { name: "เซเว่นอัพ",      desc: "นับเลขต่อกันทีละคน เลขที่มี 7 หรือหาร 7 ลงตัว ให้พูด “เซเว่นอัพ” แทน ใครพลาด ดื่ม" },
  8:  { name: "เข้าห้องน้ำ",   desc: "ได้สิทธิ์เข้าห้องน้ำ 1 ครั้ง เก็บไว้ใช้ทีหลังได้ คนที่ไม่มีสิทธิ์ห้ามลุกไปห้องน้ำ" },
  9:  { name: "ซ้ายดื่ม",       desc: "คนที่นั่งทางซ้ายมือของคนจับได้ ดื่ม" },
  10: { name: "ขวาดื่ม",        desc: "คนที่นั่งทางขวามือของคนจับได้ ดื่ม" },
  J:  { name: "ห้ามพูด",       desc: "คนจับได้ห้ามพูด จนกว่าจะมีคนจับได้ J ใบต่อไป เผลอพูด ดื่ม" },
  Q:  { name: "ห้ามคุยด้วย",   desc: "ทุกคนห้ามพูดกับคนจับได้ จนกว่าจะมีคนจับได้ Q ใบต่อไป ใครเผลอคุยด้วย ดื่ม" },
  K:  { name: "ตั้งเงื่อนไข",   desc: "ตั้งคำสั่งให้คนที่จับได้ K ใบต่อไปต้องทำ เช่น ดื่มหมดแก้ว" },
};

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
// ︎ บังคับให้แสดงเป็นตัวอักษร ไม่ใช่ emoji
const SUITS = [
  { key: "spades",   sym: "♠︎", red: false },
  { key: "hearts",   sym: "♥︎", red: true },
  { key: "diamonds", sym: "♦︎", red: true },
  { key: "clubs",    sym: "♣︎", red: false },
];
const COURT_LABEL = { J: "Jack", Q: "Queen", K: "King" };

// ตำแหน่งดอกแบบไพ่จริง: [x%, y%] — ดอกครึ่งล่างจะกลับหัว
const L = 32, C = 50, R = 68;
const PIP_LAYOUT = {
  2:  [[C, 18], [C, 82]],
  3:  [[C, 18], [C, 50], [C, 82]],
  4:  [[L, 18], [R, 18], [L, 82], [R, 82]],
  5:  [[L, 18], [R, 18], [C, 50], [L, 82], [R, 82]],
  6:  [[L, 18], [R, 18], [L, 50], [R, 50], [L, 82], [R, 82]],
  7:  [[L, 18], [R, 18], [C, 34], [L, 50], [R, 50], [L, 82], [R, 82]],
  8:  [[L, 18], [R, 18], [C, 34], [L, 50], [R, 50], [C, 66], [L, 82], [R, 82]],
  9:  [[L, 18], [R, 18], [L, 39.3], [R, 39.3], [C, 50], [L, 60.7], [R, 60.7], [L, 82], [R, 82]],
  10: [[L, 18], [R, 18], [C, 28.7], [L, 39.3], [R, 39.3], [L, 60.7], [R, 60.7], [C, 71.3], [L, 82], [R, 82]],
};

// ---------- State ----------
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 20;
let playerCount = 2;
let deck = [];
let flippedCount = 0;
let turnIndex = 0;
let busy = false;

// ---------- Elements ----------
const $ = (id) => document.getElementById(id);
const setupEl = $("setup");
const tableEl = $("table");
const cardEl = $("card");
const frontEl = $("cardFront");
const roleEl = $("role");
const flipBtn = $("flipBtn");
const resetBtn = $("resetBtn");

// ---------- Deck ----------
function buildDeck() {
  const cards = [];
  for (const suit of SUITS) for (const rank of RANKS) cards.push({ rank, suit });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderCardFace({ rank, suit }) {
  frontEl.replaceChildren();
  frontEl.className = `face front ${suit.red ? "red" : "black"}`;

  for (const pos of ["tl", "br"]) {
    const idx = el("div", `index ${pos}`);
    idx.append(el("span", "r", rank), el("span", "s", suit.sym));
    frontEl.append(idx);
  }

  if (COURT_LABEL[rank]) {
    const court = el("div", "court");
    court.append(el("span", "big", rank), el("span", "suit", suit.sym), el("span", "label", COURT_LABEL[rank]));
    frontEl.append(court);
    return;
  }

  const pips = el("div", "pips");
  if (rank === "A") {
    const p = el("span", "pip ace", suit.sym);
    p.style.left = "50%";
    p.style.top = "50%";
    pips.append(p);
  } else {
    for (const [x, y] of PIP_LAYOUT[rank]) {
      const p = el("span", y > 50 ? "pip flip" : "pip", suit.sym);
      p.style.left = `${x}%`;
      p.style.top = `${y}%`;
      pips.append(p);
    }
  }
  frontEl.append(pips);
}

function renderRole({ rank }) {
  const role = ROLES[rank];
  roleEl.replaceChildren(el("h2", "", role.name), el("p", "", role.desc));
  roleEl.classList.remove("pop");
  void roleEl.offsetWidth; // restart animation
  roleEl.classList.add("pop");
}

// ---------- จำนวนผู้เล่น ----------
function renderCount() {
  $("playerCount").textContent = playerCount;
  $("minusBtn").disabled = playerCount <= MIN_PLAYERS;
  $("plusBtn").disabled = playerCount >= MAX_PLAYERS;
}

$("minusBtn").addEventListener("click", () => {
  playerCount = Math.max(MIN_PLAYERS, playerCount - 1);
  renderCount();
});
$("plusBtn").addEventListener("click", () => {
  playerCount = Math.min(MAX_PLAYERS, playerCount + 1);
  renderCount();
});
renderCount();

// ---------- Game ----------
function updateStatus() {
  $("remaining").textContent = deck.length;
  const turn = $("turn");
  turn.replaceChildren();
  if (deck.length) {
    turn.append("ตาของ ", el("em", "", `ผู้เล่น ${turnIndex + 1}`));
  }
  if (deck.length === 0) {
    flipBtn.textContent = "สับไพ่ เล่นอีกรอบ";
  } else {
    flipBtn.textContent = flippedCount ? "เปิดใบต่อไป" : "เปิดไพ่";
  }
}

function startGame() {
  deck = buildDeck();
  flippedCount = 0;
  turnIndex = 0;
  busy = false;
  cardEl.classList.remove("flipped");
  roleEl.replaceChildren(el("p", "role-placeholder", "กดปุ่มด้านล่างเพื่อเปิดไพ่ใบแรก"));
  $("historyList").replaceChildren();
  $("historyCount").textContent = "0";

  setupEl.hidden = true;
  tableEl.hidden = false;
  resetBtn.style.visibility = "visible";
  updateStatus();
}

function addHistory(card, player) {
  const li = el("li");
  const tag = el("span", card.suit.red ? "red" : "", `${card.rank}${card.suit.sym}`);
  li.append(tag, ` ${ROLES[card.rank].name} — ผู้เล่น ${player + 1}`);
  $("historyList").prepend(li);
  $("historyCount").textContent = flippedCount;
}

function flipCard() {
  if (busy) return;
  if (deck.length === 0) { startGame(); return; }
  busy = true;
  flipBtn.disabled = true;

  const card = deck.pop();
  const player = turnIndex;

  const reveal = () => {
    renderCardFace(card);
    cardEl.classList.add("flipped");
    flippedCount++;
    turnIndex = (turnIndex + 1) % playerCount;
    setTimeout(() => {
      renderRole(card);
      addHistory(card, player);
      updateStatus();
      busy = false;
      flipBtn.disabled = false;
    }, 400);
  };

  // ไพ่เปิดอยู่ → คว่ำก่อนแล้วค่อยเปิดใบใหม่
  if (cardEl.classList.contains("flipped")) {
    cardEl.classList.remove("flipped");
    setTimeout(reveal, 450);
  } else {
    reveal();
  }
}

$("startBtn").addEventListener("click", startGame);
resetBtn.addEventListener("click", () => {
  if (confirm("สับไพ่ใหม่และเริ่มรอบใหม่?")) startGame();
});
flipBtn.addEventListener("click", flipCard);
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || tableEl.hidden) return;
  if (["INPUT", "BUTTON"].includes(document.activeElement.tagName)) return;
  e.preventDefault();
  flipCard();
});
