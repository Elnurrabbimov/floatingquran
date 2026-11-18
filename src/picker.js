// Qidiruvli tanlagich (combobox): yozing — ro'yxat filtrlanadi, ↑↓ Enter bilan tanlang.
// items: [{ value, label, sub?, right?, short?, search }]
// multiple: true — bir nechta qiymat; hiddenInput.value = "55,45" (tanlangan tartibda)
// eslint-disable-next-line no-unused-vars
function createPicker({ root, hiddenInput, placeholder, onSelect, multiple = false, max = Infinity, onLimit }) {
  root.classList.add('picker');
  if (multiple) root.classList.add('picker-multi');
  root.innerHTML = `
    <button type="button" class="picker-current"><span class="picker-label"></span><span class="picker-caret">▾</span></button>
    ${multiple ? '<div class="picker-chips"></div>' : ''}
    <div class="picker-pop" hidden>
      <input type="text" class="picker-search" placeholder="${placeholder}" spellcheck="false" autocomplete="off" />
      <ul class="picker-list" role="listbox"></ul>
      ${multiple ? '<div class="picker-foot"><span class="picker-count"></span><button type="button" class="picker-done">Tayyor</button></div>' : ''}
    </div>`;
  const btn = root.querySelector('.picker-current');
  const labelEl = root.querySelector('.picker-label');
  const chips = root.querySelector('.picker-chips');
  const pop = root.querySelector('.picker-pop');
  const search = root.querySelector('.picker-search');
  const list = root.querySelector('.picker-list');
  const countEl = root.querySelector('.picker-count');

  let items = [];
  let shown = [];
  let active = 0;
  let selected = []; // tanlangan qiymatlar (string), tartib bilan

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byValue = (v) => items.find((x) => String(x.value) === String(v));

  function filter(q) {
    const nq = normalize(q);
    if (!nq) return items;
    const num = /^\d+$/.test(q.trim()) ? q.trim() : null;
    const scored = [];
    for (const it of items) {
      let score = -1;
      if (num && String(it.value) === num) score = 0;
      else if (num && String(it.value).startsWith(num)) score = 1;
      else if (it.search.includes(nq)) score = 1.5;
      else if (it.search.some((s) => s.startsWith(nq))) score = 2;
      else if (it.search.some((s) => s.includes(nq))) score = 3;
      if (score >= 0) scored.push([score, it]);
    }
    return scored.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  }

  function renderList() {
    shown = filter(search.value);
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length
      ? shown.map((it, i) => {
          const isSel = selected.includes(String(it.value));
          const order = multiple && isSel && selected.length > 1 ? `<span class="picker-order">${selected.indexOf(String(it.value)) + 1}</span>` : '';
          return `
          <li role="option" data-i="${i}" class="${i === active ? 'active' : ''} ${isSel ? 'selected' : ''}">
            ${multiple ? `<span class="picker-check">${isSel ? '✓' : ''}</span>` : ''}
            <span class="picker-main">${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span>
            ${order}
            ${it.right ? `<span class="picker-right">${esc(it.right)}</span>` : ''}
          </li>`;
        }).join('')
      : '<li class="picker-empty">Hech narsa topilmadi</li>';
    if (countEl) countEl.textContent = `Tanlangan: ${selected.length}${Number.isFinite(max) ? ` / ${max}` : ''}`;
    list.querySelector('li.active')?.scrollIntoView({ block: 'nearest' });
  }

  function renderCurrent() {
    const sel = selected.map(byValue).filter(Boolean);
    hiddenInput.value = selected.join(',');
    if (!multiple) {
      const it = sel[0];
      labelEl.textContent = it ? (it.right ? `${it.label}  ·  ${it.right}` : it.label) : '';
      return;
    }
    labelEl.textContent = sel.length === 0 ? 'Tanlanmagan' : sel.length === 1 ? sel[0].label : `${sel.length} ta tarjima tanlangan`;
    chips.innerHTML = sel.length > 1
      ? sel.map((it) => `<span class="chip">${esc(it.short || it.label)}<button type="button" data-v="${esc(it.value)}" title="Olib tashlash">×</button></span>`).join('')
      : '';
  }

  function open() {
    pop.hidden = false;
    root.classList.add('open');
    search.value = '';
    active = Math.max(0, items.findIndex((it) => selected.includes(String(it.value))));
    renderList();
    search.focus();
  }

  function close() {
    pop.hidden = true;
    root.classList.remove('open');
  }

  function choose(it) {
    if (!it) return;
    const v = String(it.value);
    if (!multiple) {
      selected = [v];
      renderCurrent();
      close();
      onSelect?.(it);
      return;
    }
    if (selected.includes(v)) {
      if (selected.length === 1) return; // kamida bitta qolsin
      selected = selected.filter((x) => x !== v);
    } else {
      if (selected.length >= max) { onLimit?.(max); return; }
      selected = [...selected, v];
    }
    renderCurrent();
    renderList();
    onSelect?.(selected.map(byValue));
  }

  // value: bitta qiymat yoki "55,45" / [55, 45]. Yaroqli qiymat bo'lmasa false.
  function setValue(value) {
    const vals = (Array.isArray(value) ? value : String(value ?? '').split(','))
      .map((v) => String(v).trim())
      .filter((v) => v && byValue(v));
    const next = multiple ? [...new Set(vals)].slice(0, max) : vals.slice(0, 1);
    if (!next.length) return false;
    selected = next;
    renderCurrent();
    return true;
  }

  btn.addEventListener('click', () => (pop.hidden ? open() : close()));
  search.addEventListener('input', () => { active = 0; renderList(); });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { active = Math.min(active + 1, shown.length - 1); renderList(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(active - 1, 0); renderList(); e.preventDefault(); }
    else if (e.key === 'Enter') { choose(shown[active]); e.preventDefault(); }
    else if (e.key === 'Escape') { close(); btn.focus(); }
  });
  list.addEventListener('mousedown', (e) => {
    const li = e.target.closest('li[data-i]');
    if (li) { e.preventDefault(); choose(shown[+li.dataset.i]); }
  });
  root.querySelector('.picker-done')?.addEventListener('click', close);
  chips?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (b) choose(byValue(b.dataset.v));
  });
  // composedPath — bosilgan element qayta chizilib DOM'dan chiqib ketsa ham to'g'ri aniqlaydi
  document.addEventListener('mousedown', (e) => { if (!e.composedPath().includes(root)) close(); });

  return {
    setItems(next) {
      items = next;
      if (!setValue(hiddenInput.value) && items[0]) setValue(items[0].value);
    },
    setValue,
    items: () => items,
    selected: () => [...selected],
  };
}

// Qidiruv uchun normallashtirish: kichik harf, harakat/diakritikalarsiz, faqat harf va raqam
function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٰٟۖ-ۭ]/g, '') // lotin diakritikalari va arabcha harakatlar
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/[^\p{L}\p{N}]/gu, ''); // istalgan yozuvdagi harf va raqamlar (lotin, kirill, arab ...)
}
