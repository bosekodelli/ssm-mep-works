// SSV MEP WORKS - Interactive 3D BIM Canvas Scroll & Web Application (High-Resolution Version)

// Configuration & Constants
const TOTAL_FRAMES = 240;
const FRAME_PREFIX = '/ezgif-frame-';
const FRAME_EXTENSION = '.jpg';

// State Variables
const images = [];
let loadedFramesCount = 0;
let currentFrameFloat = 0;
let targetFrameIndex = 0;
let isAudioEnabled = false;

// DOM Elements
const canvas = document.getElementById('bim-canvas');
const ctx = canvas ? canvas.getContext('2d', { alpha: false, desynchronized: true }) : null;
const preloader = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloader-bar');
const preloaderCount = document.getElementById('preloader-count');
const preloaderPercent = document.getElementById('preloader-percent');
const preloaderStatus = document.getElementById('preloader-status');
const scrollWrapper = document.getElementById('scroll-wrapper');
const timelineSteps = document.querySelectorAll('.timeline-step');
const mainCalloutPanel = document.getElementById('main-callout-panel');

// Hotspot Pins
const pinHvac = document.getElementById('pin-hvac');
const pinElec = document.getElementById('pin-elec');
const pinPlumb = document.getElementById('pin-plumb');

// Web Audio API Context
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTechTone(freq = 440, duration = 0.08) {
  if (!isAudioEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error('Audio error:', e);
  }
}

// 1. Frame Path Generator
function getFrameUrl(index) {
  const paddedNumber = String(index).padStart(3, '0');
  return `${FRAME_PREFIX}${paddedNumber}${FRAME_EXTENSION}`;
}

// 2. Preload 240 Image Frames with GPU Decode
function preloadFrames() {
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const url = getFrameUrl(i);
    img.src = url;
    
    img.onload = () => {
      // Decode image on GPU if browser supports img.decode()
      if ('decode' in img) {
        img.decode().then(() => {
          loadedFramesCount++;
          updatePreloaderProgress();
        }).catch(() => {
          loadedFramesCount++;
          updatePreloaderProgress();
        });
      } else {
        loadedFramesCount++;
        updatePreloaderProgress();
      }
    };

    img.onerror = () => {
      loadedFramesCount++;
      updatePreloaderProgress();
    };

    images.push(img);
  }
}

function updatePreloaderProgress() {
  const percent = Math.min(100, Math.floor((loadedFramesCount / TOTAL_FRAMES) * 100));
  if (preloaderBar) preloaderBar.style.width = `${percent}%`;
  if (preloaderCount) preloaderCount.innerText = `${loadedFramesCount} / ${TOTAL_FRAMES} FRAMES`;
  if (preloaderPercent) preloaderPercent.innerText = `${percent}%`;

  if (loadedFramesCount >= TOTAL_FRAMES) {
    setTimeout(() => {
      if (preloaderStatus) preloaderStatus.innerText = 'HIGH-RESOLUTION 3D BIM MODEL READY';
      setTimeout(() => {
        if (preloader) preloader.classList.add('fade-out');
        renderCanvas();
      }, 300);
    }, 150);
  }
}

// 3. Ultra-Crisp High-DPI Canvas Rendering
function resizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = Math.max(1.5, window.devicePixelRatio || 1); // Ensure minimum 1.5x sharp ratio
  
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  canvas.width = Math.round(displayWidth * dpr);
  canvas.height = Math.round(displayHeight * dpr);
  
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  renderCanvas();
}

function renderCanvas() {
  if (!canvas || !ctx || images.length === 0) return;

  const currentFrameIdx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameFloat)));
  const img = images[currentFrameIdx];

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  // Cover-fit calculation in physical pixels
  const scale = Math.max(canvasW / imgW, canvasH / imgH);
  const drawW = Math.round(imgW * scale);
  const drawH = Math.round(imgH * scale);
  const offsetX = Math.round((canvasW - drawW) / 2);
  const offsetY = Math.round((canvasH - drawH) / 2);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform matrix
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Clear & Draw Frame
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  ctx.restore();

  // Update Hotspot Visibility
  updateHotspotsAndUI(currentFrameIdx);
}

// 4. Snappy High-Speed Animation Loop
function animationLoop() {
  const diff = targetFrameIndex - currentFrameFloat;
  if (Math.abs(diff) > 0.001) {
    // Fast lerp speed (0.65) for instant zero-lag scroll response
    currentFrameFloat += diff * 0.65;
    renderCanvas();
  }
  requestAnimationFrame(animationLoop);
}

// 5. Scroll Handling
function handleScroll() {
  if (!scrollWrapper) return;

  const rect = scrollWrapper.getBoundingClientRect();
  const totalScrollable = scrollWrapper.offsetHeight - window.innerHeight;

  if (totalScrollable <= 0) return;

  const scrolled = -rect.top;
  let progress = scrolled / totalScrollable;
  progress = Math.max(0, Math.min(1, progress));

  targetFrameIndex = Math.floor(progress * (TOTAL_FRAMES - 1));
  updateTimelineProgress(progress);
}

function updateTimelineProgress(progress) {
  const stepCount = timelineSteps.length;
  const currentStep = Math.min(stepCount - 1, Math.floor(progress * stepCount));

  timelineSteps.forEach((step, idx) => {
    if (idx === currentStep) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
}

// 6. Hotspots & HUD Updates
function updateHotspotsAndUI(frameIdx) {
  if (pinHvac) pinHvac.style.display = (frameIdx >= 35 && frameIdx <= 110) ? 'block' : 'none';
  if (pinElec) pinElec.style.display = (frameIdx >= 100 && frameIdx <= 175) ? 'block' : 'none';
  if (pinPlumb) pinPlumb.style.display = (frameIdx >= 165 && frameIdx <= 240) ? 'block' : 'none';

  if (mainCalloutPanel) {
    if (frameIdx < 60) {
      mainCalloutPanel.querySelector('.panel-tag').innerText = 'AUTODESK NAVISWORKS COORDINATED';
      mainCalloutPanel.querySelector('.panel-title').innerHTML = 'SSV MEP WORKS: <br><span class="text-cyan">ADVANCED BIM COORDINATION</span>';
    } else if (frameIdx < 120) {
      mainCalloutPanel.querySelector('.panel-tag').innerText = 'HVAC AIR DISTRIBUTION DISCIPLINE';
      mainCalloutPanel.querySelector('.panel-title').innerHTML = 'HIGH CAPACITY <br><span class="text-cyan">CYAN & MAGENTA DUCTS</span>';
    } else if (frameIdx < 180) {
      mainCalloutPanel.querySelector('.panel-tag').innerText = 'ELECTRICAL CONTAINMENT DISCIPLINE';
      mainCalloutPanel.querySelector('.panel-title').innerHTML = 'POWER & DATA <br><span class="text-yellow">YELLOW CABLE TRAYS</span>';
    } else {
      mainCalloutPanel.querySelector('.panel-tag').innerText = 'PLUMBING & HYDRONICS DISCIPLINE';
      mainCalloutPanel.querySelector('.panel-title').innerHTML = 'CLASH-FREE <br><span class="text-green">GREEN RISER STACKS</span>';
    }
  }
}

// 7. Filters
function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playTechTone(600, 0.05);

      const system = btn.getAttribute('data-system');
      
      if (system === 'all') scrollToProgress(0.05);
      else if (system === 'hvac') scrollToProgress(0.30);
      else if (system === 'elec') scrollToProgress(0.60);
      else if (system === 'plumb') scrollToProgress(0.90);
    });
  });
}

function scrollToProgress(targetProgress) {
  if (!scrollWrapper) return;
  const totalScrollable = scrollWrapper.offsetHeight - window.innerHeight;
  const targetY = scrollWrapper.offsetTop + (targetProgress * totalScrollable);
  window.scrollTo({ top: targetY, behavior: 'smooth' });
}

// 8. ROI Calculator
function setupCalculator() {
  const sliderSqft = document.getElementById('slider-sqft');
  const sliderFloors = document.getElementById('slider-floors');
  const selectComplexity = document.getElementById('select-complexity');

  const valSqft = document.getElementById('val-sqft');
  const valFloors = document.getElementById('val-floors');

  const resClashes = document.getElementById('res-clashes');
  const resSavings = document.getElementById('res-savings');
  const resWeeks = document.getElementById('res-weeks');
  const resRfis = document.getElementById('res-rfis');

  function updateCalc() {
    if (!sliderSqft || !sliderFloors || !selectComplexity) return;

    const sqft = parseInt(sliderSqft.value, 10);
    const floors = parseInt(sliderFloors.value, 10);
    const mult = parseFloat(selectComplexity.value);

    if (valSqft) valSqft.innerText = `${sqft.toLocaleString()} SQ FT`;
    if (valFloors) valFloors.innerText = `${floors} FLOORS`;

    const baseClashesPer1kSqFt = 1.75 * mult;
    const totalClashes = Math.round((sqft / 1000) * baseClashesPer1kSqFt);
    const totalSavings = Math.round(totalClashes * 500);
    const weeksSaved = (totalClashes / 60).toFixed(1);

    if (resClashes) resClashes.innerText = totalClashes.toLocaleString();
    if (resSavings) resSavings.innerText = `$${totalSavings.toLocaleString()}`;
    if (resWeeks) resWeeks.innerText = `${weeksSaved} WEEKS`;
    if (resRfis) resRfis.innerText = `-${Math.min(95, Math.round(85 + mult * 4))}%`;
  }

  if (sliderSqft) sliderSqft.addEventListener('input', updateCalc);
  if (sliderFloors) sliderFloors.addEventListener('input', updateCalc);
  if (selectComplexity) selectComplexity.addEventListener('change', updateCalc);

  updateCalc();
}

// 9. Modal setup
function setupModal() {
  const auditModal = document.getElementById('audit-modal');
  const btnOpenAudit = document.getElementById('btn-open-audit');
  const btnFooterAudit = document.getElementById('btn-footer-audit');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const auditForm = document.getElementById('audit-form');
  const fileDropzone = document.getElementById('file-dropzone');
  const fileInput = document.getElementById('file-input');

  function openModal(e) {
    if (e) e.preventDefault();
    if (auditModal) auditModal.style.display = 'flex';
    initAudio();
    playTechTone(800, 0.1);
  }

  function closeModal() {
    if (auditModal) auditModal.style.display = 'none';
  }

  if (btnOpenAudit) btnOpenAudit.addEventListener('click', openModal);
  if (btnFooterAudit) btnFooterAudit.addEventListener('click', openModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (btnModalCancel) btnModalCancel.addEventListener('click', closeModal);

  if (auditModal) {
    auditModal.addEventListener('click', (e) => {
      if (e.target === auditModal) closeModal();
    });
  }

  if (fileDropzone && fileInput) {
    fileDropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileDropzone.querySelector('.text-sm').innerText = `Selected ${fileInput.files.length} file(s): ${fileInput.files[0].name}`;
      }
    });
  }

  if (auditForm) {
    auditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thank you! Your 3D BIM Clash Audit Request has been received. Our BIM Lead engineer will contact you within 24 hours with your initial spatial report.');
      closeModal();
    });
  }
}

// 10. Sound Toggle
function setupSoundToggle() {
  const audioToggle = document.getElementById('audio-toggle');
  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      initAudio();
      isAudioEnabled = !isAudioEnabled;
      audioToggle.style.color = isAudioEnabled ? 'var(--color-cyan)' : 'var(--text-light)';
      audioToggle.style.borderColor = isAudioEnabled ? 'var(--color-cyan)' : 'var(--border-color)';
      if (isAudioEnabled) playTechTone(880, 0.15);
    });
  }
}

// Initialization on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  preloadFrames();
  resizeCanvas();
  setupFilters();
  setupCalculator();
  setupModal();
  setupSoundToggle();

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', handleScroll, { passive: true });
  requestAnimationFrame(animationLoop);
});
