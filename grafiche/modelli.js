// Misure dei modelli: prese una per una dai template Canva di Almagreal (30 ottobre 2026): posizione, larghezza, corpo, interlinea e
// spaziatura di ogni testo. Il logo, «Teatro Nazionale», gli ornamenti (putti e note) stanno già nello sfondo esportato da Canva;
// qui si disegnano solo i testi che cambiano ogni sera (nomi, programma, orario).
// Il programma è un elenco libero (brani, pezzi solo per pianoforte, intervallo): i testi si rimpiccioliscono da soli,
// tutti insieme e sempre con gli stessi font, finché ogni colonna sta nello spazio disponibile.
(function (global) {
  var BIANCO = '#ffffff'
  var ROSSO = '#9b0707' // il rosso dei template del 17/11/2026
  // Il ledwall ha i colori invertiti (fondo bordeaux): li il testo e color crema, come il titolo e le figure.
  var CREMA = '#f6f0e4'
  var T = global.GRAFICHE_TESTI
  var SCALA_MIN = 0.5 // sotto questa dimensione si avverte che i testi sono troppo piccoli
  var MARGINE = 0.012 // come render.js: il testo non si avvicina al bordo più di 12 millesimi della larghezza

  // «Tonight» (stasera) o «Tomorrow» (domani, per le grafiche messe il giorno prima).
  function quando(d) { return d.quando === 'Tomorrow' ? 'Tomorrow' : 'Tonight' }

  // Ruoli bilingue come nei template: «Soprano / Soprano», «Baritono / Baritone»…
  var RUOLI = { Soprano: 'Soprano', Tenor: 'Tenore', Baritone: 'Baritono', 'Bass-baritone': 'Basso-baritono', Bass: 'Basso', 'Mezzo-soprano': 'Mezzosoprano', Countertenor: 'Controtenore' }

  function riga(f, size, color, t, lh, ls) {
    var r = { run: { t: t, f: f, size: size, color: color } }
    if (lh != null) r.lh = lh
    if (ls != null) r.ls = ls
    return r
  }

  // Una riga con due stili sulla stessa linea di base (es. ruolo in grassetto + ruolo inglese in corsivo).
  function riga2(parti, lh) {
    var r = { run: parti[0], parts: parti }
    if (lh != null) r.lh = lh
    return r
  }

  function conStrato(r, nome) { r.strato = nome; return r }

  function artisti(d) {
    var r1 = d.ruolo1 === 'Mezzo-soprano' ? 'Mezzo-soprano' : 'Soprano'
    var r2 = d.ruolo2 || 'Baritone'
    return [
      { ruolo: r1, nome: d.soprano },
      { ruolo: r2, nome: d.voce2 },
      { ruolo: 'Piano', nome: d.pianista },
    ]
  }

  function larghezzaRiga(ctx, ln, ls) {
    var R = global.GRAFICHE_RENDER
    var parti = ln.parts || [ln.run]
    var w = 0
    parti.forEach(function (p) { w += R.larghezza(ctx, p, p.t, ls) })
    return w
  }

  // ---------- nomi degli artisti ----------
  // Come nei template del 17/11/2026: ruolo in grassetto e nome accanto, tutto dello stesso corpo e dello stesso rosso.
  // Sugli schermi esterni uno per riga; sul ledwall e sugli schermi interni tutti e tre su una riga, separati da « | ».
  // Se la riga piu lunga non entra nella larghezza del template, tutto il blocco si rimpicciolisce insieme.
  function nomi(d, ctx, cfg) {
    var lista = artisti(d).filter(function (a) { return String(a.nome || '').trim() })
    var unaRiga = !!cfg.unaRiga
    var C = cfg.colore || ROSSO
    var parti = function (a, k, ultimo) {
      var p = [{ t: a.ruolo + ' ', f: 'serifb', size: cfg.size * k, color: C },
        { t: String(a.nome || '').trim(), f: 'serif', size: cfg.size * k, color: C }]
      if (unaRiga && !ultimo) p.push({ t: '  |  ', f: 'serif', size: cfg.size * k, color: C })
      return p
    }
    var costruisci = function (k) {
      if (!unaRiga) return lista.map(function (a, i) { return conStrato(riga2(parti(a, k, true)), 'n' + (i + 1)) })
      var tutte = []
      lista.forEach(function (a, i) { tutte = tutte.concat(parti(a, k, i === lista.length - 1)) })
      return [conStrato(riga2(tutte), 'n1')]
    }
    var massima = 0
    costruisci(1).forEach(function (ln) { massima = Math.max(massima, larghezzaRiga(ctx, ln, cfg.ls || 0)) })
    var k = massima > cfg.width ? Math.max(0.55, cfg.width / massima) : 1
    return { nome: 'nomi', left: cfg.left, top: cfg.top, width: cfg.width, align: 'center', lh: cfg.lh, ls: cfg.ls, lines: costruisci(k) }
  }

  // ---------- programma ----------
  // L'ordine dei template del 17/11/2026: prima l'OPERA (la piu grande: e il richiamo per il pubblico), poi l'aria tra
  // virgolette, poi l'autore. Prima era il contrario. st = {opera, aria, autore, vuoto, parte}, k = riduzione.
  function voceRighe(v, st, k, C) {
    var o = st.opera * k, a = st.aria * k, u = st.autore * k
    var vuota = riga('sans', st.vuoto * k, C, '')
    if (v.tipo === 'intervallo') return [riga('sansb', u, C, '\u2014 Interval Drink \u2014'), riga('sans', u, C, 'Jazz Bar Open'), vuota]
    if (v.tipo === 'solo') {
      var testo = String(v.testo || 'Piano Solo').split('\n').map(function (x) { return x.trim() }).filter(Boolean)
      var out = []
      if (testo.length <= 1) out.push(riga('sansb', u, C, '- ' + (testo[0] || 'Piano Solo') + ' -'))
      else testo.forEach(function (x) { out.push(riga('sansb', u, C, x)) })
      out.push(vuota)
      return out
    }
    var out2 = []
    var opera = String(v.opera || '').trim()
    if (opera) out2.push(riga('sansh', o, C, opera))
    var titolo = T.titolo(v.titolo)
    if (titolo) out2.push(riga('serifb', a, C, titolo))
    var aut = T.autore(v.autore)
    if (aut) out2.push(riga('sans', u, C, 'By ' + aut))
    out2.push(vuota)
    return out2
  }

  // Divide le voci in n colonne di altezza il piu possibile uguale, senza cambiare l'ordine (h = altezze).
  function dividiFlusso(h, n) {
    var m = h.length
    var gruppi = []
    if (m <= n) { for (var i0 = 0; i0 < n; i0++) gruppi.push(i0 < m ? [i0] : []); return gruppi }
    var pre = [0]
    h.forEach(function (x) { pre.push(pre[pre.length - 1] + x) })
    var INF = 1e18
    var dp = [], dove = []
    for (var j = 0; j <= n; j++) { dp.push(new Array(m + 1).fill(INF)); dove.push(new Array(m + 1).fill(0)) }
    dp[0][0] = 0
    for (var jj = 1; jj <= n; jj++) {
      for (var i = 0; i <= m; i++) {
        for (var t = 0; t <= i; t++) {
          if (dp[jj - 1][t] >= INF) continue
          var costo = Math.max(dp[jj - 1][t], pre[i] - pre[t])
          if (costo < dp[jj][i]) { dp[jj][i] = costo; dove[jj][i] = t }
        }
      }
    }
    var fine = m
    for (var q = n; q >= 1; q--) {
      var inizio = dove[q][fine]
      var g = []
      for (var x = inizio; x < fine; x++) g.push(x)
      gruppi.unshift(g)
      fine = inizio
    }
    return gruppi
  }

  function da(a, b) { var o = []; for (var i = a; i < b; i++) o.push(i); return o }

  // Le colonne dei template: la PRIMA PARTE (fino all'intervallo compreso) e la SECONDA PARTE, ognuna con la sua
  // intestazione in corsivo. Sugli schermi esterni sono due colonne; sul ledwall e sugli interni la prima parte si
  // divide su due colonne e la seconda sta nella terza, com'e disegnato nei template.
  // Prova la dimensione piena e poi sempre piu piccola finche tutte le colonne stanno nello spazio.
  function programma(d, ctx, cfg) {
    var R = global.GRAFICHE_RENDER
    var voci = d.voci || []
    var margine = cfg.larghezza * MARGINE
    var n = cfg.colonne.length
    var taglio = voci.findIndex(function (v) { return v.tipo === 'intervallo' })
    var finePrima = taglio < 0 ? voci.length : taglio + 1 // l'intervallo chiude la prima parte
    var scala = 1
    var blocchi
    for (; scala >= 0.3; scala -= 0.01) {
      var items = voci.map(function (v) { return voceRighe(v, cfg.st, scala, cfg.colore || ROSSO) })
      var sc = scala
      var intestazione = function (testo) {
        var C = cfg.colore || ROSSO
        return [conStrato(riga('serifbi', cfg.st.parte * sc, C, testo), 'p'), riga('sans', cfg.st.parte * sc, C, '')]
      }
      var larga = cfg.colonne[0].width
      var alta = function (ix) {
        return R.impagina(ctx, { left: 0, top: 0, width: larga, align: 'center', lh: 1, ls: cfg.ls, lines: items[ix] }).alto
      }
      var prima = da(0, finePrima), seconda = da(finePrima, voci.length)
      var hPrima = prima.reduce(function (s, ix) { return s + alta(ix) }, 0)
      var hSeconda = seconda.reduce(function (s, ix) { return s + alta(ix) }, 0)
      // Quante colonne tocca a ciascuna parte: in proporzione a quanto e lunga, almeno una a testa. Cosi su una
      // grafica larga e bassa (gli schermi interni) nessuna colonna si ritrova il doppio dei brani delle altre,
      // e il testo non deve rimpicciolirsi per starci dentro.
      var nPrima = 1
      if (n > 2) nPrima = Math.max(1, Math.min(n - (seconda.length ? 1 : 0), Math.round(n * hPrima / (hPrima + hSeconda || 1))))
      if (!seconda.length) nPrima = n
      var gruppi = []
      dividiFlusso(prima.map(alta), nPrima).forEach(function (g) { gruppi.push(g.map(function (i) { return prima[i] })) })
      if (seconda.length) dividiFlusso(seconda.map(alta), n - nPrima).forEach(function (g) { gruppi.push(g.map(function (i) { return seconda[i] })) })
      blocchi = cfg.colonne.map(function (col, c) {
        // «1° PARTE» sulla prima colonna della prima parte, «2° PARTE» sulla prima della seconda
        var eti = c === 0 ? cfg.parti[0] : (c === nPrima && seconda.length ? cfg.parti[1] : null)
        var lines = eti ? intestazione(eti) : []
        ;(gruppi[c] || []).forEach(function (ix) {
          items[ix].forEach(function (l) { l.strato = 'v' + ix })
          lines = lines.concat(items[ix])
        })
        return { nome: cfg.nomi[c], left: col.left, top: col.top, width: col.width, align: 'center', lh: 1, ls: cfg.ls, maxY: col.maxY, lines: lines }
      })
      var entra = blocchi.every(function (b) {
        var r = R.impagina(ctx, b)
        return r.fine <= b.maxY && (!r.righe.length || (r.xMin >= margine && r.xMax <= cfg.larghezza - margine))
      })
      if (entra) break
    }
    blocchi.info = { scala: Math.round(scala * 100) / 100, minimo: SCALA_MIN }
    return blocchi
  }

  function con(testa, b) {
    var tutti = testa.concat(b)
    tutti.info = b.info
    return tutti
  }

  // ---------- Animazioni d'entrata (solo video per gli schermi esterni) ----------
  // Gli sfondi di Almagreal sono fermi (nessuna animazione nei template), quindi l'entrata è disegnata qui, lenta e leggera, e poi tutto resta fermo:
  //  1. lo sfondo (logo, putto) compare con una dissolvenza mentre l'intera scena si assesta con un lento zoom indietro (la «macchina da presa»);
  //  2. le note musicali entrano una per una, ruotando appena e con un piccolo rimbalzo, come se la musica cominciasse;
  //  3. i testi arrivano nell'ordine in cui si leggono: dissolvenza, sfocatura che si schiarisce e una lieve salita dal basso.
  var FACILI = {
    uscita: function (u) { return 1 - Math.pow(1 - u, 3) }, // parte decisa e si ferma piano
    lenta: function (u) { return 1 - Math.pow(1 - u, 4) }, // ancora più dolce alla fine
    rimbalzo: function (u) { var c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2) }, // supera di poco e torna
  }
  // Curva da v0 (fino a t0) a v1 (da t1 in poi), con il tipo di morbidezza scelto.
  function rampa(t0, t1, v0, v1, facile) {
    var f = FACILI[facile || 'uscita']
    var punti = []
    for (var i = 0; i <= 24; i++) { var u = i / 24; punti.push([t0 + (t1 - t0) * u, v0 + (v1 - v0) * f(u)]) }
    return punti
  }
  function entra(t0, durata) {
    return { tipo: 'dissolvenza', alfa: rampa(t0, t0 + durata, 0, 1), sfoca: rampa(t0, t0 + durata, 14, 0), dy: rampa(t0, t0 + durata * 1.15, 34, 0) }
  }
  function nota(t0) {
    return { alfa: rampa(t0, t0 + 0.7, 0, 1), scala: rampa(t0, t0 + 0.95, 0.45, 1, 'rimbalzo'), rot: rampa(t0, t0 + 1.05, -16, 0, 'rimbalzo'), dy: rampa(t0, t0 + 1.1, 70, 0) }
  }
  var SFONDO_COLORE = '#f5efe3' // il fondo chiaro dei template del 17/11/2026 (245, 239, 227)
  var CAMERA = { scala: rampa(0, 7, 1.05, 1, 'lenta') }
  var FONDO = { alfa: rampa(0, 1.6, 0, 1) }
  var TEMPO = { durata: 15, fine: 7.2 } // l'entrata finisce entro 7 secondi; poi l'immagine resta ferma fino a 15

  // Misure prese una per una dai template Canva di Almagreal consegnati il 17 novembre 2026 (2a tranche): fondo chiaro al
  // posto dell'arancione, nomi degli artisti e programma in una grafica sola, OPERA piu grande dell'aria, prima e seconda
  // parte distinte. I numeri qui sotto sono quelli dei template, moltiplicati per la scala a cui disegniamo.
  var K = 2 // i template esterni e interni sono 1080x1920 e 1920x1080: si disegna al doppio (2160x3840 e 3840x2160)
  var ST_ESTERNI = { opera: 34.4899 * K, aria: 29.6398 * K, autore: 27.2215 * K, vuoto: 29.916 * K, parte: 34.4899 * K }
  // Gli schermi interni sono larghi e bassi: con le caselle strette del template il programma si rimpiccioliva
  // troppo. Ora le colonne sono quattro e larghe, e il corpo parte piu grande (1,35 volte le misure del template),
  // cosi una serata normale si legge da lontano (Osaid, 17/11/2026).
  var MI = 1.55
  var ST_INTERNI = { opera: 22.541 * K * MI, aria: 19.371 * K * MI, autore: 17.79 * K * MI, vuoto: 19.551 * K * MI, parte: 22.541 * K * MI }
  var ST_LEDWALL = { opera: 81.144, aria: 69.733, autore: 64.043, vuoto: 70.383, parte: 81.144 }

  // I due colori con cui e disegnato ogni fondo di Almagreal. Se chi scarica ne ha scelti altri (colori.js), valgono
  // quelli: il fondo PNG viene ricolorato e il testo si scrive con lo stesso inchiostro, cosi la grafica resta d'un pezzo.
  function tinta(chiave, nativi) {
    var s = global.GRAFICHE_COLORI && global.GRAFICHE_COLORI.scelta(chiave)
    return s || nativi
  }
  // Misurati sui template di Almagreal (17/11/2026): negli esterni, negli interni e nel ringraziamento il titolo e
  // delle stesse scritte (rosso #9b0707); nel ledwall no, li il titolo e le figure sono bordeaux e il programma rosso.
  // Il ledwall e invertito (fondo bordeaux): titolo e figure in rosa cipria, programma in crema piena.
  var NAT_CHIARO = { fondo: '#f5efe3', titolo: ROSSO, scritte: ROSSO }
  var NAT_LEDWALL = { fondo: '#7c3d36', titolo: '#d4beb3', scritte: CREMA }
  var NAT_GRAZIE = { fondo: '#f4eee2', titolo: ROSSO, scritte: ROSSO }

  var MODELLI = {
    // Schermi esterni, verticali 2160x3840: nomi e programma insieme, su due colonne (prima parte a sinistra, seconda a destra)
    'esterni': {
      w: 2160, h: 3840, plate: 'plate/esterni-2026.png', chiave: 'esterni', nativi: NAT_CHIARO,
      video: { plate: 'plate/esterni-2026.png', w: 2160, h: 3840, bitrate: 8e6, tempo: TEMPO, sfondoColore: SFONDO_COLORE, camera: CAMERA, fondo: FONDO,
        livelli: [],
        // prima i nomi degli artisti uno sotto l'altro, poi «CONCERT PROGRAM», poi i brani a cascata
        anim: function (strati) {
          var m = {}
          var contati = {}
          strati.forEach(function (st) {
            var p = st.nome.split(':')
            if (p[0] === 'nomi') m[st.nome] = entra(1.6 + (Number(String(p[1]).replace('n', '')) - 1) * 0.5, 1.4)
            else if (p[0] === 'titolo') m[st.nome] = entra(3.2, 1.3)
            else if (p[1] && (p[1].charAt(0) === 'v' || p[1] === 'p')) {
              var j = contati[p[0]] || 0
              contati[p[0]] = j + 1
              m[st.nome] = entra((p[0] === 'programma di destra' ? 4.1 : 3.9) + j * 0.16, 1.2)
            }
          })
          return m
        } },
      blocchi: function (d, ctx) {
        var I = tinta('esterni', NAT_CHIARO).scritte
        var b = programma(d, ctx, { larghezza: 2160, st: ST_ESTERNI, ls: 0.039, colore: I,
          nomi: ['programma di sinistra', 'programma di destra'], parti: ['1\u00b0 PARTE', '2\u00b0 PARTE'],
          colonne: [
            { left: 108 * K, width: 387.596 * K, top: 758.665 * K, maxY: 1700 * K },
            { left: 553.078 * K, width: 418.922 * K, top: 758.665 * K, maxY: 1495 * K },
          ] })
        return con([
          nomi(d, ctx, { left: 0, top: 481.203 * K, width: 1080 * K, size: 34.6666 * K, lh: 1.36, ls: 0.026, colore: I }),
          { nome: 'titolo', left: 298.329 * K, top: 657.528 * K, width: 483.342 * K, align: 'center', lh: 1.05, ls: 0, lines: [
            conStrato(riga('sansb', 35.6872 * K, I, 'CONCERT PROGRAM'), 't1'),
            conStrato(riga('sans', 25 * K, I, quando(d).toUpperCase() + ' ' + d.orario, 1.3), 't2'),
          ] },
        ], b)
      },
    },
    // Ledwall 4224x4320: nomi su una riga sola e programma in tre colonne (la prima parte ne occupa due)
    'ledwall': {
      w: 4224, h: 4320, plate: 'plate/ledwall-2026.png', chiave: 'ledwall', nativi: NAT_LEDWALL,
      blocchi: function (d, ctx) {
        var I = tinta('ledwall', NAT_LEDWALL).scritte
        var b = programma(d, ctx, { larghezza: 4224, st: ST_LEDWALL, ls: 0.039, colore: I,
          nomi: ['programma 1', 'programma 2', 'programma 3'], parti: ['1\u00b0 PARTE', '2\u00b0 PARTE'],
            // Il fondo del ledwall e invertito (17/11/2026): il testo e color crema come le figure in basso, quindi le
            // colonne si fermano PRIMA di toccarle, altrimenti si confondono. Misurato sul fondo: le figure cominciano
            // a y 3169 sotto la prima e la terza colonna, a 3514 sotto quella centrale.
          colonne: [
            { left: 530.1, width: 911.9, top: 1761.3, maxY: 3150 },
            { left: 1602.3, width: 946, top: 1918.2, maxY: 3490 },
            { left: 2708.3, width: 985.6, top: 1761.3, maxY: 3150 },
          ] })
        return con([
          nomi(d, ctx, { left: 352.4, top: 1306.2, width: 3519.2, size: 76.691, lh: 1.13, ls: 0.026, unaRiga: true, colore: I }),
          { nome: 'titolo', left: 1324.5, top: 1501.9, width: 1575, align: 'center', lh: 1.05, ls: 0, lines: [
            riga('sansb', 94.564, I, 'CONCERT PROGRAM'),
          ] },
        ], b)
      },
    },
    // Ledwall, fine serata: ringraziamento con i QR per la recensione e per la prossima serata. Non cambia mai: solo lo sfondo.
    'ledwall-grazie': {
      w: 4224, h: 4320, plate: 'plate/ledwall-grazie.png', chiave: 'ledwall-grazie', nativi: NAT_GRAZIE,
      blocchi: function () { var b = []; b.info = { scala: 1, minimo: SCALA_MIN }; return b },
    },
    // Schermi interni 16:9 (3840x2160): nomi su una riga sola e programma in tre colonne
    'interni': {
      w: 3840, h: 2160, plate: 'plate/interni-2026.png', chiave: 'interni', nativi: NAT_CHIARO,
      blocchi: function (d, ctx) {
        var I = tinta('interni', NAT_CHIARO).scritte
        var b = programma(d, ctx, { larghezza: 3840, st: ST_INTERNI, ls: 0.039, colore: I,
          nomi: ['programma 1', 'programma 2', 'programma 3', 'programma 4'], parti: ['1\u00b0 PARTE', '2\u00b0 PARTE'],
            // Le caselle del template erano strette (circa 520 px l'una) e il programma si rimpiccioliva troppo per
            // starci (Osaid, 17/11/2026). Lo spazio davvero libero nel fondo, misurato pixel per pixel, va da x 532
            // a x 3307 e scende fino a y 1800 (sotto comincia «TEATRO NAZIONALE»): le colonne ora lo usano tutto.
          colonne: [
            { left: 532, width: 611, top: 466.5 * K, maxY: 1820 },
            { left: 1253, width: 611, top: 466.5 * K, maxY: 1820 },
            { left: 1974, width: 611, top: 466.5 * K, maxY: 1820 },
            { left: 2696, width: 611, top: 466.5 * K, maxY: 1820 },
          ] })
        return con([
          nomi(d, ctx, { left: 420.248 * K, top: 332.604 * K, width: 1079.5 * K, size: 23.525 * K, lh: 1.13, ls: 0.026, unaRiga: true, colore: I }),
          { nome: 'titolo', left: 718.4 * K, top: 414.1 * K, width: 483.1 * K, align: 'center', lh: 1.05, ls: 0, lines: [
            riga('sansb', 29.007 * K, I, 'CONCERT PROGRAM'),
          ] },
        ], b)
      },
    },
  }

  // ---------- Locandine con foto ----------
  // Template orizzontali di Almagreal per i monitor (1921×1080): a sinistra logo, data e ora, a destra un riquadro quadrato per la foto.
  // Nella data, i suffissi dopo le cifre («th» in «19th», «pm» in «8:00pm») sono piccoli e rialzati, come nel template.
  function partiData(testo, size, color) {
    var parti = []
    var re = /(\d)(st|nd|rd|th|am|pm)\b/gi
    var ultimo = 0, m
    while ((m = re.exec(testo)) !== null) {
      var fine = m.index + 1
      parti.push({ t: testo.slice(ultimo, fine), f: 'sans', size: size, color: color })
      parti.push({ t: m[2], f: 'sans', size: size * 0.6, color: color, rialzo: 0.38 })
      ultimo = fine + m[2].length
    }
    parti.push({ t: testo.slice(ultimo), f: 'sans', size: size, color: color })
    var utili = parti.filter(function (p) { return p.t })
    return utili.length ? utili : [{ t: ' ', f: 'sans', size: size, color: color }]
  }

  function locandina(plate, colore) {
    return {
      w: 3840, h: 2160, plate: plate,
      foto: [{ x: 960.5 * K, y: 91.7817 * K, w: 896.4366 * K, h: 896.4366 * K }],
      blocchi: function (d) {
        return [{ nome: 'data', left: (475.77 - 400) * K, top: 60 * K, width: 800 * K, align: 'center', lh: 1.4, ls: 0,
          lines: [riga2(partiData(d.testoData || '', 40 * K, colore), 1.4)] }]
      },
    }
  }
  MODELLI['locandina-voci'] = locandina('plate/locandina-voci.png', '#9c0d08')
  MODELLI['locandina-btc'] = locandina('plate/locandina-btc.png', '#130a80')

  global.GRAFICHE_MODELLI = MODELLI
})(window)
