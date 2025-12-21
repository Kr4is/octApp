document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const imageInput = document.getElementById('imageInput');
  const demoBtn = document.getElementById('demoBtn');
  const mainDemoBtn = document.getElementById('mainDemoBtn');
  const visualizationCanvas = document.getElementById('visualizationCanvas');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const canvasContainer = document.getElementById('canvasContainer');
  const originalImage = document.getElementById('originalImage');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const statusIndicator = document.getElementById('statusIndicator');
  const imgResLabel = document.getElementById('imgRes');

  // Controls
  const controlsPanel = document.getElementById('controlsPanel');
  const xSlider = document.getElementById('xSlider');
  const xValue = document.getElementById('xValue');
  const maxLabel = document.getElementById('maxX');
  const showAllCheckbox = document.getElementById('showAll');
  const toggleCurvesBtn = document.getElementById('toggleCurvesBtn');
  const distanceRadios = document.getElementsByName('distanceType');

  // Results
  const minDistanceEl = document.getElementById('minDistance');
  const maxDistanceEl = document.getElementById('maxDistance');

  // Context
  const ctx = overlayCanvas.getContext('2d');

  // State
  let allPoints = {};
  let allDists = {};
  let curveUpPoints = [];
  let curveDownPoints = [];
  let originalWidth = 0;
  let originalHeight = 0;
  let showCurves = false;
  let isImageLoaded = false;

  // --- UI Helpers ---

  function setLoading(isLoading) {
    if (isLoading) {
      loadingState.classList.remove('hidden');
      emptyState.classList.add('hidden');
    } else {
      loadingState.classList.add('hidden');
    }
  }

  function setControlState(enabled) {
    if (enabled) {
      controlsPanel.classList.remove('opacity-50', 'pointer-events-none');
      xSlider.disabled = false;
      statusIndicator.classList.remove('bg-slate-300');
      statusIndicator.classList.add('bg-green-500', 'shadow-[0_0_8px_rgba(34,197,94,0.6)]');
      isImageLoaded = true;
    } else {
      controlsPanel.classList.add('opacity-50', 'pointer-events-none');
      xSlider.disabled = true;
      statusIndicator.classList.add('bg-slate-300');
      statusIndicator.classList.remove('bg-green-500', 'shadow-[0_0_8px_rgba(34,197,94,0.6)]');
      isImageLoaded = false;
    }
  }

  function showImage() {
    emptyState.classList.add('hidden');
    canvasContainer.classList.remove('hidden');
  }

  // Initialize UI
  setControlState(false);

  // --- Data Processing ---

  function getDistanceType() {
    return document.querySelector('input[name="distanceType"]:checked').value;
  }

  function getCurrentPoints() {
    const distType = getDistanceType();
    return allPoints[distType] || [];
  }

  function getCurrentDists() {
    const distType = getDistanceType();
    return allDists[distType] || [];
  }

  function updateStats() {
    const dists = getCurrentDists();
    if (dists && dists.length > 0) {
      const min = Math.min(...dists);
      const max = Math.max(...dists);
      minDistanceEl.textContent = min.toFixed(2);
      maxDistanceEl.textContent = max.toFixed(2);
    } else {
      minDistanceEl.textContent = "--";
      maxDistanceEl.textContent = "--";
    }
  }

  // --- Canvas & Drawing ---

  function resizeCanvas() {
    if (!isImageLoaded || originalWidth === 0 || originalHeight === 0) return;

    // Ensure image is actually rendered
    if (originalImage.naturalWidth === 0) return;

    const rect = originalImage.getBoundingClientRect();
    const displayedWidth = rect.width;
    const displayedHeight = rect.height;

    if (displayedWidth === 0 || displayedHeight === 0) return;

    // Match canvas resolution to displayed size for correct events/drawing match
    // Ideally match device pixel ratio for sharpness, but 1:1 CSS pixel match is simpler for now
    overlayCanvas.width = displayedWidth;
    overlayCanvas.height = displayedHeight;

    // Update dimensions labels
    // Calculate true display scale relative to original image pixel data
    // originalWidth is from backend (cv2.shape[1]), naturalWidth should match it usually.

    const trueScale = (displayedWidth / originalImage.naturalWidth * 100).toFixed(0);
    document.getElementById('displayScale').textContent = `${trueScale}%`;
  }

  function getScaleFactors() {
    // Logic: The image element has object-contain.
    // The content (the visible image) might be smaller than the element box (rect).

    const rect = originalImage.getBoundingClientRect();
    const displayedWidth = rect.width;
    const displayedHeight = rect.height;

    const naturalW = originalImage.naturalWidth;
    const naturalH = originalImage.naturalHeight;

    if (naturalW === 0 || naturalH === 0) return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };

    // Aspect Ratios
    const infoAspect = originalWidth / originalHeight; // From backend
    const naturalAspect = naturalW / naturalH; // From browser decoder
    const containerAspect = displayedWidth / displayedHeight;

    // Note: Backend 'originalWidth' vs 'naturalWidth'.
    // If backend processed the image and returned dimensions, we should rely on mapping
    // Backend Coordinates (0..originalWidth) -> Screen Coordinates.

    // First, map Backend -> Natural (in case of some mismatch, though mostly 1:1)
    const backendToNaturalX = naturalW / originalWidth;
    const backendToNaturalY = naturalH / originalHeight;

    // Next, map Natural -> Displayed Content Rect
    // Calculate the size of the 'painted' image inside the object-contain box
    let paintW, paintH;
    let pOffsetX = 0, pOffsetY = 0;

    if (containerAspect > naturalAspect) {
      // Box is wider than image -> Pillarbox (bars on sides)
      // Height is constrained
      paintH = displayedHeight;
      paintW = displayedHeight * naturalAspect;
      pOffsetX = (displayedWidth - paintW) / 2;
      pOffsetY = 0;
    } else {
      // Box is taller than image -> Letterbox (bars on top/bottom)
      // Width is constrained
      paintW = displayedWidth;
      paintH = displayedWidth / naturalAspect;
      pOffsetX = 0;
      pOffsetY = (displayedHeight - paintH) / 2;
    }

    // Total Transform: Backend Coord -> Natural Coord -> Screen Coord
    // ScreenX = (BackendX * backendToNaturalX / naturalW) * paintW + pOffsetX
    // Simplified: (BackendX / originalWidth) * paintW + pOffsetX

    const scaleX = paintW / originalWidth;
    const scaleY = paintH / originalHeight;

    ctx.resetTransform();
    ctx.translate(pOffsetX, pOffsetY);
    ctx.scale(scaleX, scaleY);

    return {
      scaleX,
      scaleY,
      offsetX: pOffsetX,
      offsetY: pOffsetY,
      paintW,
      paintH
    };
  }

  function drawPolyline(pointsArray, color) {
    if (!pointsArray || pointsArray.length === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / getScaleFactors().scaleX; // Mantener grosor visual constante
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < pointsArray.length; i++) {
      const [px, py] = pointsArray[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function normalizePoint(point) {
    if (Array.isArray(point) && point.length >= 2) return [point[0], point[1]];
    if (point && typeof point === 'object' && point.x !== undefined) return [point.x, point.y];
    return null;
  }

  function drawOverlay() {
    if (!isImageLoaded) return;

    ctx.resetTransform();
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    getScaleFactors(); // Apply transform

    const xSelected = parseInt(xSlider.value, 10);
    const showAll = showAllCheckbox.checked;
    const currentPoints = getCurrentPoints();
    const currentDists = getCurrentDists();

    // Draw Curves
    if (showCurves) {
      drawPolyline(curveUpPoints, '#22c55e'); // Green-500
      drawPolyline(curveDownPoints, '#ef4444'); // Red-500
    }

    // Draw Points
    // Selected Point Style
    ctx.lineWidth = 2;

    const dists = getCurrentDists();
    let minD = 0, maxD = 100;

    if (dists && dists.length > 0) {
      minD = Math.min(...dists);
      maxD = Math.max(...dists);
    }

    function getColorForDistance(val) {
      if (maxD === minD) return `hsl(240, 100%, 50%)`;
      // Normalize 0..1
      const t = (val - minD) / (maxD - minD);
      // Map to Hue: 240 (Blue) -> 0 (Red)
      const hue = 240 * (1 - t);
      return `hsl(${hue}, 100%, 50%)`;
    }

    if (showAll) {
      for (let i = 0; i < currentPoints.length; i++) {
        if (!currentPoints[i]) continue;
        let p1, p2;
        if (Array.isArray(currentPoints[i])) {
          p1 = normalizePoint(currentPoints[i][0]);
          p2 = normalizePoint(currentPoints[i][1]);
        }
        if (!p1 || !p2) continue;

        const distVal = dists[i] !== undefined ? dists[i] : 0;
        const color = getColorForDistance(distVal);

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.strokeStyle = color; // For lines if we drew them

        ctx.arc(p1[0], p1[1], 1.5, 0, Math.PI * 2);
        ctx.arc(p2[0], p2[1], 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Highlight selected even in show all
      if (currentPoints[xSelected]) {
        let p1 = normalizePoint(currentPoints[xSelected][0]);
        let p2 = normalizePoint(currentPoints[xSelected][1]);

        ctx.beginPath();
        ctx.strokeStyle = '#4f46e5'; // Indigo-600
        ctx.lineWidth = 3;
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      }

    } else if (currentPoints[xSelected]) {
      ctx.strokeStyle = '#4f46e5'; // Indigo-600
      ctx.fillStyle = '#4f46e5';

      let p1, p2;
      const ptData = currentPoints[xSelected];

      if (Array.isArray(ptData)) {
        p1 = normalizePoint(ptData[0]);
        p2 = normalizePoint(ptData[1]);
      }

      if (p1 && p2) {
        // Draw large selected points
        ctx.beginPath();
        ctx.arc(p1[0], p1[1], 5, 0, Math.PI * 2);
        ctx.arc(p2[0], p2[1], 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw connection line
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        // Draw label
        if (currentDists[xSelected] !== undefined) {
          ctx.save();
          ctx.resetTransform(); // Draw text in screen space for sharpness
          const sf = getScaleFactors();
          // ... (existing label logic)
          // Re-implementing simplified label logic for context

          // Restore label drawing:
          const midX_world = (p1[0] + p2[0]) / 2;
          const midY_world = (p1[1] + p2[1]) / 2;

          const screenX = midX_world * sf.scaleX + sf.offsetX;
          const screenY = midY_world * sf.scaleY + sf.offsetY;

          ctx.font = 'bold 16px Outfit, sans-serif';
          ctx.fillStyle = '#1e1b4b';
          ctx.textAlign = 'center';
          ctx.fillText(currentDists[xSelected].toFixed(2), screenX, screenY - 15);

          ctx.restore();
        }
      }
    }
  }

  // --- Data Loading ---

  function loadData(data) {
    if (data.error) {
      alert(data.error);
      setLoading(false);
      return;
    }

    originalWidth = data.width;
    originalHeight = data.height;
    curveUpPoints = data.curve_up || [];
    curveDownPoints = data.curve_down || [];

    imgResLabel.textContent = `${originalWidth} x ${originalHeight}`;

    allPoints = {};
    allDists = {};

    if (data.points_by_type && data.dists_by_type) {
      allPoints = data.points_by_type;
      allDists = data.dists_by_type;
    } else {
      // Fallback for flat structure
      allPoints.up = data.points || [];
      allPoints.euclidean = data.points || [];
      allDists.up = data.dists || [];
      allDists.euclidean = data.dists || [];
    }

    // Config slider
    xSlider.max = originalWidth - 1;
    xSlider.value = Math.floor(originalWidth / 2); // Start in middle
    xValue.textContent = xSlider.value;
    maxLabel.textContent = originalWidth;

    // Attach onload BEFORE setting src to avoid caching race conditions
    originalImage.onload = () => {
      setLoading(false);
      showImage();

      // Use rAF to wait for layout to settle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setControlState(true);
          resizeCanvas();
          updateStats();
          drawOverlay();
        });
      });
    };

    // Set src AFTER attaching listener
    // Add timestamp to force reload if needed (though local blob usually fine, static might cache)
    if (data.original.startsWith('/static/')) {
      originalImage.src = `${data.original}?t=${new Date().getTime()}`;
    } else {
      originalImage.src = data.original;
    }
  }

  function handleUpload(file) {
    if (!file) return;
    setControlState(false);
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    fetch('/', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(loadData)
      .catch(err => {
        console.error(err);
        alert('Error processing image');
        setLoading(false);
      });
  }

  function handleDemo() {
    setControlState(false);
    setLoading(true);
    const formData = new FormData();
    formData.append('demo', 'true');

    fetch('/', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(loadData)
      .catch(err => {
        console.error(err);
        alert('Error loading demo');
        setLoading(false);
      });
  }

  // --- Event Listeners ---

  imageInput.addEventListener('change', () => handleUpload(imageInput.files[0]));
  demoBtn.addEventListener('click', handleDemo);
  mainDemoBtn.addEventListener('click', handleDemo);

  window.addEventListener('resize', () => { setTimeout(() => { resizeCanvas(); drawOverlay(); }, 100); });

  xSlider.addEventListener('input', () => {
    xValue.textContent = xSlider.value;
    drawOverlay();
  });

  showAllCheckbox.addEventListener('change', drawOverlay);

  toggleCurvesBtn.addEventListener('click', () => {
    showCurves = !showCurves;
    // Simple toggle switch styling
    const thumb = toggleCurvesBtn.querySelector('span');
    if (showCurves) {
      toggleCurvesBtn.classList.remove('bg-slate-200');
      toggleCurvesBtn.classList.add('bg-indigo-600');
      thumb.classList.add('translate-x-5');
      thumb.classList.remove('translate-x-0');
    } else {
      toggleCurvesBtn.classList.remove('bg-indigo-600');
      toggleCurvesBtn.classList.add('bg-slate-200');
      thumb.classList.remove('translate-x-5');
      thumb.classList.add('translate-x-0');
    }
    drawOverlay();
  });

  distanceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateStats();
      drawOverlay();
    });
  });

});