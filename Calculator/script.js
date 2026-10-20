const symbols = { '/': '÷', '*': '×', '-': '−', '+': '+' };
let current = '0', previous = null, operator = null, fresh = true, memory = 0, soundOn = true;
let history = [];

const valueEl = document.getElementById('value');
const exprEl  = document.getElementById('expr');

const fmt = n => (isFinite(n) ? String(+n.toPrecision(12)) : 'Error');

function compute(a, b, op) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (op === '/') return b === 0 ? NaN : a / b;
  return b;
}

function render() {
  valueEl.textContent = current;
  valueEl.style.fontSize = current.length > 14 ? '24px' : current.length > 10 ? '32px' : '44px';
  exprEl.textContent = operator ? fmt(previous) + ' ' + symbols[operator] : '';
}

function beep() {
  if (!soundOn) return;
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = 520; gain.gain.value = 0.04;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

function addHistory(text, result) {
  history.unshift({ text, result });
  history = history.slice(0, 30);
  drawHistory();
}

function drawHistory() {
  const list = document.getElementById('list');
  list.innerHTML = history.length ? '' : '<p class="empty">No calculations yet.</p>';
  history.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = '<small></small><strong></strong>';
    li.children[0].textContent = item.text;
    li.children[1].textContent = item.result;
    li.onclick = () => {                      // tap an entry to reuse its result
      current = item.result; fresh = true; render();
      document.getElementById('panel').classList.remove('open');
    };
    list.appendChild(li);
  });
}

function press(action, v) {
  if (current === 'Error' && action !== 'ac') current = '0';
  const x = parseFloat(current);

  if (action === 'num') { current = (fresh || current === '0') ? v : current + v; fresh = false; }
  else if (action === 'dot') {
    if (fresh) { current = '0.'; fresh = false; }
    else if (!current.includes('.')) current += '.';
  }
  else if (action === 'op') {
    if (operator && !fresh) { previous = compute(previous, x, operator); current = fmt(previous); }
    else if (!operator) previous = x;
    operator = v; fresh = true;
  }
  else if (action === 'eq') {
    if (operator) {
      const result = fmt(compute(previous, x, operator));
      addHistory(fmt(previous) + ' ' + symbols[operator] + ' ' + fmt(x), result);
      current = result; operator = null; previous = null; fresh = true;
    }
  }
  else if (action === 'ac')  { current = '0'; previous = null; operator = null; fresh = true; }
  else if (action === 'del') {
    if (!fresh) { current = current.length > 1 ? current.slice(0, -1) : '0'; if (current === '-' ) current = '0'; }
  }
  else if (action === 'neg') { if (current !== '0') current = current[0] === '-' ? current.slice(1) : '-' + current; }
  else if (action === 'pct') { current = fmt(operator ? previous * x / 100 : x / 100); fresh = true; }
  else if (action === 'sqrt'){ current = fmt(x < 0 ? NaN : Math.sqrt(x)); addHistory('√(' + fmt(x) + ')', current); fresh = true; }
  else if (action === 'sq')  { current = fmt(x * x); addHistory(fmt(x) + '²', current); fresh = true; }
  else if (action === 'mc')  memory = 0;
  else if (action === 'mr')  { current = fmt(memory); fresh = true; }
  else if (action === 'm+')  { memory += x || 0; fresh = true; }
  else if (action === 'm-')  { memory -= x || 0; fresh = true; }

  beep();
  render();
}

document.getElementById('keys').addEventListener('click', e => {
  const btn = e.target.closest('button.k');
  if (btn) press(btn.dataset.a, btn.dataset.v);
});

document.addEventListener('keydown', e => {
  const k = e.key;
  if (/^[0-9]$/.test(k)) press('num', k);
  else if (k === '.') press('dot');
  else if ('+-*/'.includes(k)) press('op', k);
  else if (k === 'Enter' || k === '=') { e.preventDefault(); press('eq'); }
  else if (k === 'Backspace') press('del');
  else if (k === 'Escape') press('ac');
});

document.getElementById('sound').onclick = e => {
  soundOn = !soundOn;
  e.currentTarget.textContent = soundOn ? '🔊' : '🔇';
};

document.getElementById('hist').onclick      = () => document.getElementById('panel').classList.add('open');
document.getElementById('closeHist').onclick = () => document.getElementById('panel').classList.remove('open');
document.getElementById('clearHist').onclick = () => { history = []; drawHistory(); };

drawHistory();
render();
