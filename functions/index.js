const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // define no ambiente Firebase

exports.onNewBookingSendEmail = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const bookingId = context.params.bookingId;
    const adminEmail = process.env.ADMIN_EMAIL || 'abelf5477@gmail.com';

    const optionText = (data.option === 'desconto' && data.precoDesconto) ? `${formatMoney(data.precoDesconto)} (desconto)` : `${formatMoney(data.preco)}`;

    const msg = {
      to: adminEmail,
      from: process.env.SENDER_EMAIL || 'noreply@metengprest.com',
      subject: `Novo Agendamento Meteng Prest — ${data.serviceTitle}`,
      html: `
        <h3>Novo agendamento (#${bookingId})</h3>
        <p><strong>Serviço:</strong> ${data.serviceTitle}</p>
        <p><strong>Cliente:</strong> ${escapeHtml(data.name)} — ${escapeHtml(data.phone || '-')}</p>
        <p><strong>Opção escolhida:</strong> ${escapeHtml(data.option)}</p>
        <p><strong>Preço aplicado:</strong> ${optionText}</p>
        <p><strong>Data / Hora:</strong> ${escapeHtml(data.date)} ${escapeHtml(data.time)}</p>
        <p><strong>Endereço:</strong> ${escapeHtml(data.address || '-')}</p>
        ${data.coords ? `<p><a href="https://www.google.com/maps/search/?api=1&query=${data.coords.lat},${data.coords.lng}">Ver no mapa</a></p>` : ''}
        <p><strong>Observações:</strong> ${escapeHtml(data.notes || '-')}</p>
        <hr/>
        <p>Gerado automaticamente pelo site Meteng Prest.</p>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('Email enviado para', adminEmail);
    } catch (err) {
      console.error('Erro ao enviar email:', err);
    }
  });

function escapeHtml(text){
  if (!text) return '';
  return String(text).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

function formatMoney(v){
  if (v==null) return '-';
  return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'AOA'}).format(Number(v));
}
