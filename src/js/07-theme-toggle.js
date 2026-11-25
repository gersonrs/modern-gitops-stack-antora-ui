;(function () {
  'use strict'

  var STORAGE_KEY = 'mg-docs-theme'
  var root = document.documentElement
  var toggleBtn = document.getElementById('mg-theme-toggle')

  function applyTheme (theme) {
    var normalized = theme === 'light' ? 'light' : 'dark'
    root.setAttribute('data-theme', normalized)
    if (toggleBtn) {
      var nextLabel = normalized === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'
      toggleBtn.setAttribute('aria-label', nextLabel)
      toggleBtn.setAttribute('title', nextLabel)
      toggleBtn.setAttribute('aria-pressed', normalized === 'light' ? 'true' : 'false')
    }
  }

  var initial = root.getAttribute('data-theme') || 'dark'
  applyTheme(initial)

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
      var next = current === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch (e) {}
    })
  }

  var yearEl = document.getElementById('mg-footer-year')
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear())
  }
})()
