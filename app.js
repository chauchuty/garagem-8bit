/* ============================================================
   GARAGEM 8-BIT — dashboard interactions
   ============================================================ */

const orders = [
  {
    id: 1048,
    client: 'João Silva',
    vehicle: 'Fiat Uno 2014',
    plate: 'ABC-1D23',
    type: 'car',
    service: 'Troca de embreagem',
    status: 'progress',
    value: 850
  },
  {
    id: 1047,
    client: 'Transportes Silva',
    vehicle: 'Volvo FH 2020',
    plate: 'MTR-4B78',
    type: 'truck',
    service: 'Freios + revisão geral',
    status: 'waiting',
    value: 2400
  },
  {
    id: 1046,
    client: 'Maria Souza',
    vehicle: 'Honda Civic 2019',
    plate: 'QWE-9C11',
    type: 'car',
    service: 'Alinhamento e balanceamento',
    status: 'progress',
    value: 320
  },
  {
    id: 1045,
    client: 'Carlos Pereira',
    vehicle: 'Ford Cargo 2016',
    plate: 'JKL-2A90',
    type: 'truck',
    service: 'Troca de óleo e filtros',
    status: 'done',
    value: 680
  },
  {
    id: 1044,
    client: 'Ana Lima',
    vehicle: 'VW Gol 2017',
    plate: 'PLM-7E45',
    type: 'car',
    service: 'Ar-condicionado',
    status: 'waiting',
    value: 450
  },
  {
    id: 1043,
    client: 'Rota Norte Logística',
    vehicle: 'Scania R450 2021',
    plate: 'XPT-8F32',
    type: 'truck',
    service: 'Diagnóstico eletrônico',
    status: 'progress',
    value: 1250
  },
  {
    id: 1042,
    client: 'Pedro Alves',
    vehicle: 'Chevrolet Onix 2020',
    plate: 'RTY-3G77',
    type: 'car',
    service: 'Revisão de 40 mil km',
    status: 'done',
    value: 890
  },
  {
    id: 1041,
    client: 'Frota Vale Verde',
    vehicle: 'Mercedes Actros 2018',
    plate: 'KMN-6H54',
    type: 'truck',
    service: 'Suspensão dianteira',
    status: 'waiting',
    value: 3100
  },
  {
    id: 1040,
    client: 'Luciana Prado',
    vehicle: 'Toyota Corolla 2022',
    plate: 'BVC-5J66',
    type: 'car',
    service: 'Pastilhas de freio',
    status: 'done',
    value: 560
  },
  {
    id: 1039,
    client: 'Oficina Central',
    vehicle: 'Fiat Ducato 2015',
    plate: 'HGF-1K88',
    type: 'car',
    service: 'Troca de correia dentada',
    status: 'done',
    value: 780
  }
];

const STATUS = {
  progress: { label: 'EM ANDAMENTO', className: 'status--progress' },
  waiting: { label: 'AGUARDANDO', className: 'status--waiting' },
  done: { label: 'FINALIZADA', className: 'status--done' }
};

const state = {
  filter: 'all',
  search: '',
  completedMonth: 34,
  lastFocused: null
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const ordersBody = $('#ordersBody');
const emptyState = $('#emptyState');
const searchInput = $('#searchInput');
const tabs = $$('.tab');
const toastStack = $('#toastStack');
const osModal = $('#osModal');
const newOsForm = $('#newOsForm');

/* ============================================================
   Utilities
   ============================================================ */

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function pad(number) {
  return String(number).padStart(2, '0');
}

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function icon(id, className = 'icon') {
  return `<svg class="${className}" aria-hidden="true"><use href="#i-${id}"></use></svg>`;
}

function showToast(title, message = '', iconName = 'check') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icon(iconName)}</span>
    <p>${escapeHTML(title)}${message ? `<small>${escapeHTML(message)}</small>` : ''}</p>
  `;

  toastStack.appendChild(toast);

  while (toastStack.children.length > 4) {
    toastStack.firstElementChild.remove();
  }

  window.setTimeout(() => {
    toast.classList.add('is-leaving');
    window.setTimeout(() => toast.remove(), 200);
  }, 3600);
}

/* ============================================================
   Dates
   ============================================================ */

function setDates() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(now);
  const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(now);
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now);
  const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(now)
    .replace('.', '');

  $('#currentDate').textContent = `${weekday}, ${day} de ${month}`.toUpperCase();
  $('#agendaDay').textContent = day;
  $('#agendaMonth').textContent = shortMonth.toUpperCase();
}

/* ============================================================
   Orders
   ============================================================ */

function getFilteredOrders() {
  return orders.filter((order) => {
    const matchesFilter = state.filter === 'all' || order.status === state.filter;
    if (!matchesFilter) return false;
    if (!state.search) return true;

    const haystack = normalize(
      `${order.id} ${order.client} ${order.vehicle} ${order.plate} ${order.service}`
    );

    return haystack.includes(state.search);
  });
}

function renderOrders() {
  const filtered = getFilteredOrders();

  ordersBody.innerHTML = filtered
    .map((order) => {
      const status = STATUS[order.status];
      const vehicleIcon = order.type === 'truck' ? 'truck' : 'car';
      const action =
        order.status === 'done'
          ? `<span class="row-action is-done" title="Serviço concluído" aria-label="OS concluída">${icon('check')}</span>`
          : `<button class="row-action" type="button" data-complete="${order.id}" aria-label="Concluir OS ${order.id}" title="Marcar como concluída">${icon('check')}</button>`;

      return `
        <tr>
          <td class="cell-os"><span class="os-number"><span>#</span>${order.id}</span></td>
          <td class="cell-client">
            <div class="client-cell">
              <span class="vehicle-badge">${icon(vehicleIcon)}</span>
              <span class="client-copy">
                <strong title="${escapeHTML(order.client)}">${escapeHTML(order.client)}</strong>
                <small title="${escapeHTML(order.vehicle)} • ${escapeHTML(order.plate)}">${escapeHTML(order.vehicle)} • ${escapeHTML(order.plate)}</small>
              </span>
            </div>
          </td>
          <td class="cell-service"><span class="service-name" title="${escapeHTML(order.service)}">${escapeHTML(order.service)}</span></td>
          <td class="cell-status">
            <span class="status ${status.className}"><span class="status-dot"></span>${status.label}</span>
          </td>
          <td class="cell-value align-right"><span class="money">${formatMoney(order.value)}</span></td>
          <td class="cell-action">${action}</td>
        </tr>
      `;
    })
    .join('');

  emptyState.hidden = filtered.length > 0;
  $('#visibleCount').textContent = pad(filtered.length);
  $('#totalCount').textContent = pad(orders.length);

  updateCounts();
}

function updateCounts() {
  const counts = {
    all: orders.length,
    progress: orders.filter((order) => order.status === 'progress').length,
    waiting: orders.filter((order) => order.status === 'waiting').length,
    done: orders.filter((order) => order.status === 'done').length
  };

  const open = counts.progress + counts.waiting;

  Object.entries(counts).forEach(([key, value]) => {
    const element = $(`[data-count="${key}"]`);
    if (element) element.textContent = pad(value);
  });

  const openStat = $('[data-stat="open"]');
  const progressStat = $('[data-stat="progress"]');
  const doneStat = $('[data-stat="done"]');

  if (openStat) openStat.textContent = pad(open);
  if (progressStat) progressStat.textContent = pad(counts.progress);
  if (doneStat) doneStat.textContent = pad(state.completedMonth);

  const openBadge = $('#openBadge');
  if (openBadge) openBadge.textContent = `${pad(open)} ABERTAS`;

  const navOpenCount = $('#navOpenCount');
  if (navOpenCount) navOpenCount.textContent = pad(open);
}

function setFilter(filter) {
  state.filter = filter;
  tabs.forEach((tab) => {
    const active = tab.dataset.filter === filter;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  renderOrders();
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setFilter(tab.dataset.filter));
});

searchInput.addEventListener('input', (event) => {
  state.search = normalize(event.target.value);
  renderOrders();
});

ordersBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-complete]');
  if (!button) return;

  const order = orders.find((item) => item.id === Number(button.dataset.complete));
  if (!order || order.status === 'done') return;

  order.status = 'done';
  state.completedMonth += 1;
  renderOrders();
  showToast(`OS #${order.id} concluída`, `${order.client} • ${order.service}`);
});

/* Busca rápida com "/" */
document.addEventListener('keydown', (event) => {
  const target = event.target;
  const isTyping =
    target instanceof HTMLElement &&
    (target.matches('input, textarea, select') || target.isContentEditable);

  if (event.key === '/' && !isTyping) {
    event.preventDefault();
    if (window.matchMedia('(max-width: 900px)').matches) {
      openSidebar(false);
    }
    searchInput.focus();
  }

  if (event.key === 'Escape' && document.activeElement === searchInput) {
    searchInput.value = '';
    state.search = '';
    renderOrders();
    searchInput.blur();
  }
});

/* ============================================================
   Revenue chart
   ============================================================ */

const revenue = [
  { day: 'SEG', value: 1450 },
  { day: 'TER', value: 2100 },
  { day: 'QUA', value: 1800 },
  { day: 'QUI', value: 2600 },
  { day: 'SEX', value: 3200 },
  { day: 'SÁB', value: 1950 }
];

function renderChart() {
  const container = $('#revenueBars');
  if (!container) return;

  const max = 4000;
  const today = new Date().getDay() - 1;

  container.innerHTML = revenue
    .map((item, index) => {
      const height = Math.max(4, Math.round((item.value / max) * 100));
      const isToday = index === today;
      return `
        <div class="bar-col${isToday ? ' is-today' : ''}">
          <div class="bar" style="height:${height}%" data-value="${formatMoney(item.value)}"></div>
          <span class="bar-day">${item.day}</span>
        </div>
      `;
    })
    .join('');
}

/* ============================================================
   Modal — Nova OS
   ============================================================ */

function openModal() {
  state.lastFocused = document.activeElement;
  osModal.hidden = false;
  document.body.classList.add('modal-open');
  window.setTimeout(() => {
    const firstField = $('input[name="client"]', newOsForm);
    if (firstField) firstField.focus();
  }, 40);
}

function closeModal() {
  osModal.hidden = true;
  document.body.classList.remove('modal-open');
  if (state.lastFocused instanceof HTMLElement) state.lastFocused.focus();
}

$('#newOsBtn').addEventListener('click', openModal);
$('#closeModalBtn').addEventListener('click', closeModal);
$('#cancelModalBtn').addEventListener('click', closeModal);

osModal.addEventListener('click', (event) => {
  if (event.target === osModal) closeModal();
});

const plateInput = $('input[name="plate"]', newOsForm);
plateInput.addEventListener('input', () => {
  plateInput.value = plateInput.value.toUpperCase().replace(/\s+/g, '');
});

newOsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(newOsForm);
  const id = Math.max(...orders.map((order) => order.id)) + 1;

  const newOrder = {
    id,
    client: String(formData.get('client')).trim(),
    vehicle: String(formData.get('vehicle')).trim(),
    plate: String(formData.get('plate')).trim().toUpperCase(),
    type: String(formData.get('type')),
    service: String(formData.get('service')).trim(),
    status: String(formData.get('status')),
    value: Number(formData.get('value'))
  };

  if (!newOrder.client || !newOrder.vehicle || !newOrder.service) return;

  orders.unshift(newOrder);

  newOsForm.reset();
  state.filter = 'all';
  state.search = '';
  searchInput.value = '';
  setFilter('all');
  closeModal();

  showToast(`OS #${newOrder.id} aberta`, `${newOrder.client} • ${newOrder.service}`, 'plus');
});

/* ============================================================
   Notifications
   ============================================================ */

const bellBtn = $('#bellBtn');
const notifPanel = $('#notifPanel');
const notifBadge = $('#notifBadge');

function setNotifications(open) {
  notifPanel.hidden = !open;
  bellBtn.setAttribute('aria-expanded', String(open));
}

bellBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  setNotifications(notifPanel.hidden);
});

$('#clearNotifBtn').addEventListener('click', (event) => {
  event.stopPropagation();
  $$('.notif-item.is-unread').forEach((item) => item.classList.remove('is-unread'));
  notifBadge.classList.add('is-hidden');
  showToast('Notificações lidas', 'Você está em dia com a oficina.', 'bell');
});

notifPanel.addEventListener('click', (event) => event.stopPropagation());

document.addEventListener('click', () => {
  if (!notifPanel.hidden) setNotifications(false);
});

/* ============================================================
   Sidebar (mobile)
   ============================================================ */

const menuBtn = $('#menuBtn');
const sidebar = $('#sidebar');
const sidebarOverlay = $('#sidebarOverlay');

function openSidebar(open) {
  document.body.classList.toggle('sidebar-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

menuBtn.addEventListener('click', () => {
  openSidebar(!document.body.classList.contains('sidebar-open'));
});

sidebarOverlay.addEventListener('click', () => openSidebar(false));

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) openSidebar(false);
});

/* ============================================================
   Placeholder actions
   ============================================================ */

$$('[data-soon]').forEach((element) => {
  element.addEventListener('click', () => {
    showToast('Módulo em breve', `${element.dataset.soon} estará disponível na próxima versão.`, 'clock');
    if (window.innerWidth <= 900) openSidebar(false);
  });
});

$$('[data-restock]').forEach((button) => {
  button.addEventListener('click', () => {
    showToast('Reposição solicitada', `${button.dataset.restock} entrou na lista de compras.`, 'box');
  });
});

/* ============================================================
   Global keyboard / init
   ============================================================ */

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  if (!osModal.hidden) {
    closeModal();
    return;
  }

  if (!notifPanel.hidden) {
    setNotifications(false);
    bellBtn.focus();
    return;
  }

  if (document.body.classList.contains('sidebar-open')) {
    openSidebar(false);
    menuBtn.focus();
  }
});

setDates();
renderOrders();
renderChart();
