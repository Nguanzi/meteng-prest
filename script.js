// Dados iniciais dos serviços (editar/expandir)
const services = [
  { id: 'canalizacao', title: 'Canalização', desc: 'Reparos e instalação de canos e saneamento.', img: 'https://images.unsplash.com/photo-1581091870621-3c3f10f3f7d1?w=800&q=60' },
  { id: 'montagem', title: 'Montagem de Móveis', desc: 'Montagem profissional de móveis e armários.', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=60' },
  { id: 'instalacao-tv', title: 'Instalação de TV', desc: 'Fixação, alinhamento e conexão de TV', img: 'https://images.unsplash.com/photo-1580894908361-2f8e4e6dbe3b?w=800&q=60' },
  { id: 'informatica', title: 'Serviços de Informática', desc: 'Instalação de software, manutenção e suporte.', img: 'https://images.unsplash.com/photo-1526378727208-5a9f0b8f3d2a?w=800&q=60' },
  { id: 'seguranca', title: 'Segurança Eletrônica', desc: 'Câmeras, alarmes e sistemas de monitoramento.', img: 'https://images.unsplash.com/photo-1581093458409-4087a6f3d6a3?w=800&q=60' },
  { id: 'fibra', title: 'Fibra Óptica', desc: 'Instalação e testes de ligação de fibra óptica.', img: 'https://images.unsplash.com/photo-1526378727208-5a9f0b8f3d2a?w=800&q=60' },
];

// preencher ano no rodapé
document.getElementById('year').textContent = new Date().getFullYear();

// gerar cards de serviços
const servicesList = document.getElementById('services-list');
const serviceSelect = document.getElementById('service-select');

services.forEach(s => {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="${s.img}" alt="${s.title}">
    <div class="card-body">
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>
    <div class="card-actions">
      <button class="btn" data-service="${s.id}">Agendar</button>
    </div>
  `;
  servicesList.appendChild(card);

  // option select
  const opt = document.createElement('option');
  opt.value = s.id;
  opt.textContent = s.title;
  serviceSelect.appendChild(opt);
});

// ao clicar em "Agendar" no card, rola para o formulário e escolhe o serviço
servicesList.addEventListener('click', e => {
  if (e.target.matches('button[data-service]')) {
    const id = e.target.getAttribute('data-service');
    serviceSelect.value = id;
    location.hash = '#agendar';
    document.getElementById('client-name').focus();
  }
});

// Formularios e storage
const bookingForm = document.getElementById('booking-form');
const bookingResult = document.getElementById('booking-result');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const locStatus = document.getElementById('loc-status');
let currentCoords = null;

// carregar histórico do localStorage
function loadHistory() {
  const raw = localStorage.getItem('meteng_bookings') || '[]';
  const arr = JSON.parse(raw);
  if (!arr.length) {
    historyList.innerHTML = 'Nenhum agendamento ainda.';
    return;
  }
  historyList.innerHTML = '';
  arr.forEach((b, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <strong>${b.serviceTitle}</strong> — ${b.date} ${b.time} <br>
      Cliente: ${b.name} • ${b.phone || '-'} <br>
      Endereço: ${b.address || '-'} ${b.coords ? `<a href="https://www.google.com/maps/search/?api=1&query=${b.coords.lat},${b.coords.lng}" target="_blank">ver no mapa</a>` : ''}
      <div style="margin-top:6px;color:#666;font-size:13px">Observações: ${b.notes || '-'}</div>
    `;
    historyList.appendChild(item);
  });
}

// salvar agendamento
bookingForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('client-name').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  const serviceId = document.getElementById('service-select').value;
  const serviceTitle = services.find(s => s.id === serviceId).title;
  const date = document.getElementById('service-date').value;
  const time = document.getElementById('service-time').value;
  const address = document.getElementById('client-address').value.trim();
  const notes = document.getElementById('notes').value.trim();
  const booking = {
    id: 'b_' + Date.now(),
    name, phone, serviceId, serviceTitle, date, time, address, notes,
    coords: currentCoords || null,
    acceptedContract: JSON.parse(localStorage.getItem('meteng_contract_accepted') || 'false'),
    createdAt: new Date().toISOString()
  };

  // salvar localmente
  const raw = localStorage.getItem('meteng_bookings') || '[]';
  const arr = JSON.parse(raw);
  arr.unshift(booking);
  localStorage.setItem('meteng_bookings', JSON.stringify(arr));

  bookingResult.textContent = 'Agendamento salvo localmente! O cliente será notificado quando confirmar (versão local).';
  bookingForm.reset();
  currentCoords = null;
  locStatus.textContent = '';
  loadHistory();
  // rolar até histórico
  location.hash = '#historico';
});

// carregar histórico ao iniciar
loadHistory();

// limpar histórico
clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Limpar histórico local? Isso não pode ser desfeito.')) {
    localStorage.removeItem('meteng_bookings');
    loadHistory();
  }
});

// geolocalização
document.getElementById('get-location').addEventListener('click', () => {
  if (!navigator.geolocation) {
    locStatus.textContent = 'Geolocalização não suportada neste navegador.';
    return;
  }
  locStatus.textContent = 'Obtendo localização...';
  navigator.geolocation.getCurrentPosition(pos => {
    currentCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    locStatus.innerHTML = `Local obtido: ${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)} — <a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}">abrir no mapa</a>`;
  }, err => {
    locStatus.textContent = 'Permissão negada ou erro ao obter localização.';
  }, { timeout: 10000 });
});

// Modal do contrato
const contractModal = document.getElementById('contract-modal');
document.getElementById('open-contract').addEventListener('click', () => {
  contractModal.style.display = 'flex';
});
document.getElementById('close-contract').addEventListener('click', () => {
  contractModal.style.display = 'none';
});
document.getElementById('accept-contract').addEventListener('click', () => {
  localStorage.setItem('meteng_contract_accepted', 'true');
  alert('Contrato aceito — obrigado!');
  contractModal.style.display = 'none';
});

// whatsapp link (editar numero facilmente)
const whatsappLink = document.getElementById('whatsapp-link');
const myPhone = ''; // <<< coloque aqui o seu número no formato internacional exemplo +244912345678
if (myPhone) {
  whatsappLink.href = `https://wa.me/${myPhone.replace(/\D/g,'')}`;
  whatsappLink.textContent = 'Contactar via WhatsApp';
} else {
  whatsappLink.href = '#';
  whatsappLink.textContent = 'Edite o número de WhatsApp no script.js';
}
