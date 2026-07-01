/* d'Skills signature 3D moment: "The Ascent of a Build".
   A luminous low-poly spire that self-assembles as the camera spirals up
   from a blinking cursor at the base to a birdseye over the completed summit.
   High contrast, alive on load, scroll-scrubbed. Reduced-motion + mobile fallbacks. */
(function () {
  var canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') { return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 700px)').matches;
  var lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { canvas.style.display = 'none'; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5));

  var scene = new THREE.Scene();
  var NIGHT = new THREE.Color(0x0a0e1a);
  var DAWN = new THREE.Color(0x0c2622);
  scene.background = NIGHT.clone();
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.024);

  var camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
  camera.position.set(0, 2, 10);

  // lights
  scene.add(new THREE.AmbientLight(0x334155, 0.9));
  var key = new THREE.DirectionalLight(0xbfeee0, 1.1); key.position.set(6, 12, 8); scene.add(key);
  var rim = new THREE.DirectionalLight(0x8a7cff, 0.5); rim.position.set(-8, 4, -6); scene.add(rim);
  var glow = new THREE.PointLight(0x5ce0b8, 1.4, 40); glow.position.set(0, 6, 0); scene.add(glow);

  var ACCENT = 0x5ce0b8, VIOLET = 0x8a7cff;
  var TIERS = isMobile ? 6 : 9;
  var tierGap = 1.5;
  var topY = TIERS * tierGap;

  var spire = new THREE.Group();
  scene.add(spire);
  var tierGroups = [];

  // base grid
  var grid = new THREE.GridHelper(40, 40, 0x1c2a33, 0x141c24);
  grid.position.y = 0; scene.add(grid);

  // blinking cursor at base
  var cursor = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.9, 0.35),
    new THREE.MeshBasicMaterial({ color: ACCENT })
  );
  cursor.position.set(0, 0.6, 0); scene.add(cursor);

  // build the spire tiers (rings of blocks). Assembled progressively.
  for (var i = 0; i < TIERS; i++) {
    var g = new THREE.Group();
    g.position.y = i * tierGap + 1.2;
    var count = 3 + (i % 3);          // varies per tier
    var radius = 2.6 - i * (1.7 / TIERS); // taper toward the top
    for (var b = 0; b < count; b++) {
      var ang = (b / count) * Math.PI * 2 + i * 0.5;
      var w = 0.7 + Math.random() * 0.5;
      var h = 0.55 + Math.random() * 0.4;
      var geo = new THREE.BoxGeometry(w, h, w);
      var faceCol = (i === TIERS - 1) ? VIOLET : 0x16202b;
      var mat = new THREE.MeshStandardMaterial({ color: faceCol, roughness: 0.55, metalness: 0.2, emissive: (i === TIERS - 1) ? 0x2a2350 : 0x0a0f14, emissiveIntensity: 0.5 });
      var block = new THREE.Mesh(geo, mat);
      block.position.set(Math.cos(ang) * radius, 0, Math.sin(ang) * radius);
      // glowing edges
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.9 }));
      block.add(edges);
      g.add(block);
    }
    // central node per tier
    var node = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), new THREE.MeshBasicMaterial({ color: ACCENT }));
    g.add(node);
    g.scale.setScalar(0.001);
    spire.add(g); tierGroups.push(g);
  }

  // build-line: a glowing vertical bar that grows up the axis
  var lineMat = new THREE.MeshBasicMaterial({ color: ACCENT });
  var buildLine = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, topY, 8), lineMat);
  buildLine.position.set(0, 0, 0); buildLine.scale.y = 0.001; spire.add(buildLine);

  // starfield
  var starCount = isMobile ? 260 : 520;
  var sGeo = new THREE.BufferGeometry(); var sPos = new Float32Array(starCount * 3);
  for (var s = 0; s < starCount; s++) {
    sPos[s * 3] = (Math.random() - 0.5) * 90;
    sPos[s * 3 + 1] = Math.random() * 60 - 5;
    sPos[s * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  var stars = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xbcd3ff, size: 0.14, transparent: true, opacity: 0.85 }));
  scene.add(stars);

  // summit spark particles
  var spGeo = new THREE.BufferGeometry(); var spN = 90; var spPos = new Float32Array(spN * 3); var spVel = [];
  for (var p = 0; p < spN; p++) {
    spPos[p * 3] = 0; spPos[p * 3 + 1] = topY; spPos[p * 3 + 2] = 0;
    spVel.push([(Math.random() - 0.5) * 0.5, Math.random() * 0.6 + 0.1, (Math.random() - 0.5) * 0.5]);
  }
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  var sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ color: ACCENT, size: 0.22, transparent: true, opacity: 0 }));
  scene.add(sparks);

  function smoothstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function setCamera(t) {
    var finalAngle = -Math.PI / 2 + 0.62 * Math.PI * 1.7;
    if (t < 0.62) {
      var u = t / 0.62;
      var ang = -Math.PI / 2 + u * Math.PI * 1.7;
      var rad = lerp(13, 6, u);
      var hy = lerp(6, topY - 1.5, u);
      camera.position.set(Math.cos(ang) * rad, hy, Math.sin(ang) * rad);
      camera.lookAt(0, lerp(6.5, topY - 2, u), 0);
    } else {
      var v = (t - 0.62) / 0.38;
      var rad2 = lerp(5.6, 0.8, v);
      camera.position.set(Math.cos(finalAngle) * rad2, lerp(topY - 1.5, topY + 8, v), Math.sin(finalAngle) * rad2);
      camera.lookAt(0, lerp(topY * 0.85, topY - 1.5, v), 0);
    }
  }

  function applyProgress(t) {
    // The spire is fully built and glowing at rest (alive on load); scroll flies the camera up it.
    for (var i = 0; i < TIERS; i++) {
      tierGroups[i].scale.setScalar(1);
      tierGroups[i].position.y = (i * tierGap + 1.2);
    }
    buildLine.scale.y = 1;
    buildLine.position.y = topY / 2;
    // environment warms
    scene.background.copy(NIGHT).lerp(DAWN, smoothstep(0.2, 1, t));
    scene.fog.color.copy(scene.background);
    scene.fog.density = lerp(0.024, 0.01, t);
    stars.material.opacity = lerp(0.85, 0.05, smoothstep(0.3, 0.9, t));
    glow.position.y = lerp(3, topY, t);
    // cursor fades once building begins
    cursor.material.opacity = 1; cursor.material.transparent = true;
    cursor.visible = t < 0.08 ? true : (Math.sin(perf * 6) > -0.5);
    // sparks burst near summit
    var burst = smoothstep(0.82, 1, t);
    sparks.material.opacity = burst;
  }

  var target = 0, current = 0, perf = 0;
  function heroRange() { return Math.max(1, window.innerHeight * 1.6); }
  function onScroll() { target = Math.max(0, Math.min(1, window.scrollY / heroRange())); }
  window.addEventListener('scroll', onScroll, { passive: true });

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) loop(); });

  var clock = new THREE.Clock();
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    var dt = clock.getDelta(); perf += dt;
    current += (target - current) * 0.08;         // smoothed scrub
    applyProgress(current);
    setCamera(current);
    // idle life: gentle spire spin (stronger before scroll), star drift, cursor blink handled by perf
    spire.rotation.y += dt * (0.12 + (1 - current) * 0.12);
    grid.material.opacity = 1;
    stars.rotation.y += dt * 0.01;
    // spark motion when bursting
    if (sparks.material.opacity > 0.02) {
      var arr = spGeo.attributes.position.array;
      for (var p = 0; p < spN; p++) {
        arr[p * 3] += spVel[p][0] * dt * 6; arr[p * 3 + 1] += spVel[p][1] * dt * 6; arr[p * 3 + 2] += spVel[p][2] * dt * 6;
        if (arr[p * 3 + 1] > topY + 9) { arr[p * 3] = 0; arr[p * 3 + 1] = topY; arr[p * 3 + 2] = 0; }
      }
      spGeo.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }

  function renderStatic() {
    // completed spire, nice hero angle, no loop (reduced-motion)
    applyProgress(1);
    var ang = -Math.PI / 2 + 1.1;
    camera.position.set(Math.cos(ang) * 8, topY * 0.62, Math.sin(ang) * 8);
    camera.lookAt(0, topY * 0.5, 0);
    spire.rotation.y = 0.5;
    renderer.render(scene, camera);
  }

  function start() {
    resize(); onScroll();
    if (reduce) { renderStatic(); return; }
    loop();
  }

  // lazy init after first paint
  if ('requestIdleCallback' in window) { requestIdleCallback(start, { timeout: 500 }); }
  else { setTimeout(start, 60); }
})();
