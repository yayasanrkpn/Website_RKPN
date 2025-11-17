document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selectors ---
  const loginForm = document.getElementById('login-form');
  const adminContent = document.getElementById('admin-content');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const eventForm = document.getElementById('event-form');
  const eventList = document.getElementById('event-list');
  const rundownDaysContainer = document.getElementById('rundown-days-container');
  const addDayBtn = document.getElementById('add-day-btn');

  const auth = firebase.auth();
  const db = firebase.firestore();

  // --- TAB LOGIC ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  function switchTab(tabId) {
    tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
    tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === tabId));
  }
  tabButtons.forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));

  // --- AUTHENTICATION ---
  auth.onAuthStateChanged(user => {
    if (user) {
      loginForm.style.display = 'none';
      adminContent.style.display = 'block';
      loadEvents();
    } else {
      loginForm.style.display = 'block';
      adminContent.style.display = 'none';
    }
  });
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
      .catch(error => alert(`Gagal login: ${error.message}`));
  });
  logoutBtn.addEventListener('click', () => auth.signOut());

  // --- RUNDOWN BUILDER LOGIC ---
  const addActivity = (container, time = '', description = '') => {
    const activityEl = document.createElement('div');
    activityEl.className = 'rundown-activity';
    activityEl.innerHTML = `
      <input type="text" class="rundown-time" placeholder="Contoh: 09:00 - 10:00" value="${time}">
      <input type="text" class="rundown-description" placeholder="Deskripsi Aktivitas" value="${description}">
      <button type="button" class="action-btn delete-activity-btn">Hapus</button>
    `;
    container.appendChild(activityEl);
  };

  const addDay = (day = '', activities = []) => {
    const dayEl = document.createElement('div');
    dayEl.className = 'rundown-day';
    dayEl.innerHTML = `
      <div class="rundown-day-header">
        <input type="text" class="rundown-day-title" placeholder="Nama Hari (Contoh: Hari 1)" value="${day}">
        <button type="button" class="action-btn delete-day-btn">Hapus Hari</button>
      </div>
      <div class="rundown-activities-container"></div>
      <button type="button" class="action-btn add-activity-btn">Tambah Aktivitas</button>
    `;
    rundownDaysContainer.appendChild(dayEl);
    
    const activitiesContainer = dayEl.querySelector('.rundown-activities-container');
    if (activities && activities.length > 0) {
      activities.forEach(act => addActivity(activitiesContainer, act.time, act.description));
    } else {
      addActivity(activitiesContainer);
    }
  };

  addDayBtn.addEventListener('click', () => addDay());

  rundownDaysContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-activity-btn')) {
      const activitiesContainer = e.target.closest('.rundown-day').querySelector('.rundown-activities-container');
      addActivity(activitiesContainer);
    }
    if (e.target.classList.contains('delete-day-btn')) {
      e.target.closest('.rundown-day').remove();
    }
    if (e.target.classList.contains('delete-activity-btn')) {
      e.target.closest('.rundown-activity').remove();
    }
  });

  // --- EVENT MANAGEMENT (CRUD) ---
  async function loadEvents() {
    try {
      const eventsSnapshot = await db.collection('events').get();
      const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      eventList.innerHTML = '';
      const table = document.createElement('table');
      table.innerHTML = `
        <thead><tr><th>Nama Event</th><th>Status</th><th>Aktif</th><th>Aksi</th></tr></thead>
        <tbody>
          ${events.map(event => `
            <tr>
              <td>${event.event_name}</td>
              <td>${event.status}</td>
              <td>${event.is_active}</td>
              <td>
                <button class="action-btn view-participants-btn" data-id="${event.id}" data-name="${event.event_name}">Lihat Partisipan</button>
                <button class="action-btn edit-btn" data-id="${event.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${event.id}">Hapus</button>
              </td>
            </tr>
          `).join('')}
        </tbody>`;
      eventList.appendChild(table);

      // --- Add Event Listeners for Action Buttons ---
      eventList.querySelectorAll('.view-participants-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          loadParticipants(btn.dataset.id, btn.dataset.name);
        });
      });

      eventList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          switchTab('forms-tab');
          const event = events.find(e => e.id === btn.dataset.id);
          
          eventForm.reset();
          rundownDaysContainer.innerHTML = '';

          document.getElementById('event-id').value = event.id;
          document.getElementById('event-name').value = event.event_name;
          document.getElementById('event-description').value = event.description || '';
          document.getElementById('event-status').value = event.status || '';
          document.getElementById('event-batch').value = event.event_batch || ''; // Populate new batch field
          document.getElementById('event-programs').value = event.programs || '';
          document.getElementById('event-start-date').value = event.start_date || '';
          document.getElementById('event-end-date').value = event.end_date || '';
          document.getElementById('event-location').value = event.location || '';
          document.getElementById('event-homepage-banner-url').value = event.homepage_banner_url || event.banner_url || '';
          document.getElementById('event-detail-banner-url').value = event.detail_banner_url || event.banner_url || '';
          document.getElementById('event-admin-contact').value = event.admin_contact || '';
          document.getElementById('exclusive-payment-amount').value = event.exclusive_payment_amount || '';
          document.getElementById('event-active').checked = event.is_active || false;
          document.getElementById('event-registration-button').checked = event.registration_button_enabled || false;

          if (event.rundown && Array.isArray(event.rundown)) {
            event.rundown.forEach(dayData => {
              if(dayData) addDay(dayData.day, dayData.activities)
            });
          }

          window.scrollTo(0, eventForm.offsetTop);
        });
      });

      eventList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Yakin ingin menghapus event ini?')) {
            await db.collection('events').doc(btn.dataset.id).delete();
            loadEvents();
          }
        });
      });
    } catch (e) {
      console.error('Error loading events:', e);
    }
  }

  // --- PARTICIPANT MANAGEMENT ---
  async function loadParticipants(eventId, eventName) {
    const container = document.getElementById('participant-list-container');
    const title = document.getElementById('participant-list-title');
    const list = document.getElementById('participant-list');

    title.textContent = `Daftar Partisipan untuk: ${eventName}`;
    list.innerHTML = '<tr><td colspan="9">Memuat partisipan...</td></tr>';
    container.style.display = 'block';

    try {
      const snapshot = await db.collection('events').doc(eventId).collection('participants').get();
      if (snapshot.empty) {
        list.innerHTML = '<tr><td colspan="9">Belum ada partisipan untuk event ini.</td></tr>';
        return;
      }

      list.innerHTML = '';
      snapshot.forEach(doc => {
        const p = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${p.nama || ''}</td>
          <td>${p.nomor_pendaftaran || ''}</td>
          <td>${p.email || ''}</td>
          <td>${p.telepon || ''}</td>
          <td>${p.kota || ''}</td>
          <td>${p.jalur || ''}</td>
          <td>${p.status || ''}</td>
          <td>
            ${p.buktiUrl ? `<a href="${p.buktiUrl}" target="_blank"><img src="${p.buktiUrl}" alt="Bukti" style="max-width: 100px; height: auto;"></a>` : ''}
            ${p.buktiPembayaranUrl ? `<a href="${p.buktiPembayaranUrl}" target="_blank"><img src="${p.buktiPembayaranUrl}" alt="Bukti Bayar" style="max-width: 100px; height: auto;"></a>` : ''}
          </td>
          <td>
            <button class="action-btn view-detail-btn" data-id="${doc.id}" data-event-id="${eventId}">Detail</button>
            <button class="action-btn delete-participant-btn" data-id="${doc.id}" data-event-id="${eventId}">Hapus</button>
          </td>
        `;
        list.appendChild(row);
      });

      // Add event listeners for detail buttons
      list.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const participantId = btn.dataset.id;
          const eventId = btn.dataset.eventId;
          const participantDoc = await db.collection('events').doc(eventId).collection('participants').doc(participantId).get();
          if (participantDoc.exists) {
            const participantData = participantDoc.data();
            // Pass participant and event IDs to the details modal
            showParticipantDetails(participantData, participantId, eventId);
          } else {
            alert('Detail partisipan tidak ditemukan.');
          }
        });
      });

      // Add event listeners for delete buttons
      list.querySelectorAll('.delete-participant-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const participantId = btn.dataset.id;
          const eventId = btn.dataset.eventId;
          if (confirm('Yakin ingin menghapus partisipan ini?')) {
            try {
              await db.collection('events').doc(eventId).collection('participants').doc(participantId).delete();
              alert('Partisipan berhasil dihapus.');
              const eventName = document.getElementById('participant-list-title').textContent.replace('Daftar Partisipan untuk: ', '');
              loadParticipants(eventId, eventName); // Reload the list
            } catch (error) {
              console.error('Error deleting participant:', error);
              alert('Gagal menghapus partisipan: ' + error.message);
            }
          }
        });
      });

    } catch (error) {
      console.error(`Error loading participants for event ${eventId}:`, error);
      list.innerHTML = `<tr><td colspan="9">Gagal memuat partisipan. Error: ${error.message}</td></tr>`;
    }
  }

  // --- FUNCTION: Show Participant Details in Modal ---
  function showParticipantDetails(p, participantId, eventId) {
    const modal = document.getElementById('participant-detail-modal');
    const modalBody = modal.querySelector('#modal-body'); // Select the modal-body within the modal
    modalBody.innerHTML = `
      <p><strong>Nama Lengkap:</strong> ${p.nama || ''}</p>
      <p><strong>Nomor Pendaftaran:</strong> ${p.nomor_pendaftaran || ''}</p>
      <p><strong>Email:</strong> ${p.email || ''}</p>
      <p><strong>Nomor WhatsApp:</strong> ${p.telepon || ''}</p>
      <p><strong>Jenis Kelamin:</strong> ${p.gender || ''}</p>
      <p><strong>Tanggal Lahir:</strong> ${p.dob || ''}</p>
      <p><strong>Kota/Kabupaten:</strong> ${p.kota || ''}</p>
      <p><strong>Provinsi:</strong> ${p.provinsi || ''}</p>
      <p><strong>Pekerjaan:</strong> ${p.pekerjaan || ''}</p>
      <p><strong>Asal Instansi:</strong> ${p.instansi || ''}</p>
      <p><strong>Event Dipilih:</strong> ${p['event-selection'] || ''}</p>
      <p><strong>Info Didapat Dari:</strong> ${p.info || ''}</p>
      <p><strong>Username Instagram:</strong> ${p.instagram || ''}</p>
      <p><strong>Username TikTok:</strong> ${p.tiktok || ''}</p>
      ${p.twibbon ? `<p><strong>Link Twibbon:</strong> <a href="${p.twibbon}" target="_blank">${p.twibbon}</a></p>` : ''}
      <p><strong>Motivasi:</strong> ${p.motivasi || ''}</p>
      <p><strong>Jalur Pendaftaran:</strong> ${p.jalur || ''}</p>
      <p><strong>Status Pendaftaran:</strong> ${p.status || ''}</p>
      ${p.buktiUrl ? `<p><strong>Bukti Follow & Share:</strong> <a href="${p.buktiUrl}" target="_blank">Lihat Gambar</a></p><img src="${p.buktiUrl}" alt="Bukti Follow & Share" style="max-width: 100%; height: auto; margin-top: 10px;">` : ''}
      ${p.buktiPembayaranUrl ? `<p><strong>Bukti Pembayaran:</strong> <a href="${p.buktiPembayaranUrl}" target="_blank">Lihat Gambar</a></p><img src="${p.buktiPembayaranUrl}" alt="Bukti Pembayaran" style="max-width: 100%; height: auto; margin-top: 10px;">` : ''}
      <button class="action-btn edit-participant-btn" data-id="${participantId}" data-event-id="${eventId}">Edit Partisipan</button>
    `;
    modal.style.display = 'block';

    // Close modal when 'x' is clicked
    modal.querySelector('.close-btn').onclick = () => {
      modal.style.display = 'none';
    };

    // Close modal when clicking outside
    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    };
  }

  // --- Participant Form Management ---
  const participantForm = document.getElementById('participant-form');
  const participantIdInput = document.getElementById('participant-id');
  const participantEventIdInput = document.getElementById('participant-event-id');
  const participantNameInput = document.getElementById('participant-name');
  const participantEmailInput = document.getElementById('participant-email');
  const participantTeleponInput = document.getElementById('participant-telepon');
  const participantEventInput = document.getElementById('participant-event');
  const participantGenderInput = document.getElementById('participant-gender');
  const participantDobInput = document.getElementById('participant-dob');
  const participantKotaInput = document.getElementById('participant-kota');
  const participantProvinsiInput = document.getElementById('participant-provinsi');
  const participantPekerjaanInput = document.getElementById('participant-pekerjaan');
  const participantInstansiInput = document.getElementById('participant-instansi');
  const participantInfoInput = document.getElementById('participant-info');
  const participantInstagramInput = document.getElementById('participant-instagram');
  const participantTiktokInput = document.getElementById('participant-tiktok');
  const participantTwibbonInput = document.getElementById('participant-twibbon');
  const participantMotivasiInput = document.getElementById('participant-motivasi');
  const participantJalurInput = document.getElementById('participant-jalur');
  const participantStatusInput = document.getElementById('participant-status');

  // Function to populate participant form for editing
  async function editParticipant(participantId, eventId) {
    switchTab('forms-tab'); // Switch to forms tab where participant form is
    const participantDoc = await db.collection('events').doc(eventId).collection('participants').doc(participantId).get();
    if (participantDoc.exists) {
      const p = participantDoc.data();
      participantIdInput.value = participantId;
      participantEventIdInput.value = eventId; // Store eventId in hidden input
      participantNameInput.value = p.nama || '';
      participantEmailInput.value = p.email || '';
      participantTeleponInput.value = p.telepon || '';
      participantEventInput.value = p['event-selection'] || '';
      participantGenderInput.value = p.gender || '';
      participantDobInput.value = p.dob || '';
      participantKotaInput.value = p.kota || '';
      participantProvinsiInput.value = p.provinsi || '';
      participantPekerjaanInput.value = p.pekerjaan || '';
      participantInstansiInput.value = p.instansi || '';
      participantInfoInput.value = p.info || '';
      participantInstagramInput.value = p.instagram || '';
      participantTiktokInput.value = p.tiktok || '';
      participantTwibbonInput.value = p.twibbon || '';
      participantMotivasiInput.value = p.motivasi || '';
      participantJalurInput.value = p.jalur || '';
      participantStatusInput.value = p.status || '';
      window.scrollTo(0, participantForm.offsetTop);
    } else {
      alert('Partisipan tidak ditemukan untuk diedit.');
    }
  }

  // Event listener for the "Edit Partisipan" button inside the modal
  document.getElementById('modal-body').addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-participant-btn')) {
      const participantId = e.target.dataset.id;
      const eventId = e.target.dataset.eventId;
      document.getElementById('participant-detail-modal').style.display = 'none'; // Close modal
      editParticipant(participantId, eventId);
    }
  });

  // Event listener for participant form submission
  participantForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const participantId = participantIdInput.value;
    const eventId = participantEventIdInput.value; // Get eventId from hidden input

    if (!participantId || !eventId) {
      alert('Tidak dapat menyimpan partisipan: ID partisipan atau ID event tidak ditemukan.');
      return;
    }

    const updatedParticipantData = {
      nama: participantNameInput.value,
      email: participantEmailInput.value,
      telepon: participantTeleponInput.value,
      'event-selection': participantEventInput.value,
      gender: participantGenderInput.value,
      dob: participantDobInput.value,
      kota: participantKotaInput.value,
      provinsi: participantProvinsiInput.value,
      pekerjaan: participantPekerjaanInput.value,
      instansi: participantInstansiInput.value,
      info: participantInfoInput.value,
      instagram: participantInstagramInput.value,
      tiktok: participantTiktokInput.value,
      twibbon: participantTwibbonInput.value,
      motivasi: participantMotivasiInput.value,
      jalur: participantJalurInput.value,
      status: participantStatusInput.value,
    };

    try {
      await db.collection('events').doc(eventId).collection('participants').doc(participantId).update(updatedParticipantData);
      alert('Data partisipan berhasil diperbarui!');
      // Reload participants for the current event
      const eventName = document.getElementById('participant-list-title').textContent.replace('Daftar Partisipan untuk: ', '');
      loadParticipants(eventId, eventName);
      switchTab('lists-tab'); // Go back to participant list
    } catch (error) {
      console.error('Error updating participant:', error);
      alert('Gagal memperbarui data partisipan: ' + error.message);
    }
  });

  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('event-id').value;

    const rundownData = [];
    document.querySelectorAll('.rundown-day').forEach(dayEl => {
      const dayTitle = dayEl.querySelector('.rundown-day-title').value;
      const activities = [];
      dayEl.querySelectorAll('.rundown-activity').forEach(activityEl => {
        const time = activityEl.querySelector('.rundown-time').value;
        const description = activityEl.querySelector('.rundown-description').value;
        if (time || description) {
          activities.push({ time, description });
        }
      });
      if (dayTitle || activities.length > 0) {
        rundownData.push({ day: dayTitle, activities });
      }
    });

    const exclusivePaymentAmountInput = document.getElementById('exclusive-payment-amount');
    console.log('Raw exclusivePaymentAmountInput.value:', exclusivePaymentAmountInput.value);
    const parsedExclusivePaymentAmount = parseInt(exclusivePaymentAmountInput.value, 10);
    console.log('Parsed exclusivePaymentAmount:', parsedExclusivePaymentAmount);

    const eventData = {
      event_name: document.getElementById('event-name').value,
      description: document.getElementById('event-description').value,
      status: document.getElementById('event-status').value,
      event_batch: document.getElementById('event-batch').value, // Save new batch field
      programs: document.getElementById('event-programs').value,
      start_date: document.getElementById('event-start-date').value,
      end_date: document.getElementById('event-end-date').value,
      location: document.getElementById('event-location').value,
      homepage_banner_url: document.getElementById('event-homepage-banner-url').value,
      detail_banner_url: document.getElementById('event-detail-banner-url').value,
      admin_contact: document.getElementById('event-admin-contact').value,
      exclusive_payment_amount: parsedExclusivePaymentAmount || 0,
      is_active: document.getElementById('event-active').checked,
      registration_button_enabled: document.getElementById('event-registration-button').checked,
      rundown: rundownData,
    };
    console.log('eventData.exclusive_payment_amount before Firestore update:', eventData.exclusive_payment_amount);

    // Hapus field banner_url yang lama jika ada
    delete eventData.banner_url;

    try {
      if (id) {
        await db.collection('events').doc(id).update(eventData);
      } else {
        await db.collection('events').add(eventData);
      }
      eventForm.reset();
      rundownDaysContainer.innerHTML = '';
      loadEvents();
      switchTab('lists-tab');
    } catch (e) {
      console.error('Error saving event:', e);
      alert('Gagal menyimpan event.');
    }
  });
});

// --- Hamburger Menu Logic ---
const hamburger = document.getElementById('hamburger-menu');
const mobileMenu = document.getElementById('mobile-menu');
const overlay = document.getElementById('mobile-menu-overlay');
const closeBtn = document.getElementById('close-btn');

function toggleMenu() {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    overlay.classList.toggle('open');
}

if (hamburger && mobileMenu && overlay && closeBtn) {
    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', toggleMenu);
}