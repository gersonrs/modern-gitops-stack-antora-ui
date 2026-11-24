;(function () {
  'use strict'

  var searchInput = document.getElementById('search-input')
  if (!searchInput) return

  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || ''
    var isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)

    if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (!isEditing && e.key === '/')) {
      e.preventDefault()
      searchInput.focus()
      searchInput.select()
    } else if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.blur()
    }
  })
})()
