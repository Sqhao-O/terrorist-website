(() => {
  function initBooking() {
    const dialog = document.getElementById('booking-dialog');
    if (!dialog) return;

    dialog.innerHTML = `
      <div class="booking-sheet">
        <div class="booking-mast">
          <span lang="en">WUYIN RETREAT</span>
          <button class="booking-close" type="button" aria-label="关闭预约窗口"></button>
        </div>
        <h2 id="booking-heading" tabindex="-1">预约山居</h2>
        <form class="booking-form">
          <p class="booking-intro">选一个进山的日子，领取你的虚构入住凭证。</p>
          <div class="booking-fields">
            <label>
              <span>入住日期</span>
              <input name="arrival" type="date" required>
            </label>
            <label>
              <span>入住人数</span>
              <span class="booking-select-wrap">
                <select name="guests">
                  <option value="1">1 位</option>
                  <option value="2" selected>2 位</option>
                  <option value="3">3 位</option>
                  <option value="4">4 位</option>
                </select>
              </span>
            </label>
          </div>
          <button type="submit" class="booking-action">生成入住凭证</button>
        </form>
        <div class="booking-receipt" hidden>
          <div class="booking-key">
            <span>房号</span>
            <strong>404</strong>
          </div>
          <dl class="booking-details">
            <div><dt>入住日期</dt><dd class="booking-confirmed-date"></dd></div>
            <div><dt>入住人数</dt><dd class="booking-confirmed-guests"></dd></div>
          </dl>
          <p class="booking-message">请收好房号。夜班前台已经等你很久了。</p>
          <a href="#journal" class="booking-action">查看入住手记</a>
        </div>
      </div>`;

    const heading = dialog.querySelector('#booking-heading');
    const form = dialog.querySelector('.booking-form');
    const receipt = dialog.querySelector('.booking-receipt');
    const arrival = form.elements.namedItem('arrival');
    const guests = form.elements.namedItem('guests');
    const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    function localDateValue() {
      const date = new Date();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-booking]');
      if (!trigger || dialog.open) return;

      event.preventDefault();
      form.reset();
      arrival.min = localDateValue();
      arrival.value = arrival.min;
      heading.textContent = trigger.dataset.booking === 'room' ? '预约客房' : '预约山居';
      form.hidden = false;
      receipt.hidden = true;
      dialog.showModal();
      heading.focus({ preventScroll: true });
    });

    dialog.querySelector('.booking-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      arrival.min = localDateValue();
      if (!form.reportValidity()) return;

      // date inputs expose midnight UTC. Format the chosen calendar day locally.
      const date = new Date(`${arrival.value}T12:00:00`);
      dialog.querySelector('.booking-confirmed-date').textContent = dateFormatter.format(date);
      dialog.querySelector('.booking-confirmed-guests').textContent = `${guests.value} 位`;
      form.hidden = true;
      receipt.hidden = false;
      heading.textContent = '入住凭证';
      heading.focus({ preventScroll: true });
    });

    receipt.querySelector('a').addEventListener('click', () => dialog.close());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBooking, { once: true });
  } else {
    initBooking();
  }
})();
