document.addEventListener('DOMContentLoaded', () => {
  // ==================== MOBILE MENU ====================
  const hamburger = document.getElementById('hamburger-menu');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeBtn = document.getElementById('close-btn');
  const overlay = document.getElementById('mobile-menu-overlay');

  if (hamburger && mobileMenu && closeBtn && overlay) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      overlay.classList.add('open');
    });

    closeBtn.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      overlay.classList.remove('open');
    });

    overlay.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  const statusForm = document.getElementById('status-form');
  const statusResult = document.getElementById('status-result');

  statusForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const registrationNumber = document.getElementById('no_pendaftaran').value;
    const dob = document.getElementById('tgl_lahir').value;

    if (!registrationNumber || !dob) {
      statusResult.innerHTML = '<div class="alert alert-danger">Mohon isi semua field.</div>';
      return;
    }

    try {
      const querySnapshot = await db.collectionGroup('participants')
        .where('nomor_pendaftaran', '==', registrationNumber)
        .where('dob', '==', dob)
        .get();

      if (querySnapshot.empty) {
        statusResult.innerHTML = '<div class="alert alert-danger" style="border-radius: 10px; padding: 20px;">Data tidak ditemukan.</div>';
      } else {
        querySnapshot.forEach(doc => {
          const participant = doc.data();
          statusResult.innerHTML = `
            <div class="alert alert-success" style="border-radius: 10px; padding: 20px;">
              <h4>Status Pendaftaran</h4>
              <p><strong>Nama:</strong> ${participant.nama}</p>
              <p><strong>Status:</strong> ${participant.status}</p>
            </div>
          `;
        });
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      statusResult.innerHTML = '<div class="alert alert-danger" style="border-radius: 10px; padding: 20px;">Gagal mengambil status.</div>';
    }
  });
});