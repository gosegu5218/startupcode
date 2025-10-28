const hamburger = document.querySelector('.hamburger');
const overlay = document.querySelector('.sidebar-overlay');
const closeBtn = document.querySelector('.sidebar-close');

// 쿠키에서 값 추출하는 함수
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

if (hamburger && overlay) {
  const closeSidebar = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger.focus();
  };

  const openSidebar = () => {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.removeAttribute('inert');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // focus first link for accessibility
    const firstLink = overlay.querySelector('.sidebar-list a');
    if (firstLink) firstLink.focus();
  };

  // close + navigate for sidebar links so the close animation can play
  const sidebarLinks = overlay.querySelectorAll('.sidebar-list a');
  if (sidebarLinks && sidebarLinks.length) {
    sidebarLinks.forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (!href || href === '#') {
          // nothing to navigate to
          closeSidebar();
          return;
        }
        e.preventDefault();
        // play close animation then navigate
        closeSidebar();
        setTimeout(() => {
          window.location.href = href;
        }, 220);
      });
    });
  }

  hamburger.addEventListener('click', e => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    if (expanded) closeSidebar();
    else openSidebar();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

  // click on overlay background closes (but not clicks inside sidebar)
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeSidebar();
  });

  // close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeSidebar();
    }
  });
}
