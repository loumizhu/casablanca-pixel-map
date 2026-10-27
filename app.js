/**
 * Tiny Casablanca — Web Application Logic
 * Powered by OpenSeadragon & Moroccan Geometric Telemetry
 */

import { PROJECTION_CONFIG, LANDMARKS, latLonToScreen, screenToLatLon } from './src/projection.js';

// Application State
const state = {
  viewer: null,
  currentTheme: 'day', // 'day', 'sunset', 'night'
  audioEnabled: false,
  audioContext: null,
  gridVisible: false,
  activeLandmark: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initViewer();
  initDrawer();
  initControls();
  initModals();
});

/**
 * Initialize OpenSeadragon Viewer
 */
function initViewer() {
  const isHttp = window.location.protocol.startsWith('http');
  
  // Configure OpenSeadragon tile source
  // If running via HTTP/HTTPS (GitHub Pages or dev server), use DZI pyramid
  // If running via file:// protocol, fall back to master composite PNG to prevent CORS XML errors
  const tileSource = isHttp ? 'tiles/casablanca.dzi' : {
    type: 'image',
    url: 'assets/composite/casablanca_downtown_master.png',
    buildPyramid: false
  };

  state.viewer = OpenSeadragon({
    id: 'openseadragon-viewer',
    prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/images/',
    tileSources: tileSource,
    animationTime: 0.8,
    blendTime: 0.15,
    constrainDuringPan: true,
    maxZoomPixelRatio: 3.5, // Allow zooming in close to see raw pixels
    minZoomLevel: 0.6,
    defaultZoomLevel: 1.15,
    visibilityRatio: 0.9,
    showNavigationControl: false, // We use custom cyber-retro controls
    showNavigator: false,        // We use our custom HUD radar
    gestureSettingsMouse: {
      clickToZoom: false,
      dblClickToZoom: true
    }
  });

  state.viewer.addHandler('open', () => {
    console.log("Tiny Casablanca map loaded successfully.");
    addLandmarkPins();
    updateTelemetry();
    updateMinimap();
    
    // Smoothly pan to central Place des Nations Unies on startup
    const nationsUnies = LANDMARKS.find(l => l.id === 'place_des_nations_unies');
    if (nationsUnies) {
      flyToLandmark(nationsUnies, false);
    }
  });

  state.viewer.addHandler('animation', () => {
    updateTelemetry();
    updateMinimap();
  });

  // Track mouse coordinates over canvas for real-time WGS84 HUD
  const tracker = new OpenSeadragon.MouseTracker({
    element: state.viewer.element,
    moveHandler: (event) => {
      if (!state.viewer.viewport) return;
      const webPoint = event.position;
      const viewportPoint = state.viewer.viewport.pointFromPixel(webPoint);
      const imagePoint = state.viewer.viewport.viewportToImageCoordinates(viewportPoint);
      
      const { lat, lon } = screenToLatLon(imagePoint.x, imagePoint.y);
      const coordEl = document.getElementById('coord-display');
      if (coordEl) {
        coordEl.textContent = `${lat.toFixed(4)}° N, ${Math.abs(lon).toFixed(4)}° W`;
      }
    }
  });
  tracker.setTracking(true);
}

/**
 * Add Interactive Landmark Pins on the Map Overlay
 */
function addLandmarkPins() {
  LANDMARKS.forEach(landmark => {
    const screenCoord = latLonToScreen(landmark.lat, landmark.lon);
    
    // Create DOM element for pin
    const pin = document.createElement('div');
    pin.className = 'map-pin';
    pin.id = `pin-${landmark.id}`;
    pin.innerHTML = `
      <div class="pin-bubble">
        <span class="pin-icon">${landmark.icon}</span>
        <span class="pin-text">${landmark.name}</span>
      </div>
      <div class="pin-marker"></div>
    `;

    // Click handler to open landmark modal
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      openLandmarkModal(landmark);
      playClickSound();
    });

    // Add overlay to OpenSeadragon
    const viewportPoint = state.viewer.viewport.imageToViewportCoordinates(
      new OpenSeadragon.Point(screenCoord.x, screenCoord.y)
    );

    state.viewer.addOverlay({
      element: pin,
      location: viewportPoint,
      placement: OpenSeadragon.Placement.BOTTOM
    });
  });
}

/**
 * Populate and handle the Landmark Drawer
 */
function initDrawer() {
  const listEl = document.getElementById('landmark-list');
  const searchInput = document.getElementById('landmark-search');
  const toggleBtn = document.getElementById('btn-toggle-drawer');
  const drawer = document.getElementById('landmark-drawer');

  // Render items
  function renderList(filter = '') {
    listEl.innerHTML = '';
    const filtered = LANDMARKS.filter(l => 
      l.name.toLowerCase().includes(filter.toLowerCase()) ||
      l.nameAr.includes(filter) ||
      l.desc.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(landmark => {
      const item = document.createElement('div');
      item.className = 'landmark-item';
      item.innerHTML = `
        <div class="landmark-item-icon">${landmark.icon}</div>
        <div class="landmark-item-info">
          <div class="landmark-item-title">${landmark.name}</div>
          <div class="landmark-item-sub">${landmark.nameAr} • ${landmark.type}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        flyToLandmark(landmark, true);
        openLandmarkModal(landmark);
        playClickSound();
      });

      listEl.appendChild(item);
    });
  }

  renderList();

  // Search input
  searchInput.addEventListener('input', (e) => {
    renderList(e.target.value);
  });

  // Toggle drawer collapse
  toggleBtn.addEventListener('click', () => {
    drawer.classList.toggle('collapsed');
    toggleBtn.textContent = drawer.classList.contains('collapsed') ? '▶' : '◀';
    playClickSound();
  });
}

/**
 * Fly smoothly to a landmark
 */
function flyToLandmark(landmark, animate = true) {
  const coord = latLonToScreen(landmark.lat, landmark.lon);
  const viewportPoint = state.viewer.viewport.imageToViewportCoordinates(
    new OpenSeadragon.Point(coord.x, coord.y)
  );

  state.viewer.viewport.panTo(viewportPoint, !animate);
  state.viewer.viewport.zoomTo(2.2, viewportPoint, !animate);
}

/**
 * Update Top Telemetry Bar & HUD
 */
function updateTelemetry() {
  if (!state.viewer.viewport) return;
  const zoom = state.viewer.viewport.getZoom(true);
  const zoomEl = document.getElementById('zoom-display');
  if (zoomEl) {
    zoomEl.textContent = `${zoom.toFixed(2)}x`;
  }
}

/**
 * Update Custom Minimap Radar
 */
function updateMinimap() {
  if (!state.viewer.viewport) return;
  const bounds = state.viewer.viewport.getBounds(true);
  const minimapBox = document.getElementById('minimap-viewport');
  if (!minimapBox) return;

  // Convert OpenSeadragon viewport coordinates (0 to 1 width) to percentages
  const left = Math.max(0, Math.min(100, bounds.x * 100));
  const top = Math.max(0, Math.min(100, bounds.y * 100));
  const width = Math.max(5, Math.min(100, bounds.width * 100));
  const height = Math.max(5, Math.min(100, bounds.height * 100));

  minimapBox.style.left = `${left}%`;
  minimapBox.style.top = `${top}%`;
  minimapBox.style.width = `${width}%`;
  minimapBox.style.height = `${height}%`;
}

/**
 * Controls & Buttons Setup
 */
function initControls() {
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    state.viewer.viewport.zoomBy(1.3);
    state.viewer.viewport.applyConstraints();
    playClickSound();
  });

  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    state.viewer.viewport.zoomBy(0.75);
    state.viewer.viewport.applyConstraints();
    playClickSound();
  });

  document.getElementById('btn-home')?.addEventListener('click', () => {
    const nationsUnies = LANDMARKS.find(l => l.id === 'place_des_nations_unies');
    if (nationsUnies) flyToLandmark(nationsUnies, true);
    playClickSound();
  });

  document.getElementById('btn-grid')?.addEventListener('click', () => {
    state.gridVisible = !state.gridVisible;
    document.getElementById('pixel-grid-overlay')?.classList.toggle('hidden', !state.gridVisible);
    playClickSound();
  });

  document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    playClickSound();
  });

  // Day / Sunset / Night Theme Toggle
  const themeBtn = document.getElementById('btn-theme-toggle');
  themeBtn?.addEventListener('click', () => {
    const themes = ['day', 'sunset', 'night'];
    const icons = { day: '☀️', sunset: '🌇', night: '🌙' };
    const names = { day: 'Day', sunset: 'Sunset', night: 'Night' };

    const nextIndex = (themes.indexOf(state.currentTheme) + 1) % themes.length;
    state.currentTheme = themes[nextIndex];

    document.body.className = `theme-${state.currentTheme}`;
    themeBtn.querySelector('.btn-icon').textContent = icons[state.currentTheme];
    themeBtn.querySelector('.btn-text').textContent = names[state.currentTheme];
    playClickSound();
  });

  // Ambient Soundscape Toggle
  const audioBtn = document.getElementById('btn-audio');
  audioBtn?.addEventListener('click', () => {
    toggleAmbientSound();
    audioBtn.querySelector('.btn-icon').textContent = state.audioEnabled ? '🔊' : '🔇';
    audioBtn.querySelector('.btn-text').textContent = state.audioEnabled ? 'Audio On' : 'Audio Off';
    playClickSound();
  });
}

/**
 * Landmark Details Modal & Info Modal
 */
function initModals() {
  const landmarkModal = document.getElementById('landmark-modal');
  const infoModal = document.getElementById('info-modal');

  document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    landmarkModal.classList.add('hidden');
    playClickSound();
  });

  document.getElementById('btn-info')?.addEventListener('click', () => {
    infoModal.classList.remove('hidden');
    playClickSound();
  });

  document.getElementById('btn-close-info')?.addEventListener('click', () => {
    infoModal.classList.add('hidden');
    playClickSound();
  });

  // Close modals on clicking overlay backdrop
  [landmarkModal, infoModal].forEach(m => {
    m?.addEventListener('click', (e) => {
      if (e.target === m) {
        m.classList.add('hidden');
      }
    });
  });

  document.getElementById('modal-fly-btn')?.addEventListener('click', () => {
    if (state.activeLandmark) {
      flyToLandmark(state.activeLandmark, true);
      landmarkModal.classList.add('hidden');
      playClickSound();
    }
  });

  // Keyboard Shortcuts: H (Home), G (Grid), F (Fullscreen), Esc (Close Modal)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      landmarkModal.classList.add('hidden');
      infoModal.classList.add('hidden');
    } else if (e.key === 'h' || e.key === 'H') {
      document.getElementById('btn-home')?.click();
    } else if (e.key === 'g' || e.key === 'G') {
      document.getElementById('btn-grid')?.click();
    } else if (e.key === 'f' || e.key === 'F') {
      document.getElementById('btn-fullscreen')?.click();
    }
  });
}

function openLandmarkModal(landmark) {
  state.activeLandmark = landmark;
  const modal = document.getElementById('landmark-modal');
  
  // Set details
  document.getElementById('modal-title').textContent = landmark.name;
  document.getElementById('modal-title-ar').textContent = landmark.nameAr;
  document.getElementById('modal-desc').textContent = landmark.desc;
  document.getElementById('modal-type').textContent = landmark.type;
  document.getElementById('modal-year').textContent = landmark.year || 'Historic';
  
  // Set preview image
  const imgEl = document.getElementById('modal-img');
  const tileMapping = {
    place_des_nations_unies: 'assets/pixel_tiles/place_des_nations_unies.jpg',
    tour_de_l_horloge: 'assets/pixel_tiles/tour_de_l_horloge.jpg',
    place_mohammed_v: 'assets/pixel_tiles/place_mohammed_v.jpg',
    wilaya_clock_tower: 'assets/pixel_tiles/place_mohammed_v.jpg',
    grand_theatre: 'assets/pixel_tiles/grand_theatre.jpg',
    bab_marrakech: 'assets/pixel_tiles/tour_de_l_horloge.jpg',
    marche_central: 'assets/pixel_tiles/boulevard_mohammed_v.jpg',
    boulevard_mohammed_v: 'assets/pixel_tiles/boulevard_mohammed_v.jpg'
  };
  imgEl.src = tileMapping[landmark.id] || 'assets/composite/casablanca_downtown_master.png';

  // Feature list
  const listEl = document.getElementById('modal-features-list');
  listEl.innerHTML = '';
  if (landmark.features) {
    landmark.features.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      listEl.appendChild(li);
    });
  }

  modal.classList.remove('hidden');
}

/**
 * Web Audio API Sound Generator (No external MP3 files needed)
 */
function playClickSound() {
  if (!state.audioEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {}
}

let ambientOsc = null;
let ambientGain = null;

function toggleAmbientSound() {
  state.audioEnabled = !state.audioEnabled;
  const ctx = getAudioContext();

  if (state.audioEnabled) {
    try {
      if (ctx.state === 'suspended') ctx.resume();
      
      // Ambient warm drone with gentle 8-bit pentatonic melody
      ambientGain = ctx.createGain();
      ambientGain.gain.setValueAtTime(0.03, ctx.currentTime);
      ambientGain.connect(ctx.destination);

      // Low warm pad
      const drone = ctx.createOscillator();
      drone.type = 'triangle';
      drone.frequency.setValueAtTime(110, ctx.currentTime); // A2
      drone.connect(ambientGain);
      drone.start();
      ambientOsc = drone;

      // Tramway chime interval every 12 seconds
      window.tramInterval = setInterval(() => {
        if (!state.audioEnabled) return;
        playTramwayChime();
      }, 12000);
    } catch (e) {}
  } else {
    try {
      if (ambientOsc) ambientOsc.stop();
      if (window.tramInterval) clearInterval(window.tramInterval);
    } catch (e) {}
  }
}

function playTramwayChime() {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch (e) {}
}

function getAudioContext() {
  if (!state.audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
  }
  return state.audioContext;
}
