;(function () {
  'use strict'

  var CMD_RX = /^\$ (\S[^\\\n]*(\\\n(?!\$ )[^\\\n]*)*)(?=\n|$)/gm
  var LINE_CONTINUATION_RX = /( ) *\\\n *|\\\n( ?) */g
  var TRAILING_SPACE_RX = / +$/gm
  var supportsCopy = Boolean(window.navigator && window.navigator.clipboard)

  var COPY_ICON =
    '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
    '</svg>'

  var CHECK_ICON =
    '<svg class="copy-icon copy-icon--check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="20 6 9 17 4 12"></polyline>' +
    '</svg>'

  ;[].slice.call(document.querySelectorAll('.doc pre.highlight, .doc .literalblock pre')).forEach(function (pre) {
    var code, language, lang, copy, label, toolbox
    if (pre.classList.contains('highlight')) {
      code = pre.querySelector('code')
      if (!code) return
      if ((language = code.dataset.lang) && language !== 'console') {
        lang = document.createElement('span')
        lang.className = 'source-lang'
        lang.appendChild(document.createTextNode(language))
      }
    } else if (pre.innerText.startsWith('$ ')) {
      var block = pre.parentNode.parentNode
      block.classList.remove('literalblock')
      block.classList.add('listingblock')
      pre.classList.add('highlightjs', 'highlight')
      code = document.createElement('code')
      code.className = 'language-console hljs'
      code.dataset.lang = 'console'
      code.appendChild(pre.firstChild)
      pre.appendChild(code)
    } else {
      return
    }

    toolbox = document.createElement('div')
    toolbox.className = 'source-toolbox'
    if (lang) toolbox.appendChild(lang)
    if (supportsCopy) {
      copy = document.createElement('button')
      copy.type = 'button'
      copy.className = 'copy-button'
      copy.setAttribute('title', 'Copiar código')
      copy.setAttribute('aria-label', 'Copiar código')
      copy.innerHTML = COPY_ICON + CHECK_ICON
      label = document.createElement('span')
      label.className = 'copy-label'
      label.textContent = 'Copiar'
      copy.appendChild(label)
      toolbox.appendChild(copy)
      copy.addEventListener('click', writeToClipboard.bind(copy, code, label))
    }
    pre.parentNode.appendChild(toolbox)
  })

  function extractCommands (text) {
    var cmds = []
    var m
    while ((m = CMD_RX.exec(text))) cmds.push(m[1].replace(LINE_CONTINUATION_RX, '$1$2'))
    return cmds.join(' && ')
  }

  function writeToClipboard (code, label) {
    var btn = this
    var text = code.innerText.replace(TRAILING_SPACE_RX, '')
    if (code.dataset.lang === 'console' && text.startsWith('$ ')) text = extractCommands(text)
    window.navigator.clipboard.writeText(text).then(
      function () {
        btn.classList.add('clicked')
        label.textContent = 'Copiado!'
        clearTimeout(btn._copyTimer)
        btn._copyTimer = setTimeout(function () {
          btn.classList.remove('clicked')
          label.textContent = 'Copiar'
        }, 1800)
      },
      function () {}
    )
  }
})()
