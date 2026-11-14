import * as THREE from 'three';

// A renderer-independent sea set for the kit's paused, seekable scene engine.
// The surface follows the local Water.js examples' Fresnel/specular model and
// color-space output; the dome borrows Sky.js's direction-based horizon grade.
// The example Water class itself needs a renderer mirror pass and bundled normal
// maps, so this version keeps every input procedural and local.
// Keep the moon just above the voyage horizon so it stays in frame for both
// the shipboard and waterline cameras used in the opening sequence.
const defaultMoonDirection = new THREE.Vector3(.045, .08, .996).normalize();
// Daylight is aimed back across the camera-facing water so the surface reads
// with broken sun glints instead of a uniform dark slab.
const sunDirection = new THREE.Vector3(.32, .62, -.72).normalize();

function createMoonTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const base = ctx.createRadialGradient(96, 78, 14, 128, 128, 134);
  base.addColorStop(0, '#fbf7e9');
  base.addColorStop(.62, '#e5e5dc');
  base.addColorStop(1, '#aebdca');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 30; i++) {
    const x = 26 + ((i * 73 + 29) % 204);
    const y = 24 + ((i * 47 + 61) % 208);
    const radius = 4 + ((i * 13) % 15);
    const dx = (x - 128) / 118, dy = (y - 128) / 118;
    if (dx * dx + dy * dy > .82) continue;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99,111,121,${.035 + (i % 5) * .012})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - radius * .12, y - radius * .13, radius * .82, .1, Math.PI * 1.35);
    ctx.strokeStyle = 'rgba(255,255,245,.16)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createMoonGlowTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const glow = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
  glow.addColorStop(0, 'rgba(210,226,249,.30)');
  glow.addColorStop(.22, 'rgba(165,193,230,.17)');
  glow.addColorStop(1, 'rgba(120,158,207,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const skyVertex = `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = `
  uniform float time;
  uniform float daylight;
  uniform float moonVisible;
  uniform float cloudCoverage;
  uniform vec3 moonDir;
  varying vec3 vDirection;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    return .58 * noise2(p) + .28 * noise2(p * 2.03 + 7.1) + .14 * noise2(p * 4.07 - 3.2);
  }
  float hash31(vec3 p) {
    p = fract(p * vec3(.1031, .1030, .0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float x00 = mix(hash31(i), hash31(i + vec3(1.0,0.0,0.0)), f.x);
    float x10 = mix(hash31(i + vec3(0.0,1.0,0.0)), hash31(i + vec3(1.0,1.0,0.0)), f.x);
    float x01 = mix(hash31(i + vec3(0.0,0.0,1.0)), hash31(i + vec3(1.0,0.0,1.0)), f.x);
    float x11 = mix(hash31(i + vec3(0.0,1.0,1.0)), hash31(i + vec3(1.0,1.0,1.0)), f.x);
    return mix(mix(x00,x10,f.y),mix(x01,x11,f.y),f.z);
  }
  float cloudFbm(vec3 p) {
    return .62 * noise3(p) + .27 * noise3(p * 2.02 + 8.7) + .11 * noise3(p * 4.03 - 5.1);
  }
  void main() {
    vec3 d = normalize(vDirection);
    float h = smoothstep(-.12, .88, d.y);
    vec3 nightHorizon = vec3(.032, .064, .105);
    vec3 nightZenith = vec3(.0035, .008, .022);
    vec3 dayHorizon = vec3(.47, .61, .70);
    vec3 dayZenith = vec3(.15, .36, .58);
    vec3 sky = mix(mix(nightHorizon, nightZenith, h), mix(dayHorizon, dayZenith, h), daylight);

    vec3 cloudPoint = d * vec3(7.0, 11.0, 7.0) + vec3(time * .012, time * .0015, -time * .006);
    float cloudShape = cloudFbm(cloudPoint);
    float cloudDetail = cloudFbm(cloudPoint * 1.72 + 13.2);
    float cloudField = cloudShape * .78 + cloudDetail * .22;
    float cloud = smoothstep(.46, .66, cloudField);
    float highCloudField = cloudFbm(d * vec3(13.0, 5.5, 13.0) + vec3(-time * .008, time * .002, time * .004));
    float highCloud = smoothstep(.58, .74, highCloudField);
    float horizonCloudBand = smoothstep(-.08, .045, d.y) * (1.0 - smoothstep(.42, .72, d.y));
    float cloudAlpha = max(cloud * horizonCloudBand, highCloud * smoothstep(.02, .20, d.y) * .42)
                     * mix(.62, .70, daylight) * cloudCoverage;
    vec3 cloudColor = mix(vec3(.095, .135, .19), vec3(.88, .92, .95), daylight);
    sky = mix(sky, cloudColor, cloudAlpha);

    float moonDot = max(dot(d, moonDir), 0.0);
    float moon = smoothstep(.99984, .99994, moonDot) * (1.0 - daylight);
    float halo = exp(-(1.0 - moonDot) * 200.0) * (1.0 - daylight);
    sky += (vec3(.86, .91, 1.0) * moon + vec3(.22, .31, .46) * halo) * moonVisible;

    vec2 starCell = floor(d.xz * 82.0);
    vec2 starLocal = fract(d.xz * 82.0) - .5;
    float starSeed = hash21(starCell);
    vec2 starOffset = vec2(hash21(starCell + 19.7), hash21(starCell + 47.2)) * .72 - .36;
    float star = (1.0 - smoothstep(.012, .052, length(starLocal - starOffset)))
               * step(.989, starSeed) * smoothstep(.06, .22, d.y) * (1.0 - daylight);
    sky += vec3(.46, .57, .76) * star * (.48 + .52 * hash21(starCell + 3.0)) * (1.0 - cloudAlpha);

    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const waterVertex = `
  uniform float time;
  varying vec3 vWorld;
  void main() {
    vec3 p = position;
    vec2 q = p.xz;
    p.y -= .14;
    // Broad swell stays visible at ship scale; the finer waves are carried by
    // the fragment normal below so resolution does not erase the water texture.
    p.y += .48 * sin(dot(q, vec2(.035, .013)) + time * .48);
    p.y += .23 * sin(dot(q, vec2(-.016, .047)) - time * .34);
    p.y += .075 * sin(dot(q, vec2(.11, .075)) + time * .78);
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const waterFragment = `
  uniform float time;
  uniform float daylight;
  uniform vec3 moonDir;
  varying vec3 vWorld;
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    vec2 q = vWorld.xz;
    float a = dot(q, vec2(.035, .013)) + time * .48;
    float b = dot(q, vec2(-.016, .047)) - time * .34;
    float c = dot(q, vec2(.11, .075)) + time * .78;
    float microA = dot(q, vec2(.72, .31)) + time * 1.34;
    float microB = dot(q, vec2(-.43, .91)) - time * 1.08;
    float microC = dot(q, vec2(1.37, -.82)) + time * .71;
    // Short cross-wind ripples break up the broad swell in the specular
    // response. Their phases come only from world position and sampled time,
    // so arbitrary frame seeks remain deterministic.
    float microD = dot(q, vec2(.91, 1.44)) + time * 1.73;
    float microE = dot(q, vec2(-1.62, .58)) - time * 1.21;
    float microF = dot(q, vec2(2.15, -1.08)) + time * 1.37;
    float dx = .48 * .035 * cos(a) + .23 * -.016 * cos(b) + .075 * .11 * cos(c)
             + .036 * .72 * cos(microA) + .026 * -.43 * cos(microB) + .011 * 1.37 * cos(microC)
             + .022 * .91 * cos(microD) + .016 * -1.62 * cos(microE) + .010 * 2.15 * cos(microF);
    float dz = .48 * .013 * cos(a) + .23 * .047 * cos(b) + .075 * .075 * cos(c)
             + .036 * .31 * cos(microA) + .026 * .91 * cos(microB) + .011 * -.82 * cos(microC)
             + .022 * 1.44 * cos(microD) + .016 * .58 * cos(microE) + .010 * -1.08 * cos(microF);
    vec3 n = normalize(vec3(-dx, 1.0, -dz));
    vec3 v = normalize(cameraPosition - vWorld);
    vec3 lightDir = normalize(moonDir);
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 4.0);
    float diffuse = max(dot(n, lightDir), 0.0);
    float reflection = max(dot(reflect(-lightDir, n), v), 0.0);
    float broadGlint = pow(reflection, 20.0);
    float sharpGlint = pow(reflection, 74.0);
    float glintNoise = noise2(q * .095 + time * .012) * .55
                     + noise2(q * .29 - vec2(time * .028, time * .019)) * .30
                     + noise2(q * .84 + vec2(time * .051, -time * .037)) * .15;
    // Water.js combines a rough normal, Fresnel reflection and a directional
    // specular highlight. Here the mirror pass is intentionally omitted, so
    // these irregular, scale-mixed masks give the moon glint a broken water
    // surface instead of a continuous stripe or a flat blue sheen.
    float brokenLight = smoothstep(.39, .72, glintNoise);
    float ripple = .5 + .5 * (sin(microA) * .36 + sin(microB) * .22 + sin(microC) * .10
                            + sin(microD) * .14 + sin(microE) * .11 + sin(microF) * .07);
    float surfaceVariation = noise2(q * .068 + vec2(time * .006, -time * .004));

    vec3 nightDeep = vec3(.016, .038, .067);
    vec3 nightReflected = vec3(.074, .165, .225);
    vec3 dayDeep = vec3(.035, .16, .23);
    vec3 dayReflected = vec3(.19, .42, .49);
    vec3 deep = mix(nightDeep, dayDeep, daylight);
    vec3 reflected = mix(nightReflected, dayReflected, daylight);
    vec3 col = mix(deep, reflected, (.025 + fresnel * .88)) * (.86 + surfaceVariation * .20);
    col += mix(vec3(.025, .048, .078), vec3(.12, .17, .16), daylight) * diffuse * .30;
    col += mix(vec3(.52, .67, .86), vec3(.9, .94, .88), daylight)
         * (broadGlint * .24 + sharpGlint * .84) * brokenLight * (.42 + ripple * .58);

    float distanceToCamera = length(cameraPosition - vWorld);
    float horizon = smoothstep(950.0, 2450.0, distanceToCamera);
    vec3 nightHorizon = vec3(.032, .064, .105);
    vec3 dayHorizon = vec3(.47, .61, .70);
    col = mix(col, mix(nightHorizon, dayHorizon, daylight), horizon * .78);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createOceanVisuals({variant = 'night', withSky = true, moonDirection: configuredMoonDirection, waterLevel, moonVisible = true, cloudCoverage = 1} = {}) {
  const daylight = variant === 'day' ? 1 : 0;
  const moonDirection = Array.isArray(configuredMoonDirection) && configuredMoonDirection.length === 3
    ? new THREE.Vector3(...configuredMoonDirection).normalize()
    : defaultMoonDirection;
  const lightDirection = daylight ? sunDirection : moonDirection;
  const root = new THREE.Group();
  root.name = `period-ocean-${variant}`;

  if (withSky) {
    const dome = new THREE.Mesh(
      // Keep every point inside composition's 2000m far plane, even from a
      // shipboard camera near the edge of the set. Otherwise the dome clips.
      new THREE.SphereGeometry(1200, 96, 64),
      new THREE.ShaderMaterial({
        uniforms: {time: {value: 0}, daylight: {value: daylight}, moonDir: {value: lightDirection},moonVisible:{value:moonVisible?1:0},cloudCoverage:{value:THREE.MathUtils.clamp(cloudCoverage,0,1)}},
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: true
      })
    );
    dome.name = 'atmosphere-clouds-moon';
    dome.frustumCulled = false;
    dome.renderOrder = -2;
    root.add(dome);
  }

  const waterGeometry = new THREE.PlaneGeometry(4800, 4800, 192, 192);
  waterGeometry.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(
    waterGeometry,
    new THREE.ShaderMaterial({
      uniforms: {time: {value: 0}, daylight: {value: daylight}, moonDir: {value: lightDirection}},
      vertexShader: waterVertex,
      fragmentShader: waterFragment,
      toneMapped: true
    })
  );
  water.name = 'procedural-atlantic-surface';
  if (Number.isFinite(waterLevel)) water.position.y = waterLevel;
  water.frustumCulled = false;
  water.receiveShadow = true;
  root.add(water);

  const skyFill = new THREE.DirectionalLight(daylight ? '#fff2d1' : '#91abc6', daylight ? .58 : .32);
  skyFill.name = daylight ? 'sunlight-water-fill' : moonVisible ? 'moonlight-fill' : 'illustrative-night-fill';
  skyFill.position.copy(lightDirection).multiplyScalar(80);
  skyFill.target.position.set(0, 0, 0);
  skyFill.castShadow = false;
  root.add(skyFill, skyFill.target);

  if (!daylight && moonVisible) {
    const moon = new THREE.Group();
    moon.name = 'visible-moon-and-halo';
    moon.position.copy(lightDirection).multiplyScalar(920);
    const glowMap = createMoonGlowTexture();
    if (glowMap) {
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowMap, color: '#c6d9f5', opacity: .62, transparent: true,
        depthWrite: false, toneMapped: false
      }));
      glow.name = 'moon-atmospheric-halo';
      glow.scale.set(148, 148, 1);
      moon.add(glow);
    }
    const disc = new THREE.Mesh(
      new THREE.SphereGeometry(22, 48, 32),
      new THREE.MeshBasicMaterial({map: createMoonTexture(), color: '#ffffff', toneMapped: false})
    );
    disc.name = 'moon-disc';
    disc.renderOrder = 3;
    moon.add(disc);
    root.add(moon);
  }

  root.userData.sample = (t) => {
    const time = water.material.uniforms.time;
    time.value = t;
    const skyTime = root.children.find(child => child.name === 'atmosphere-clouds-moon')?.material.uniforms.time;
    if (skyTime) skyTime.value = t;
  };
  root.userData.sample(0);
  return root;
}
