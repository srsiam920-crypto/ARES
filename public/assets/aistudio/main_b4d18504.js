/* ARES OS v2.6 - front-end logic for POD, CMO / Commander and Ground Station views. */
(function () {
  'use strict';

  var BOOT = JSON.parse(document.getElementById('ares-boot').textContent);
  var CSRF = document.querySelector('meta[name="csrf-token"]').content;
  var ROLE = BOOT.role;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function avatarHtml(p, size) {
    var cls = 'avatar' + (size ? ' ' + size : '');
    var inner = p.picture ? '<img src="' + esc(p.picture) + '" alt="">' : esc(p.initials);
    return '<span class="' + cls + '" style="--theme:' + esc(p.color) + '">' + inner + '</span>';
  }

  function api(url, opts) {
    opts = opts || {};
    var headers = { 'X-CSRFToken': CSRF };
    var body = opts.body;
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    return fetch(url, { method: opts.method || (body ? 'POST' : 'GET'), headers: headers, body: body, credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 401 || (r.redirected && r.url.indexOf('/login') !== -1)) { window.location.href = '/login/'; }
        return r.json().catch(function () { return {}; }).then(function (data) { data._http = r.status; data._ok = r.ok; return data; });
      });
  }

  /* =====================================================================
   * VOICE GUIDE / NARRATOR (Point 9) - uses the browser's speech synthesis
   * ===================================================================== */
  var Narrator = (function () {
    var supported = 'speechSynthesis' in window;
    var enabled = false, rate = 1;
    try { enabled = localStorage.getItem('ares.narr') === '1'; rate = parseFloat(localStorage.getItem('ares.rate') || '1'); } catch (e) {}
    var toggle = $('narrToggle'), dot = $('speakDot'), rateSel = $('narrRate');

    function pickVoice() {
      var voices = window.speechSynthesis.getVoices();
      for (var i = 0; i < voices.length; i++) { if (/^en/i.test(voices[i].lang)) { return voices[i]; } }
      return voices[0] || null;
    }
    function speak(text) {
      if (!supported || !text) { return; }
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = rate; u.pitch = 0.95; u.lang = 'en-US';
      var v = pickVoice(); if (v) { u.voice = v; }
      u.onstart = function () { dot.classList.add('on'); };
      u.onend = u.onerror = function () { dot.classList.remove('on'); };
      window.speechSynthesis.speak(u);
    }
    function paint() {
      toggle.textContent = supported ? (enabled ? 'ON' : 'OFF') : 'UNSUPPORTED';
      toggle.classList.toggle('is-active', enabled);
    }
    function say(text) { if (enabled) { speak(text); } }   // only when the guide is ON

    toggle.addEventListener('click', function () {
      if (!supported) { return; }
      enabled = !enabled;
      try { localStorage.setItem('ares.narr', enabled ? '1' : '0'); } catch (e) {}
      paint();
      if (enabled) { speak(welcomeText()); } else { window.speechSynthesis.cancel(); }
    });
    $('narrNow').addEventListener('click', function () { speak(screenText()); });   // works even when OFF
    $('narrStop').addEventListener('click', function () { if (supported) { window.speechSynthesis.cancel(); } });
    rateSel.value = String(rate);
    rateSel.addEventListener('change', function () {
      rate = parseFloat(rateSel.value) || 1;
      try { localStorage.setItem('ares.rate', String(rate)); } catch (e) {}
    });
    paint();
    return { speak: speak, say: say, supported: supported };
  })();

  function welcomeText() {
    if (ROLE === 'astronaut') {
      return 'Welcome aboard, ' + BOOT.me.name + '. This is ARES, your neuro-therapeutic assistant. ' +
        'I will describe each screen as you open it. You can switch me off at any time with the voice guide button.';
    }
    if (ROLE === 'ground') { return 'Ground station online. I will announce new support calls and crew alarms.'; }
    return 'Welcome, ' + BOOT.me.name + '. I will announce crew alarms and describe each section on request.';
  }

  /* =====================================================================
   * SHARED: crew state used by narration + CMO / Ground rendering
   * ===================================================================== */
  var pod = { hr: 70, hrv: 55, jitter: 2, sleep: 85, spo2: 98, adi: 0, label: '', level: 'ok' };
  var crewData = [], callData = [];

  function screenText() {
    if (ROLE === 'astronaut') {
      var active = document.querySelector('#podNav .is-active');
      var id = active ? active.dataset.tab : 'pod-telemetry';
      return podScripts[id] ? podScripts[id]() : '';
    }
    if (ROLE === 'ground') {
      var open = callData.filter(function (c) { return c.status !== 'resolved'; });
      return 'Ground station. There are ' + open.length + ' open support calls. ' +
        (open.length ? 'The most recent is ' + open[0].priority_label + ' priority from ' + open[0].raised_by + '. ' : '') +
        crewSummary();
    }
    return 'Medical console. ' + crewSummary() + ' Use the emergency section for AI suggestions, the call panel to contact ground support, ' +
      'and the override protocol, which needs both the commander and CMO codes.';
  }
  function crewSummary() {
    if (!crewData.length) { return 'Crew telemetry is still loading.'; }
    return crewData.map(function (c) {
      return c.name + ': A D I ' + c.vitals.adi_score.toFixed(2) + ', ' + c.vitals.adi_label.toLowerCase() + '. ';
    }).join('');
  }

  var podScripts = {
    'pod-telemetry': function () {
      return 'Biometrics and waveforms. Heart rate is ' + pod.hr + ' beats per minute. Heart rate variability is ' + pod.hrv +
        ' milliseconds. Sleep quality is ' + pod.sleep + ' percent. Your autonomic distress index is ' + pod.adi.toFixed(2) +
        ', which is ' + (pod.label || 'being measured').toLowerCase() + '. The traces below show your live E C G and brain-wave bands.';
    },
    'pod-therapeutics': function () {
      return 'Therapeutic matrix. Here you can change the circadian lighting, the binaural beat and soundscape, ' +
        'the bed vibration and the deep-pressure seat. Lower binaural frequencies help recovery and sleep, higher ones increase alertness.';
    },
    'pod-pfa': function () {
      return 'Psychological first aid. Type how you feel and I will respond and adjust your environment. You can also attach an audio or video message. ' +
        'If you are in danger or feel unsafe, tell me and I will alert the medical officer immediately.';
    },
    'pod-library': function () {
      return 'Media library. Play music, voice notes, videos and photos, or add your own using the add media button. Items marked shared come from Earth.';
    },
    'pod-media': function () {
      return 'Family media and safety. Messages from Earth are buffered here despite the communication delay. ' +
        'Your biometrics are shared with the medical officer, and an alarm triggers if your distress index passes zero point seven.';
    }
  };

  /* =====================================================================
   * POD (astronaut) view
   * ===================================================================== */
  function initPod() {
    // ---- tabs
    $('podNav').addEventListener('click', function (e) {
      var btn = e.target.closest('.ares-tab-btn');
      if (!btn) { return; }
      document.querySelectorAll('#podNav .ares-tab-btn').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var target = btn.dataset.tab;
      document.querySelectorAll('#podInterface .tab-panel').forEach(function (p) {
        p.style.display = p.id === target ? 'block' : 'none';
      });
      Narrator.say(podScripts[target] ? podScripts[target]() : '');
    });

    // ---- therapeutic matrix
    document.querySelectorAll('.lumi-slider').forEach(function (s) {
      s.addEventListener('input', function () { $(s.id + '-val').textContent = s.value + s.dataset.unit; });
    });
    function selectPhoto(mode) {
      document.querySelectorAll('[data-photo]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.photo === mode); });
      $('photoCctBadge').textContent = mode === 'wake' ? '6500K Cyan' : '1800K Amber';
    }
    document.querySelectorAll('[data-photo]').forEach(function (b) {
      b.addEventListener('click', function () { selectPhoto(b.dataset.photo); });
    });
    function setSlider(id, v) { var s = $(id); s.value = v; s.dispatchEvent(new Event('input')); }
    function applyActions(a) {                       // actions returned by the PFA AI
      if (!a) { return; }
      if (a.seat_pressure != null) { setSlider('seatPressure', a.seat_pressure); }
      if (a.vibro != null) { setSlider('vibroFreq', a.vibro); }
      if (a.brightness != null) { setSlider('photoBrightness', a.brightness); }
      if (a.photo) { selectPhoto(a.photo); }
      if (a.binaural != null) { $('binauralFreq').value = String(a.binaural); }
      if (a.soundscape) { $('soundscapeSelect').value = a.soundscape; }
    }

    // ---- AI PFA chat
    var stream = $('pfaStream');
    stream.scrollTop = stream.scrollHeight;
    function addMsg(cls, who, text) {
      var d = document.createElement('div');
      d.className = 'chat-msg ' + cls;
      d.innerHTML = '<strong>[' + esc(who) + ']</strong><br>' + esc(text);
      stream.appendChild(d); stream.scrollTop = stream.scrollHeight;
    }
    function sendPfa() {
      var input = $('pfaInput'), txt = input.value.trim();
      if (!txt) { return; }
      input.value = '';
      addMsg('crew', BOOT.me.short_name, txt);
      api('/api/send-message/', { body: { message: txt } }).then(function (r) {
        if (r.status !== 'success') { addMsg('ares', 'ARES AI - PFA', 'Connection problem. Please try again.'); return; }
        addMsg('ares', 'ARES AI - PFA', r.response);
        applyActions(r.actions);
        Narrator.say(r.response);
      });
    }
    $('pfaSendBtn').addEventListener('click', sendPfa);
    $('pfaInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { sendPfa(); } });

    // ---- media upload from the chat bar (Point 6)
    $('pfaAttachBtn').addEventListener('click', function () { $('mediaUpload').click(); });
    $('mediaUpload').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) { return; }
      uploadMedia(f, f.name, 'pfa', function (ok, msg) {
        addMsg('crew', BOOT.me.short_name, ok ? '📎 Attached: ' + f.name : 'Attachment failed: ' + msg);
      });
      e.target.value = '';
    });

    // ---- media library (Point 6)
    var media = BOOT.media || [];
    function renderMedia() {
      var grid = $('mediaGrid');
      if (!media.length) { grid.innerHTML = '<span class="muted">No media yet. Add a file above.</span>'; return; }
      grid.innerHTML = media.map(function (m) {
        var player = m.kind === 'audio' ? '<audio controls preload="none" src="' + esc(m.url) + '"></audio>'
          : m.kind === 'video' ? '<video controls preload="metadata" src="' + esc(m.url) + '"></video>'
          : m.kind === 'image' ? '<img src="' + esc(m.url) + '" alt="' + esc(m.title) + '">'
          : '<a class="logout-link" href="' + esc(m.url) + '" target="_blank" rel="noopener">Open file</a>';
        return '<div class="media-card"><div class="media-title">' + esc(m.title) + '</div>' + player +
          '<div class="ctrl-row"><span class="tag">' + esc(m.kind.toUpperCase()) + (m.shared ? ' · SHARED' : '') + '</span>' +
          (m.shared ? '' : '<button class="ares-tab-btn" data-del="' + m.id + '" type="button">Delete</button>') + '</div></div>';
      }).join('');
    }
    function uploadMedia(file, title, source, done) {
      var fd = new FormData();
      fd.append('file', file); fd.append('title', title || file.name); fd.append('source', source);
      api('/api/media/upload/', { body: fd }).then(function (r) {
        if (r.status === 'success') { media.unshift(r.item); renderMedia(); }
        done(r.status === 'success', r.message || '');
      });
    }
    $('libUploadBtn').addEventListener('click', function () {
      var f = $('libFile').files[0], st = $('libStatus');
      if (!f) { st.className = 'status-msg err'; st.textContent = 'Choose a file first.'; return; }
      st.className = 'status-msg'; st.textContent = 'Uploading...';
      uploadMedia(f, $('libTitle').value.trim(), 'library', function (ok, msg) {
        st.className = 'status-msg ' + (ok ? 'ok' : 'err');
        st.textContent = ok ? 'Added to your library.' : (msg || 'Upload failed.');
        if (ok) { $('libFile').value = ''; $('libTitle').value = ''; }
      });
    });
    $('mediaGrid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]'); if (!b) { return; }
      if (!window.confirm('Delete this item?')) { return; }
      api('/api/media/' + b.dataset.del + '/delete/', { method: 'POST', body: {} }).then(function (r) {
        if (r.status === 'success') {
          media = media.filter(function (m) { return String(m.id) !== b.dataset.del; }); renderMedia();
        }
      });
    });
    renderMedia();

    // ---- family media simulation
    var playing = false;
    $('mediaPlayBtn').addEventListener('click', function () {
      playing = !playing;
      this.textContent = playing ? 'PAUSE SIMULATION' : 'PLAY SIMULATION';
    });

    // ---- live biometrics
    var lastLevel = 'ok';
    function poll() {
      api('/api/biometrics/').then(function (d) {
        if (d.heart_rate == null) { return; }
        pod.hr = d.heart_rate; pod.hrv = d.hrv; pod.jitter = d.voice_jitter; pod.sleep = d.sleep_quality;
        pod.spo2 = d.spo2; pod.adi = d.adi_score; pod.label = d.adi_label; pod.level = d.adi_level;
        $('metricHr').textContent = d.heart_rate; $('metricHrv').textContent = d.hrv;
        $('metricSleep').textContent = d.sleep_quality; $('metricJitter').textContent = d.voice_jitter.toFixed(1);
        $('metricSpo2').textContent = d.spo2;
        $('podAdiVal').textContent = d.adi_score.toFixed(2) + ' ' + d.adi_label;
        var dot = $('podAdiDot');
        dot.className = 'ares-badge-dot' + (d.adi_level === 'warning' ? ' warning' : d.adi_level === 'critical' ? ' critical' : '');
        if (d.adi_level === 'critical' && lastLevel !== 'critical') {
          Narrator.say('Attention. Your distress index is high. I have notified the medical officer. Please breathe slowly with me: in for four, out for six.');
        }
        lastLevel = d.adi_level;
      });
    }
    poll(); setInterval(poll, 3000);
    requestAnimationFrame(renderCanvases);
  }

  /* ---------------- canvases: ECG / EEG / family media ---------------- */
  var ecgPoints = [], ecgX = 0, lastFrame = 0;
  function gauss(x, c, w, a) { return a * Math.exp(-Math.pow(x - c, 2) / (2 * w * w)); }
  function ecgValue(phase) {                       // smooth P-QRS-T complex, 0..1 phase
    return gauss(phase, 0.18, 0.025, 0.12) + gauss(phase, 0.30, 0.008, -0.15) +
      gauss(phase, 0.32, 0.010, 1.0) + gauss(phase, 0.34, 0.010, -0.25) + gauss(phase, 0.55, 0.04, 0.25);
  }
  function fit(canvas) {
    var p = canvas.parentElement;
    canvas.width = p.clientWidth; canvas.height = p.clientHeight;
    return canvas.getContext('2d');
  }
  function renderCanvases(ts) {
    var ecg = $('ecgCanvas'), eeg = $('eegCanvas'), med = $('mediaCanvas');
    if (ecg && ecg.parentElement.clientWidth) {
      var ctx = fit(ecg), w = ecg.width, h = ecg.height;
      ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, w, h);
      var step = Math.max(1, Math.round(((ts - lastFrame) || 16) / 16) * 1.5);
      ecgX = (ecgX + step) % w;
      var period = 60000 / Math.max(40, pod.hr), phase = (Date.now() % period) / period;
      ecgPoints.push({ x: ecgX, y: h / 2 - ecgValue(phase) * h * 0.38 });
      if (ecgPoints.length > 260) { ecgPoints.shift(); }
      ctx.beginPath(); ctx.strokeStyle = '#9dd2ff'; ctx.lineWidth = 1.5;
      for (var i = 0; i < ecgPoints.length; i++) {
        if (i === 0 || ecgPoints[i].x < ecgPoints[i - 1].x || ecgPoints[i].x - ecgPoints[i - 1].x > 8) { ctx.moveTo(ecgPoints[i].x, ecgPoints[i].y); }
        else { ctx.lineTo(ecgPoints[i].x, ecgPoints[i].y); }
      }
      ctx.stroke();
    }
    if (eeg && eeg.parentElement.clientWidth) {
      var c2 = fit(eeg), w2 = eeg.width, h2 = eeg.height;
      c2.fillStyle = '#141414'; c2.fillRect(0, 0, w2, h2);
      var bands = ['DELTA', 'THETA', 'ALPHA', 'BETA'], barW = (w2 - 50) / 4, t = Date.now() / 1200;
      bands.forEach(function (b, i) {
        var val = 0.3 + Math.sin(t + i) * 0.15, barH = val * (h2 - 30), x = 10 + i * (barW + 10), y = h2 - 20 - barH;
        c2.fillStyle = i === 1 ? '#0ebc5f' : '#9dd2ff'; c2.fillRect(x, y, barW, barH);
        c2.fillStyle = 'rgba(255,255,255,0.5)'; c2.font = '10px monospace'; c2.fillText(b, x, h2 - 5);
      });
    }
    if (med && med.parentElement.clientWidth) {
      var c3 = fit(med), w3 = med.width, h3 = med.height, tt = Date.now() / 1000;
      c3.fillStyle = '#050a14'; c3.fillRect(0, 0, w3, h3);
      c3.fillStyle = 'rgba(14, 188, 95, 0.2)'; c3.beginPath();
      c3.arc(w3 / 2 + Math.sin(tt) * 30, h3 / 2 + Math.cos(tt * 0.8) * 15, 35 + Math.sin(tt * 1.2) * 10, 0, Math.PI * 2); c3.fill();
      c3.fillStyle = '#fff'; c3.font = '11px monospace';
      c3.fillText('REC: EARTH_STATION_4 // SATELLITE FEED', 12, 20);
      c3.fillText('BUFFER: 100% // NOISE REDUCTION ACTIVE', 12, h3 - 12);
    }
    lastFrame = ts;
    requestAnimationFrame(renderCanvases);
  }

  /* =====================================================================
   * CMO / Commander + Ground: shared rendering
   * ===================================================================== */
  var selectedId = null, signatures = {}, ackedFor = null, lastAlarmName = null;

  function sigChanged(key, data) {
    var s = JSON.stringify(data);
    if (signatures[key] === s) { return false; }
    signatures[key] = s; return true;
  }

  function renderCrew() {
    var grid = $('crewGrid'); if (!grid) { return; }
    var interactive = ROLE !== 'ground';
    grid.innerHTML = crewData.map(function (c) {
      var v = c.vitals;
      var tag = interactive ? 'button' : 'div';
      return '<' + tag + ' class="crew-card ' + (v.adi_level === 'ok' ? '' : v.adi_level) + (c.id === selectedId ? ' selected' : '') +
        '" data-crew="' + c.id + '" type="button">' + avatarHtml(c, 'sm') +
        '<span><strong>' + esc(c.short_name) + ' (' + esc(c.callsign) + ')</strong><br>' +
        '<span class="muted">HR: ' + v.heart_rate + ' BPM | Sleep Q: ' + v.sleep_quality + '%</span><br>' +
        '<span class="mono adi-' + v.adi_level + '">ADI: ' + v.adi_score.toFixed(2) + ' (' + esc(v.adi_label) + ')</span></span></' + tag + '>';
    }).join('') || '<span class="muted">No astronauts registered.</span>';
  }

  function renderProfileViewer() {
    var box = $('profileViewer'); if (!box) { return; }
    var c = crewData.filter(function (x) { return x.id === selectedId; })[0];
    if (!c) { box.innerHTML = '<span class="muted">Select a crew member above.</span>'; return; }
    var v = c.vitals, a = c.assessment;
    box.innerHTML = avatarHtml(c, 'lg') +
      '<div><h3>' + esc(c.name) + '</h3><div class="profile-sub">' + esc(c.callsign) + ' &middot; ID ' + esc(c.crew_id) + ' &middot; ' + esc(c.specialty) + '</div>' +
      '<div class="kv"><div><span>Heart rate</span>' + v.heart_rate + ' BPM</div><div><span>HRV</span>' + v.hrv + ' ms</div>' +
      '<div><span>SpO2</span>' + v.spo2 + '%</div><div><span>Voice jitter</span>' + v.voice_jitter.toFixed(1) + '%</div>' +
      '<div><span>Sleep quality</span>' + v.sleep_quality + '%</div>' +
      '<div><span>ADI</span><b class="adi-' + v.adi_level + '">' + v.adi_score.toFixed(2) + '</b></div></div>' +
      '<div class="muted" style="margin-top:10px">AI screening: <span class="sev-pill ' + esc(a.severity) + '">' + esc(a.severity) + '</span> ' + esc(a.condition) + '</div></div>';
  }

  function renderAssessments() {
    var list = $('assessList'); if (!list) { return; }
    var order = { critical: 3, high: 2, moderate: 1, low: 0 };
    var items = crewData.slice().sort(function (a, b) { return order[b.assessment.severity] - order[a.assessment.severity]; });
    list.innerHTML = items.map(function (c) {
      var a = c.assessment;
      var recs = a.recommendations.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('');
      var review = (ROLE === 'ground') ? '' : (a.reviewed ? '<span class="muted">&#10003; Reviewed</span>'
        : '<button class="ares-tab-btn" data-review="' + a.id + '" type="button">Mark reviewed</button>');
      return '<div class="assess-card sev-' + esc(a.severity) + '"><div class="ctrl-row">' +
        '<span><strong>' + esc(c.short_name) + '</strong> <span class="muted">' + esc(c.callsign) + '</span></span>' +
        '<span class="sev-pill ' + esc(a.severity) + '">' + esc(a.severity) + '</span></div>' +
        '<h4>' + esc(a.condition) + '</h4>' +
        '<div class="muted">Confidence ' + Math.round(a.confidence * 100) + '% &middot; ADI ' + a.adi_score.toFixed(2) + '</div>' +
        '<div class="muted" style="margin-top:6px">' + esc(a.rationale) + '</div>' +
        '<div style="margin-top:8px;font-size:12px"><b>Suggested actions</b></div><ul>' + recs + '</ul>' +
        '<div style="margin-top:8px">' + review + '</div></div>';
    }).join('') || '<span class="muted">No astronauts registered.</span>';
  }

  function renderAlarm(alarm) {
    var banner = $('cmoAlarmBanner'); if (!banner) { return; }
    var state = $('cmoAlarmState');
    if (!alarm) { banner.hidden = true; ackedFor = null; lastAlarmName = null; if (state) { state.textContent = 'ACTIVE MONITORING'; } return; }
    $('cmoAlarmText').textContent = '⚠️ ALARM: CREW MEMBER ' + alarm.name.toUpperCase() + ' ADI ' + alarm.adi.toFixed(2) + ' - HIGH RISK';
    banner.hidden = (ackedFor === alarm.name);
    if (state) { state.textContent = 'ALARM ' + alarm.name.toUpperCase(); }
    if (lastAlarmName !== alarm.name) {
      Narrator.say('Alarm. ' + alarm.name + ' distress index is ' + alarm.adi.toFixed(2) + ', above the safe threshold.');
      lastAlarmName = alarm.name;
    }
  }

  function pollCrew() {
    api('/api/crew-status/').then(function (d) {
      if (!d.crew) { return; }
      crewData = d.crew;
      if (selectedId == null && crewData.length) { selectedId = crewData[0].id; }
      renderCrew(); renderProfileViewer();
      if (sigChanged('assess', crewData.map(function (c) { return c.assessment; }))) { renderAssessments(); }
      renderAlarm(d.alarm);
    });
  }

  /* ---------------- ground calls ---------------- */
  function fmtTime(iso) { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function callHtml(c, forGround) {
    var timer = c.status === 'in_progress' ? ' <span class="live-timer" data-since="' + esc(c.updated_at) + '"></span>' : '';
    var body = '<div class="ctrl-row"><span><strong>#' + c.id + '</strong> &middot; ' + esc(c.priority_label) + ' &middot; ' + esc(c.reason) + '</span>' +
      '<span class="status-pill ' + esc(c.status) + '">' + esc(c.status_label) + '</span></div>' +
      '<div class="muted" style="margin-top:4px">' + fmtTime(c.created_at) + ' &middot; from ' + esc(c.raised_by) +
      (c.subject ? ' &middot; patient ' + esc(c.subject) : '') + timer + '</div>' +
      (c.message ? '<div style="margin-top:6px">' + esc(c.message) + '</div>' : '') +
      (c.ground_response ? '<div style="margin-top:6px;color:var(--primary)"><b>Ground:</b> ' + esc(c.ground_response) + '</div>' : '');
    if (forGround) {
      body += '<div style="display:grid;gap:6px;margin-top:8px"><textarea class="field" data-resp="' + c.id + '" placeholder="Advice / instructions for the crew...">' + esc(c.ground_response) + '</textarea>' +
        '<div class="upload-row"><select class="field" data-stat="' + c.id + '">' +
        ['requested', 'acknowledged', 'in_progress', 'resolved'].map(function (s) {
          return '<option value="' + s + '"' + (s === c.status ? ' selected' : '') + '>' + s.replace('_', ' ') + '</option>';
        }).join('') + '</select><button class="ares-tab-btn is-active" data-save="' + c.id + '" type="button">Send</button></div></div>';
    }
    return '<div class="call-card prio-' + esc(c.priority) + '">' + body + '</div>';
  }
  function renderCalls() {
    var list = $('callList') || $('gndCallList'); if (!list) { return; }
    var gnd = ROLE === 'ground';
    if (gnd && list.contains(document.activeElement)) { return; }      // don't wipe what the operator is typing
    list.innerHTML = callData.length ? callData.map(function (c) { return callHtml(c, gnd); }).join('') : '<span class="muted">No calls yet.</span>';
    if (gnd) { $('gndOpenCount').textContent = callData.filter(function (c) { return c.status !== 'resolved'; }).length; }
  }
  var knownCallIds = null;
  function pollCalls() {
    api('/api/ground-calls/').then(function (d) {
      if (!d.calls) { return; }
      callData = d.calls;
      if (ROLE === 'ground' && knownCallIds) {
        d.calls.forEach(function (c) { if (knownCallIds.indexOf(c.id) === -1) { Narrator.say('New ' + c.priority_label + ' support call from ' + c.raised_by + '.'); } });
      }
      knownCallIds = d.calls.map(function (c) { return c.id; });
      if (sigChanged('calls', callData)) { renderCalls(); }
    });
  }
  setInterval(function () {                      // live call timers
    document.querySelectorAll('.live-timer').forEach(function (el) {
      var s = Math.max(0, Math.floor((Date.now() - new Date(el.dataset.since).getTime()) / 1000));
      el.textContent = '● LIVE ' + String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    });
  }, 1000);

  /* ---------------- CMO specific ---------------- */
  function initCmo() {
    $('crewGrid').addEventListener('click', function (e) {
      var card = e.target.closest('[data-crew]'); if (!card) { return; }
      selectedId = parseInt(card.dataset.crew, 10);
      renderCrew(); renderProfileViewer();
      var tgt = $('etpTarget'); if (tgt) { tgt.value = String(selectedId); }
      var subj = $('callSubject'); if (subj) { subj.value = String(selectedId); }
    });
    $('ackAlarmBtn').addEventListener('click', function () {
      var m = $('cmoAlarmText').textContent.match(/MEMBER (.*) ADI/);
      ackedFor = null;
      crewData.forEach(function (c) { if (m && c.short_name.toUpperCase() === m[1]) { ackedFor = c.short_name; } });
      $('cmoAlarmBanner').hidden = true;
    });
    $('assessList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-review]'); if (!b) { return; }
      api('/api/assessment/' + b.dataset.review + '/review/', { method: 'POST', body: {} }).then(pollCrew);
    });

    // ground call (Point 7)
    $('callGroundBtn').addEventListener('click', function () {
      var st = $('callStatus'); st.className = 'status-msg'; st.textContent = 'Contacting ground...';
      api('/api/ground-call/', { body: {
        reason: $('callReason').value, subject: $('callSubject').value || null,
        priority: $('callPriority').value, message: $('callMessage').value
      } }).then(function (r) {
        st.className = 'status-msg ' + (r.status === 'success' ? 'ok' : 'err');
        st.textContent = r.status === 'success' ? 'Call request #' + r.call.id + ' sent to Mission Control.' : (r.message || 'Failed.');
        if (r.status === 'success') { $('callMessage').value = ''; pollCalls(); }
      });
    });

    // override protocol (Point 3)
    var verified = false;
    var verifyBtn = $('btnVerifyKeys'), execBtn = $('btnEtpExecute'), status = $('etpStatus');
    var checks = document.querySelectorAll('.chk-restraint');
    function lock() {
      verified = false; execBtn.disabled = true;
      execBtn.textContent = 'EXECUTE ETP & SEDATIVE DEPLOYMENT (LOCKED)';
      var ready = Array.prototype.every.call(checks, function (c) { return c.checked; }) &&
        $('captainCode').value.trim() && $('cmoCode').value.trim();
      verifyBtn.disabled = !ready;
    }
    ['captainCode', 'cmoCode'].forEach(function (id) { $(id).addEventListener('input', lock); });
    Array.prototype.forEach.call(checks, function (c) { c.addEventListener('change', lock); });
    ['etpTarget', 'tranqSelect'].forEach(function (id) { $(id).addEventListener('change', lock); });

    function payload() {
      return { target: $('etpTarget').value, agent: $('tranqSelect').value, checklist_ok: true,
        captain_code: $('captainCode').value.trim(), cmo_code: $('cmoCode').value.trim() };
    }
    function auditRow(stage, ok) {
      var tb = document.querySelector('#auditTable tbody'), tr = document.createElement('tr');
      var tgt = $('etpTarget').selectedOptions[0].textContent.replace(/ \(.*/, '');
      tr.innerHTML = '<td>' + new Date().toLocaleTimeString() + '</td><td>' + esc(BOOT.me.short_name) + '</td><td>' + esc(tgt) +
        '</td><td>' + stage + '</td><td class="' + (ok ? 'ok-text' : 'fail-text') + '">' + (ok ? 'OK' : 'FAIL') + '</td>';
      tb.insertBefore(tr, tb.firstChild);
    }
    verifyBtn.addEventListener('click', function () {
      status.className = 'status-msg'; status.textContent = 'Verifying keys...';
      api('/api/verify-override/', { body: payload() }).then(function (r) {
        auditRow('verify', !!r.authorized);
        if (r.authorized) {
          verified = true; execBtn.disabled = false;
          execBtn.textContent = 'EXECUTE TRANQUILIZER (DUAL-KEY MATCHED)';
          status.className = 'status-msg ok'; status.textContent = r.message;
        } else {
          status.className = 'status-msg err'; status.textContent = r.message || 'Denied.';
          $('captainCode').value = ''; $('cmoCode').value = ''; lock();
        }
      });
    });
    execBtn.addEventListener('click', function () {
      if (!verified) { return; }
      var t = $('etpTarget').selectedOptions[0].textContent;
      if (!window.confirm('FINAL CONFIRMATION\n\nAuthorise ' + $('tranqSelect').value + ' for ' + t + '?')) { return; }
      api('/api/execute-etp/', { body: payload() }).then(function (r) {
        auditRow('execute', r.status === 'success');
        status.className = 'status-msg ' + (r.status === 'success' ? 'ok' : 'err');
        status.textContent = r.message || 'Denied.';
        $('captainCode').value = ''; $('cmoCode').value = '';
        Array.prototype.forEach.call(checks, function (c) { c.checked = false; });
        lock();
      });
    });
    lock();
    pollCrew(); pollCalls();
    setInterval(pollCrew, 4000); setInterval(pollCalls, 5000);
  }

  /* ---------------- Ground specific ---------------- */
  function initGround() {
    $('gndCallList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-save]'); if (!b) { return; }
      var id = b.dataset.save;
      api('/api/ground-call/' + id + '/update/', { body: {
        status: document.querySelector('[data-stat="' + id + '"]').value,
        response: document.querySelector('[data-resp="' + id + '"]').value
      } }).then(function () { signatures.calls = null; pollCalls(); });
    });
    pollCrew(); pollCalls();
    setInterval(pollCrew, 4000); setInterval(pollCalls, 5000);
  }

  /* ---------------- boot ---------------- */
  if (ROLE === 'astronaut') { initPod(); }
  else if (ROLE === 'ground') { initGround(); }
  else { initCmo(); }
})();
