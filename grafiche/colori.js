// I colori delle grafiche della serata. Ogni template di Almagreal ha tre colori: il fondo, il colore del titolo e
// delle figure (stampati nel PNG) e il colore delle scritte che aggiungiamo noi (nomi e programma). Nel ledwall quei
// due non coincidono — misurati sul template: titolo bordeaux #7c3d36, programma rosso #9b0707 — e la distinzione va
// tenuta. Il fondo PNG si ricolora pixel per pixel (vedi render.js), le scritte si disegnano col terzo colore.
// La scelta è di chi scarica, resta nel suo telefono o computer, e non cambia nulla per gli altri.
(function (global) {
  var CHIAVE = 'grafiche-colori'

  // Colori pronti: fondo + scritte. Il colore del titolo e delle figure segue il template (vedi titoloPer):
  // dove Almagreal lo ha fatto diverso dal testo, resta diverso.
  var PRONTI = [
    { nome: 'Rosso su crema', fondo: '#f5efe3', scritte: '#9b0707' },
    { nome: 'Crema su rosso', fondo: '#9b0707', scritte: '#f6f0e4' },
    { nome: 'Bordeaux su crema', fondo: '#f5efe3', scritte: '#7c3d36' },
    { nome: 'Crema su bordeaux', fondo: '#7c3d36', scritte: '#f6f0e4' },
    { nome: 'Nero su crema', fondo: '#f5efe3', scritte: '#17140f' },
    { nome: 'Crema su nero', fondo: '#141210', scritte: '#f3eee2' },
    { nome: 'Oro su nero', fondo: '#121212', scritte: '#d7b263' },
    { nome: 'Nero su oro', fondo: '#d8bb6a', scritte: '#1a1613' },
    { nome: 'Blu notte su crema', fondo: '#f3f1ea', scritte: '#16244c' },
    { nome: 'Crema su blu notte', fondo: '#16244c', scritte: '#f3f1ea' },
    { nome: 'Oro su blu notte', fondo: '#16244c', scritte: '#d7b263' },
    { nome: 'Verde bosco su crema', fondo: '#f3f1e6', scritte: '#1f4433' },
    { nome: 'Crema su verde bosco', fondo: '#1f4433', scritte: '#f3f1e6' },
    { nome: 'Oro su verde bosco', fondo: '#143326', scritte: '#d7b263' },
    { nome: 'Viola su crema', fondo: '#f4f0f5', scritte: '#43204f' },
    { nome: 'Crema su viola', fondo: '#3b1d4e', scritte: '#f1e9f5' },
    { nome: 'Ottanio su crema', fondo: '#eef2f2', scritte: '#11494f' },
    { nome: 'Crema su ottanio', fondo: '#11494f', scritte: '#eef2f2' },
    { nome: 'Terracotta su crema', fondo: '#f6efe7', scritte: '#9c4a21' },
    { nome: 'Crema su terracotta', fondo: '#9c4a21', scritte: '#f8f1e8' },
    { nome: 'Grigio su bianco', fondo: '#faf9f6', scritte: '#36332d' },
    { nome: 'Bianco su grigio', fondo: '#3a3833', scritte: '#f7f5f0' },
    { nome: 'Argento su nero', fondo: '#111111', scritte: '#cdd2d6' },
    { nome: 'Rosa antico su bordeaux', fondo: '#5c2230', scritte: '#f0d7d8' },
  ]

  // Dove il template ha il titolo di un colore suo (oggi: il ledwall), scegliendo colori nuovi il titolo resta
  // distinto dal testo, smorzato verso il fondo nella stessa misura in cui lo era nel template.
  function titoloPer(nativi, fondo, testo) {
    if (!nativi || nativi.titolo === nativi.scritte) return testo
    var k = quanto(nativi.fondo, nativi.scritte, nativi.titolo)
    return mescola(fondo, testo, k)
  }
  // quanto del secondo colore c'e in «mezzo», fra primo e secondo (0 = tutto il primo, 1 = tutto il secondo)
  function quanto(a, b, mezzo) {
    var A = rgb(a), B = rgb(b), M = rgb(mezzo)
    var vx = B[0]-A[0], vy = B[1]-A[1], vz = B[2]-A[2]
    var vv = vx*vx + vy*vy + vz*vz || 1
    var k = ((M[0]-A[0])*vx + (M[1]-A[1])*vy + (M[2]-A[2])*vz) / vv
    return Math.max(0.25, Math.min(0.95, k))
  }
  function mescola(a, b, k) {
    var A = rgb(a), B = rgb(b)
    var v = [0,1,2].map(function (i) { return Math.round(A[i] + (B[i]-A[i])*k) })
    return '#' + v.map(function (x) { return ('0' + x.toString(16)).slice(-2) }).join('')
  }

  function pulisci(c) {
    var t = String(c == null ? '' : c).trim().replace(/^#/, '')
    if (/^[0-9a-fA-F]{3}$/.test(t)) t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2]
    return /^[0-9a-fA-F]{6}$/.test(t) ? '#' + t.toLowerCase() : null
  }

  function rgb(c) {
    var n = parseInt(pulisci(c).slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }

  // Contrasto come lo misura la norma sull'accessibilità (WCAG): sotto 3 due colori non si distinguono bene.
  function luminosita(c) {
    var v = rgb(c).map(function (x) {
      x = x / 255
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
  }
  function contrasto(a, b) {
    var x = luminosita(a), y = luminosita(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }

  function leggiTutte() {
    try {
      var v = JSON.parse(localStorage.getItem(CHIAVE) || '{}')
      return v && typeof v === 'object' ? v : {}
    } catch (e) { return {} }
  }
  function salvaTutte(v) {
    try { localStorage.setItem(CHIAVE, JSON.stringify(v)) } catch (e) { /* telefono senza memoria: pazienza */ }
  }

  // null = la grafica resta com'è nel template di Almagreal.
  function scelta(modello) {
    var v = leggiTutte()[modello]
    if (!v) return null
    var f = pulisci(v.fondo), s = pulisci(v.scritte), ti = pulisci(v.titolo)
    if (!f || !s) return null
    return { fondo: f, titolo: ti || s, scritte: s }
  }

  function imposta(modello, terna) {
    var v = leggiTutte()
    if (!terna) delete v[modello]
    else {
      var f = pulisci(terna.fondo), s = pulisci(terna.scritte), ti = pulisci(terna.titolo)
      if (!f || !s) return false
      v[modello] = { fondo: f, titolo: ti || s, scritte: s }
    }
    salvaTutte(v)
    return true
  }

  // modelli = [{chiave, nativi}]: ognuno tiene il suo rapporto fra titolo e testo.
  function impostaTutti(modelli, coppia) {
    modelli.forEach(function (m) {
      imposta(m.chiave, coppia && { fondo: coppia.fondo, scritte: coppia.scritte,
        titolo: titoloPer(m.nativi, coppia.fondo, coppia.scritte) })
    })
  }

  global.GRAFICHE_COLORI = {
    PRONTI: PRONTI,
    pulisci: pulisci,
    rgb: rgb,
    contrasto: contrasto,
    titoloPer: titoloPer,
    mescola: mescola,
    luminosita: luminosita,
    scelta: scelta,
    imposta: imposta,
    impostaTutti: impostaTutti,
  }
})(window)
