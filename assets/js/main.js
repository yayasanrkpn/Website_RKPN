document.addEventListener('DOMContentLoaded', () => {
  function initApp() {
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

    async function loadEvents() {
      const container = document.getElementById('event-list');
      const bannerSlider = document.getElementById('banner-slider');

      // Jika tidak ada container atau banner, hentikan
      if (!container && !bannerSlider) return;

      try {
        // Ambil data event dari Firestore (pastikan db sudah dideklarasikan di file lain)
        const eventsSnapshot = await db.collection('events').get();
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (!events.length) {
          if (container)
            container.innerHTML =
              '<div style="text-align:center;color:gray;padding:40px;">Belum ada event tersedia.</div>';
          return;
        }

        // Urutkan berdasarkan ID event
        events.sort((a, b) => parseInt(a.id_event) - parseInt(b.id_event));

        // ==================== BANNER SLIDER ====================
        if (bannerSlider) {
          const bannerDots = document.getElementById('banner-dots');
          const bannerName = document.getElementById('current-event-name');
          const bannerStatus = document.getElementById('current-event-status');
          const btnLihat = document.getElementById('banner-btn-lihat');
          const btnDaftar = document.getElementById('banner-btn-daftar');
          const btnHubungi = document.getElementById('banner-btn-hubungi');

          // Helper function to get a direct image URL, especially for Google Drive
          function getDirectImageUrl(url) {
            let finalImageUrl = 'assets/img/gys.png'; // Default fallback
            if (url && typeof url === 'string') {
              if (url.includes('drive.google.com')) {
                if (url.includes('/uc?export=view&id=')) {
                  finalImageUrl = url;
                } else if (url.includes('/file/d/')) {
                  try {
                    const fileId = url.split('/d/')[1].split('/')[0];
                    finalImageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                  } catch (e) {
                    console.error(`Gagal memproses link Google Drive: ${url}`, e);
                  }
                }
              } else if (url.startsWith('http')) {
                finalImageUrl = url;
              }
            }
            return finalImageUrl;
          }

          if (events.length > 0) {
            let currentBannerIndex = 0;

            bannerSlider.innerHTML = ''; // Clear only if there are events
            bannerDots.innerHTML = '';

            // Tambahkan semua gambar banner
            events.forEach((ev, index) => {
              const img = document.createElement('img');
              img.src = getDirectImageUrl(ev.homepage_banner_url || ev.banner_url); // Use the new field with fallback
              img.alt = ev.event_name;
              bannerSlider.appendChild(img);

              const dot = document.createElement('button');
              dot.classList.toggle('active', index === 0);
              dot.onclick = () => updateBanner(index);
              bannerDots.appendChild(dot);
            });

            function updateBanner(i) {
              currentBannerIndex = i;
              const ev = events[i];
              const active = ev.is_active;

              bannerSlider.style.transform = `translateX(-${i * 100}%)`;
              bannerDots
                .querySelectorAll('button')
                .forEach((dot, idx) => dot.classList.toggle('active', idx === i));

              const bannerCard = document.querySelector('.banner-card');
              if (bannerCard) {
                bannerCard.style.filter = active
                  ? 'none'
                  : 'grayscale(0.8) brightness(0.5)';
                bannerCard.style.background = active
                  ? 'rgba(255, 255, 255, .1)'
                  : 'rgba(0, 0, 0, .4)';
              }

              bannerName.textContent = ev.event_name;
              bannerStatus.textContent = ev.status || 'Pendaftaran';

              bannerName.style.color = active ? '#fff' : '#cbd5e1';
              bannerStatus.style.opacity = active ? '1' : '0.6';

              // Tombol lihat & hubungi
              [btnLihat, btnHubungi].forEach((btn) => {
                if (!active) {
                  btn.classList.add('disabled');
                  btn.style.pointerEvents = 'none';
                  btn.style.opacity = '0.5';
                } else {
                  btn.classList.remove('disabled');
                  btn.style.pointerEvents = 'auto';
                  btn.style.opacity = '1';
                }
              });

              // Tombol daftar
              const registrationDisabled =
                !ev.registration_button_enabled || !active;
              if (registrationDisabled) {
                btnDaftar.classList.add('disabled');
                btnDaftar.style.pointerEvents = 'none';
                btnDaftar.style.opacity = '0.5';
              } else {
                btnDaftar.classList.remove('disabled');
                btnDaftar.style.pointerEvents = 'auto';
                btnDaftar.style.opacity = '1';
              }

              // Update link tombol
              btnLihat.href = `event_detail.html?id=${ev.id}`;
              btnDaftar.href = `form.html?event_id=${ev.id}`;
            }

            // Set awal banner
            updateBanner(0);

            // Auto-slide tiap 7 detik
            setInterval(() => {
              currentBannerIndex = (currentBannerIndex + 1) % events.length;
              updateBanner(currentBannerIndex);
            }, 7000);
          }
        }

        // ==================== LIST EVENT ====================
        if (container) {
          container.innerHTML = '';
          events.forEach((ev) => {
            const active = ev.is_active;
            const disabled = !ev.registration_button_enabled || !active;
            const card = document.createElement('div');
            card.className = 'event-card';
            card.style.background = active ? 'white' : '#2d3748';
            card.style.color = active ? '#0f172a' : '#e2e8f0';
            card.style.opacity = active ? '1' : '0.6';
            card.style.transition = '0.3s ease';

            const logoSrc = getDirectImageUrl(ev.homepage_banner_url || ev.banner_url);

            card.innerHTML = `
              <div class="event-left">
                <div class="event-logo">
                  <img src="${logoSrc}" alt="${ev.event_name}" style="border-radius:12px;">
                </div>
                <div class="event-info">
                  <h3>${ev.event_name}</h3>
                  <div class="program" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; font-size: 14px;">
                    <span style="display: flex; align-items: center; gap: 6px;">
                      <i class="fa-solid fa-calendar-days" style="width: 14px;"></i>
                      <span>${ev.start_date || 'Segera'}</span>
                    </span>
                    <span style="display: flex; align-items: center; gap: 6px;">
                      <i class="fa-solid fa-location-dot" style="width: 14px;"></i>
                      <span>${ev.location || 'Online'}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div class="event-actions">
                <a href="event_detail.html?id=${ev.id}" class="btn btn-detail ${!active ? 'disabled' : ''}">Detail Event</a>
                <a href="form.html?event_id=${ev.id}" class="btn btn-primary ${disabled ? 'disabled' : ''}">Daftar</a>
                <a href="validasi_status.html" class="btn btn-status ${!active ? 'disabled' : ''}">Cek Status</a>
              </div>
            `;

            if (!active) {
              card.querySelectorAll('.btn').forEach((btn) => {
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.5';
              });
            }

            container.appendChild(card);
          });
        }
      } catch (e) {
        console.error('Error memuat event:', e);
        if (container)
          container.innerHTML =
            '<div style="color:red;text-align:center;padding:40px;">Gagal memuat event.</div>';
      }
    }

    // ==================== FAQ SECTION ====================
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        faqItems.forEach((other) => {
          if (other !== item) {
            other
              .querySelector('.faq-question')
              .classList.remove('active');
            other.querySelector('.faq-answer').classList.remove('open');
          }
        });
        const answer = item.querySelector('.faq-answer');
        question.classList.toggle('active');
        answer.classList.toggle('open');
      });
    });

    loadEvents();
  }

  initApp();
});
