/**
 * main.js Ophtao global UI interactions
 * Handles: mobile menu toggle, dropdown accordion on mobile.
 * Included on every page via <script src="assets/js/main.js"></script>.
 */

(function () {

  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mainNav      = document.getElementById('main-nav');

  if (!hamburgerBtn || !mainNav) return;

  /*   Mobile menu toggle   */
  hamburgerBtn.addEventListener('click', function () {
    const isOpen = mainNav.classList.toggle('open');
    hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    /* Animate hamburger → × */
    const spans = hamburgerBtn.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity   = '';
      spans[2].style.transform = '';
    }
  });

  /*   Dropdown accordion */
  const dropdownToggle = mainNav.querySelector('.nav-dropdown > a.nav-more');
  if (dropdownToggle) {
    dropdownToggle.addEventListener('click', function (e) {
      if (window.innerWidth <= 680) {
        e.preventDefault();
        dropdownToggle.closest('.nav-dropdown').classList.toggle('mobile-open');
      }
    });
  }

  /*   Close nav when any link is tapped (mobile)   */
  mainNav.querySelectorAll('a:not(.nav-more)').forEach(function (link) {
    link.addEventListener('click', function () {
      mainNav.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      const spans = hamburgerBtn.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity   = '';
      spans[2].style.transform = '';
    });
  });

})();