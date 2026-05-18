/* =========================================================================
   LANGUAGE TOGGLE — Bangla / English (SEO Friendly URL Redirection)
   ========================================================================= */

const LANG_KEY = 'mit-lang';

function setLangUI(lang) {
  // Update toggle button label
  const btn = document.getElementById('langToggle');
  if (btn) {
    const label = btn.querySelector('.lang-label');
    if (label) label.textContent = lang === 'bn' ? 'EN' : 'বাং';
    btn.setAttribute('aria-label', lang === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন');
  }
}

function toggleLang() {
  const currentPath = window.location.pathname;
  let filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  
  if (!filename || filename === '') {
    filename = 'index.html';
  }

  const isBangla = filename.endsWith('-bn.html') || filename.endsWith('-bn');

  if (isBangla) {
    // Switch to English
    let newFilename = filename.replace('-bn.html', '.html');
    if (newFilename === filename) {
        newFilename = filename.replace('-bn', '');
    }
    if (newFilename === '') newFilename = '/'; // Go to root if it was just /index-bn
    
    localStorage.setItem(LANG_KEY, 'en');
    window.location.href = currentPath.replace(filename, newFilename);
  } else {
    // Switch to Bangla
    let newFilename = filename;
    if (filename.endsWith('.html')) {
        newFilename = filename.replace('.html', '-bn.html');
    } else {
        if (filename === 'index') newFilename = 'index-bn';
        else newFilename = filename + '-bn';
    }
    
    // special case for root
    if (currentPath === '/' || currentPath === '') {
        newFilename = 'index-bn.html';
    }
    
    localStorage.setItem(LANG_KEY, 'bn');
    window.location.href = currentPath.endsWith('/') ? currentPath + newFilename : currentPath.replace(filename, newFilename);
  }
}

/* ── Bootstrap on DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  let filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  
  if (!filename || filename === '') {
    filename = 'index.html';
  }
  
  const isBangla = filename.endsWith('-bn.html') || filename.endsWith('-bn');
  
  const saved = localStorage.getItem(LANG_KEY);
  
  if (isBangla) {
    document.documentElement.lang = 'bn';
    setLangUI('bn');
    if (saved !== 'bn') localStorage.setItem(LANG_KEY, 'bn');
  } else {
    document.documentElement.lang = 'en';
    setLangUI('en');
    if (saved !== 'en') localStorage.setItem(LANG_KEY, 'en');
  }
});
