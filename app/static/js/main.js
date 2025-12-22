document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const imageInput = document.getElementById('imageInput');
  const demoBtn = document.getElementById('demoBtn');
  const mainDemoBtn = document.getElementById('mainDemoBtn'); // Note: This might be hidden in new layout but ID persists? Wait, I didn't verify emptyState.
  const visualizationCanvas = document.getElementById('visualizationCanvas');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const canvasContainer = document.getElementById('canvasContainer');
  const originalImage = document.getElementById('originalImage');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const statusIndicator = document.getElementById('statusIndicator');
  const imgResLabel = document.getElementById('imgRes');

  // New Container for slider opacity
  const sliderContainer = document.getElementById('xSlider').parentElement; // Hacky but works if structure is stable, or I could add ID. 
  // actually better to just rely on input disabled state for visual style if possible, or use the parent.
  // Let's use xSlider.parentElement for now.

  // Controls
  const controlsPanel = document.getElementById('controlsPanel');
  const xSlider = document.getElementById('xSlider');
  const xValue = document.getElementById('xValue');
  const maxLabel = document.getElementById('maxX');
  const toggleCurvesBtn = document.getElementById('toggleCurvesBtn');
  const distanceRadios = document.getElementsByName('distanceType');

  // Results
  // Results & Dashboard
  const minDistanceEl = document.getElementById('minDistance');
  const maxDistanceEl = document.getElementById('maxDistance');
  const meanDistanceEl = document.getElementById('meanDistance');
  const stdDistanceEl = document.getElementById('stdDistance');
  const centralDistanceEl = document.getElementById('centralDistance');
  const peripheralDistanceEl = document.getElementById('peripheralDistance');

  // New Advanced Metrics
  const symmetryIndexEl = document.getElementById('symmetryIndex');
  const symmetryTag = document.getElementById('symmetryTag');
  const antRadiusEl = document.getElementById('antRadius');
  const centralBar = document.getElementById('centralBar');
  const peripheralBar = document.getElementById('peripheralBar');

  // Graph
  const graphCanvas = document.getElementById('thicknessGraph');
  const fullProfileCanvas = document.getElementById('fullProfileCanvas');
  const modalGraphCanvas = document.getElementById('modalGraphCanvas');
  const graphPreviewCard = document.getElementById('graphPreviewCard');
  const exportBtn = document.getElementById('exportBtn');

  // Tabs & Modal
  const tabOverview = document.getElementById('tabOverview');
  const tabProfile = document.getElementById('tabProfile');
  const contentOverview = document.getElementById('contentOverview');
  const contentProfile = document.getElementById('contentProfile');
  const graphModal = document.getElementById('graphModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Context
  const ctx = overlayCanvas.getContext('2d');

  // State
  let allPoints = {};
  let allDists = {};
  let curveUpPoints = [];
  let curveDownPoints = [];
  let originalWidth = 0;
  let originalHeight = 0;
  let showCurves = true; // Default to true as requested
  let isImageLoaded = false;

  // Stats Globals (Export Needs Access)
  let meanVal = 0;
  let stdVal = 0;
  let minD = 0;
  let maxD = 0;
  let centralMean = 0;
  let periphMean = 0;
  let symIdx = 0;
  let rad = 0;

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
      sliderContainer.classList.remove('opacity-50');
      statusIndicator.classList.remove('bg-slate-300');
      statusIndicator.classList.add('bg-green-500', 'shadow-[0_0_8px_rgba(34,197,94,0.6)]');
      isImageLoaded = true;
    } else {
      controlsPanel.classList.add('opacity-50', 'pointer-events-none');
      xSlider.disabled = true;
      sliderContainer.classList.add('opacity-50');
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
      // Calculate Min/Max
      minD = Math.min(...dists);
      maxD = Math.max(...dists);

      // Calculate Mean
      const sum = dists.reduce((a, b) => a + b, 0);
      meanVal = sum / dists.length;

      // Calculate Std Dev
      const squareDiffs = dists.map(value => Math.pow(value - meanVal, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
      stdVal = Math.sqrt(avgSquareDiff);

      // Calculate Central vs Peripheral
      const w = dists.length;
      const oneThird = Math.floor(w / 3);
      const twoThirds = Math.floor(2 * w / 3);

      const centralDists = dists.slice(oneThird, twoThirds);
      const peripheralDists = [...dists.slice(0, oneThird), ...dists.slice(twoThirds)];

      const getMean = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

      centralMean = getMean(centralDists);
      periphMean = getMean(peripheralDists);

      // --- Advanced Metrics Calculation ---

      // 1. Symmetry Index (SI)
      const halfIdx = Math.floor(w / 2);
      const leftHalf = dists.slice(0, halfIdx);
      const rightHalf = dists.slice(halfIdx);

      const leftMean = getMean(leftHalf);
      const rightMean = getMean(rightHalf);

      symIdx = meanVal > 0 ? (Math.abs(leftMean - rightMean) / meanVal * 100) : 0;

      // 2. Curvature Estimation (Approx Anterior Radius)
      rad = 0;
      if (curveUpPoints.length > 2) {
        const pA = curveUpPoints[Math.floor(curveUpPoints.length * 0.25)];
        const pB = curveUpPoints[Math.floor(curveUpPoints.length * 0.5)];
        const pC = curveUpPoints[Math.floor(curveUpPoints.length * 0.75)];

        if (pA && pB && pC) {
          const rPx = calculateCircleRadius(pA, pB, pC);

          // Estimation of Scale
          const centIdx = Math.floor(curveUpPoints.length / 2);
          const pUp = curveUpPoints[centIdx];
          const pDown = curveDownPoints[centIdx];

          if (pUp && pDown) {
            const thicknessPx = Math.sqrt(Math.pow(pUp[0] - pDown[0], 2) + Math.pow(pUp[1] - pDown[1], 2));
            const scale = centralMean / thicknessPx; // microns per pixel

            const rMicrons = rPx * scale;
            rad = rMicrons / 1000;
          }
        }
      }

      // --- DOM Updates ---
      minDistanceEl.textContent = minD.toFixed(0);
      maxDistanceEl.textContent = maxD.toFixed(0);
      meanDistanceEl.textContent = meanVal.toFixed(0);
      stdDistanceEl.textContent = stdVal.toFixed(1);

      centralDistanceEl.textContent = centralMean.toFixed(0);
      peripheralDistanceEl.textContent = periphMean.toFixed(0);

      const maxBar = 1000;
      centralBar.style.width = Math.min(100, (centralMean / maxBar) * 100) + '%';
      peripheralBar.style.width = Math.min(100, (periphMean / maxBar) * 100) + '%';

      symmetryIndexEl.textContent = symIdx.toFixed(1) + '%';
      if (symIdx < 5) {
        symmetryTag.textContent = "Normal";
        symmetryTag.className = "px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700";
        symmetryTag.classList.remove('hidden');
      } else {
        symmetryTag.textContent = "High Asymmetry";
        symmetryTag.className = "px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700";
        symmetryTag.classList.remove('hidden');
      }

      antRadiusEl.innerHTML = (rad > 0 && rad < 100) ? `${rad.toFixed(2)} <span class="text-sm font-normal text-slate-500">mm</span>` : '--';

      // Render Graphs
      renderGraph(graphCanvas, dists, meanVal);
      renderGraph(fullProfileCanvas, dists, meanVal, true);
      renderGraph(modalGraphCanvas, dists, meanVal, true);

    } else {
      // Reset Globals
      minD = 0; maxD = 0; meanVal = 0; stdVal = 0;
      centralMean = 0; periphMean = 0; symIdx = 0; rad = 0;

      minDistanceEl.textContent = "--";
      maxDistanceEl.textContent = "--";
      meanDistanceEl.textContent = "--";
      stdDistanceEl.textContent = "--";
      centralDistanceEl.textContent = "--";
      peripheralDistanceEl.textContent = "--";
      symmetryIndexEl.textContent = "--";
      antRadiusEl.textContent = "--";
      symmetryTag.classList.add('hidden'); // Fix tag visibility on reset

      if (graphCanvas) {
        const gCtx = graphCanvas.getContext('2d');
        gCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
      }
      if (fullProfileCanvas) {
        const gCtx = fullProfileCanvas.getContext('2d');
        gCtx.clearRect(0, 0, fullProfileCanvas.width, fullProfileCanvas.height);
      }
    }
  }

  // Helper: 3-Point Circle Radius
  function calculateCircleRadius(A, B, C) {
    const x1 = A[0], y1 = A[1];
    const x2 = B[0], y2 = B[1];
    const x3 = C[0], y3 = C[1];

    const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    const Ux = ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / D;
    const Uy = ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / D;

    const r = Math.sqrt(Math.pow(x1 - Ux, 2) + Math.pow(y1 - Uy, 2));
    return r;
  }

  // Helper: Generic Graph Renderer
  function renderGraph(canvasEl, data, meanVal, showAxes = false) {
    if (!canvasEl) return;

    // Resize canvas to parent
    const parent = canvasEl.parentElement;
    if (parent.clientWidth === 0 || parent.clientHeight === 0) return; // Hidden

    canvasEl.width = parent.clientWidth;
    canvasEl.height = parent.clientHeight;

    const w = canvasEl.width;
    const h = canvasEl.height;
    const gCtx = canvasEl.getContext('2d');

    gCtx.clearRect(0, 0, w, h);

    // Padding for axes
    const padLeft = showAxes ? 40 : 0;
    const padBottom = showAxes ? 20 : 0;

    // Effective drawing area
    const drawW = w - padLeft;
    const drawH = h - padBottom;

    // Scale Logic
    const minD = Math.min(...data);
    const maxD = Math.max(...data);
    const range = maxD - minD || 1;
    const padY = range * 0.2;

    const yMin = Math.max(0, minD - padY);
    const yMax = maxD + padY;

    // Mapping Functions
    const mapX = (i) => padLeft + (i / (data.length - 1)) * drawW;
    const mapY = (val) => (h - padBottom) - ((val - yMin) / (yMax - yMin)) * drawH;

    // AXES & LABELS
    if (showAxes) {
      gCtx.fillStyle = '#64748b';
      gCtx.font = '10px sans-serif';
      gCtx.textAlign = 'right';

      // Y-Axis Labels (Min, Mean, Max)
      gCtx.fillText(Math.round(maxD), padLeft - 5, mapY(maxD) + 3);
      gCtx.fillText(Math.round(minD), padLeft - 5, mapY(minD) + 3);

      // X-Axis Labels (Start/End)
      gCtx.textAlign = 'center';
      gCtx.fillText("0", padLeft, h - 5);
      gCtx.fillText(data.length, w - 10, h - 5);

      // Axis Lines
      gCtx.strokeStyle = '#e2e8f0';
      gCtx.lineWidth = 1;
      gCtx.beginPath();
      gCtx.moveTo(padLeft, 0); gCtx.lineTo(padLeft, h - padBottom); // Y
      gCtx.moveTo(padLeft, h - padBottom); gCtx.lineTo(w, h - padBottom); // X
      gCtx.stroke();
    }

    // Draw Gradient Fill
    gCtx.beginPath();
    gCtx.moveTo(padLeft, h - padBottom);
    for (let i = 0; i < data.length; i++) {
      gCtx.lineTo(mapX(i), mapY(data[i]));
    }
    gCtx.lineTo(w, h - padBottom);
    gCtx.closePath();

    const grad = gCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
    grad.addColorStop(1, 'rgba(79, 70, 229, 0.0)');
    gCtx.fillStyle = grad;
    gCtx.fill();

    // Draw Line
    gCtx.beginPath();
    gCtx.strokeStyle = '#4f46e5';
    gCtx.lineWidth = 2;
    for (let i = 0; i < data.length; i++) {
      if (i === 0) gCtx.moveTo(mapX(i), mapY(data[i]));
      else gCtx.lineTo(mapX(i), mapY(data[i]));
    }
    gCtx.stroke();

    // Draw Mean Line
    const yMean = mapY(meanVal);
    gCtx.beginPath();
    gCtx.strokeStyle = '#94a3b8';
    gCtx.setLineDash([4, 4]);
    gCtx.moveTo(padLeft, yMean);
    gCtx.lineTo(w, yMean);
    gCtx.stroke();
    gCtx.setLineDash([]);

    // Highlight Selected Position
    const xSelected = parseInt(xSlider.value, 10);
    const xPos = mapX(xSelected);
    // Clip to drawing area
    if (xPos >= padLeft && xPos <= w) {
      gCtx.beginPath();
      gCtx.strokeStyle = '#ef4444';
      gCtx.lineWidth = 1;
      gCtx.moveTo(xPos, 0);
      gCtx.lineTo(xPos, h - padBottom);
      gCtx.stroke();
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

  function getColorForDistance(val, minD, maxD) {
    if (maxD === minD) return `hsl(240, 100%, 50%)`;
    // Normalize 0..1
    const t = (val - minD) / (maxD - minD);
    // Map to Hue: 240 (Blue) -> 0 (Red)
    const hue = 240 * (1 - t);
    return `hsl(${hue}, 100%, 50%)`;
  }

  function drawColoredPolyline(pointsArray, distsArray, minD, maxD) {
    if (!pointsArray || pointsArray.length === 0) return;

    // We draw segments. 
    // Optimization: Draw lines segment by segment is slow in 2D Canvas if we do stroke() each time.
    // However, for gradient effect, we typically need to change color.
    // A better approach for many points is creating a gradient, but that matches spatial, not value.
    // Since value maps to color, and value changes per pixel, we can draw line segments.

    const sf = getScaleFactors();
    ctx.lineWidth = 3 / sf.scaleX; // Thicker lines
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < pointsArray.length - 1; i++) {
      const p1 = pointsArray[i];
      const p2 = pointsArray[i + 1];

      // Use the distance of i to color segment i -> i+1
      const dist = distsArray[i] || 0;
      const color = getColorForDistance(dist, minD, maxD);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.stroke();
    }
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

    const sf = getScaleFactors(); // Apply transform is inside, but we need the object for un-transform logic if needed
    // Actually getScaleFactors DOES apply ctx transform.

    const xSelected = parseInt(xSlider.value, 10);
    const currentPoints = getCurrentPoints();
    const currentDists = getCurrentDists();

    // Calculate Min/Max for global coloring
    let minD = 0, maxD = 100;
    if (currentDists && currentDists.length > 0) {
      minD = Math.min(...currentDists);
      maxD = Math.max(...currentDists);
    }

    // Draw Curves
    if (showCurves) {
      // Curve Up (uses current distances for coloring to match the heatmap concept)
      drawColoredPolyline(curveUpPoints, currentDists, minD, maxD);
      // Curve Down
      drawColoredPolyline(curveDownPoints, currentDists, minD, maxD);
    }

    // Draw Selected Point / Measurement Line
    if (currentPoints[xSelected]) {
      const distVal = currentDists[xSelected];
      const color = getColorForDistance(distVal, minD, maxD);

      // Update Interface Value (if existing)
      if (typeof currentDistanceEl !== 'undefined' && currentDistanceEl) {
        currentDistanceEl.textContent = distVal ? distVal.toFixed(2) : '--';
      }

      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      let p1, p2;
      const ptData = currentPoints[xSelected];

      if (Array.isArray(ptData)) {
        p1 = normalizePoint(ptData[0]);
        p2 = normalizePoint(ptData[1]);
      }

      if (p1 && p2) {
        // Draw connection line
        ctx.beginPath();
        // Make it thicker as requested to "match heatmap size" or just be visible
        ctx.lineWidth = 3 / sf.scaleX;
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        // Draw large selected points
        // Use fixed size in screen pixels -> divide radius by scale
        const r = 4 / sf.scaleX;
        ctx.beginPath();
        ctx.arc(p1[0], p1[1], r, 0, Math.PI * 2);
        ctx.arc(p2[0], p2[1], r, 0, Math.PI * 2);
        ctx.fill();

        // Draw label
        if (distVal !== undefined) {
          ctx.save();
          ctx.resetTransform(); // Draw text in screen space for sharpness

          const midX_world = (p1[0] + p2[0]) / 2;
          // Position below the bottom point (usually p2 is bottom, but let's check max y)
          const lowerY = Math.max(p1[1], p2[1]);

          const screenX = midX_world * sf.scaleX + sf.offsetX;
          const screenY = lowerY * sf.scaleY + sf.offsetY;

          // Text Style
          ctx.font = 'bold 24px Outfit, sans-serif'; // Larger font
          ctx.fillStyle = color; // Colored text matching line
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 4;

          // Draw below
          // CLAMP LOGIC: Ensure text doesn't go off canvas
          const text = distVal.toFixed(2);
          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const padding = 10;

          let drawX = screenX;
          // Clamp: Max(left_bound, Min(right_bound, x))
          // Left bound: textWidth/2 + padding
          // Right bound: canvasWidth - textWidth/2 - padding

          const leftBound = textWidth / 2 + padding;
          const rightBound = overlayCanvas.width - textWidth / 2 - padding;

          drawX = Math.max(leftBound, Math.min(rightBound, drawX));

          ctx.fillText(text, drawX, screenY + 40);

          ctx.restore();
        }
      }
    } else {
      if (typeof currentDistanceEl !== 'undefined' && currentDistanceEl) {
        currentDistanceEl.textContent = '--';
      }
    }
  }

  // --- Data Loading ---

  function loadData(data) {
    try {
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
      if (xSlider) {
        xSlider.max = originalWidth - 1;
        xSlider.value = Math.floor(originalWidth / 2); // Start in middle
        if (xValue) xValue.textContent = xSlider.value;
        if (maxLabel) maxLabel.textContent = originalWidth;
      }

      // Attach onload BEFORE setting src to avoid caching race conditions
      originalImage.onload = () => {
        setLoading(false);
        showImage();

        // Use rAF to wait for layout to settle
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              setControlState(true);
              resizeCanvas();
              updateStats();
              drawOverlay();
            } catch (e) {
              console.error("Rendering Error:", e);
              // Don't alert here to avoid spam loop, but logging helps if console open
            }
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
    } catch (e) {
      console.error("LoadData Error:", e);
      alert("Error loading data: " + e.message);
      setLoading(false);
    }
  }

  function handleUpload(file) {
    if (!file) return;
    setControlState(false);
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    fetch('/', { method: 'POST', body: formData })
      .then(res => {
        if (!res.ok) throw new Error("Server Error: " + res.statusText);
        return res.json();
      })
      .then(loadData)
      .catch(err => {
        console.error(err);
        alert('Error processing image: ' + err.message);
        setLoading(false);
      });
  }

  function handleDemo() {
    setControlState(false);
    setLoading(true);
    const formData = new FormData();
    formData.append('demo', 'true');

    fetch('/', { method: 'POST', body: formData })
      .then(res => {
        if (!res.ok) throw new Error("Server Error: " + res.statusText);
        return res.json();
      })
      .then(loadData)
      .catch(err => {
        console.error(err);
        alert('Error loading demo: ' + err.message);
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
    // Debounce/Throttle could be added if performance is an issue
    requestAnimationFrame(drawOverlay);
  });

  exportBtn.addEventListener('click', () => {
    if (!isImageLoaded) return;

    // Create a temporary canvas with correct dimensions
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = originalImage.naturalWidth;
    exportCanvas.height = originalImage.naturalHeight;
    const exCtx = exportCanvas.getContext('2d');

    // Draw Original Image
    exCtx.drawImage(originalImage, 0, 0);

    // Draw Overlay
    // We need to scale our drawing context to 1:1 with natural pixels.
    // The current drawOverlay logic relies on getScaleFactors which maps Backend -> Screen.
    // Backend (originalWidth) -> NaturalWidth might usually be 1:1 but we handled it separately.

    // Logic:
    // P_natural = P_backend * (naturalW / originalWidth)

    const scaleToNaturalX = originalImage.naturalWidth / originalWidth;
    const scaleToNaturalY = originalImage.naturalHeight / originalHeight;

    exCtx.scale(scaleToNaturalX, scaleToNaturalY);

    // Reuse logic? 
    // We can duplicate the drawing logic slightly modified for export or refactor `drawOverlay` to accept a context.
    // For simplicity/speed, let's replicate the drawing logic here adapted for the export context.

    const xSelected = parseInt(xSlider.value, 10);
    const currentPoints = getCurrentPoints();
    const currentDists = getCurrentDists();

    let minD = 0, maxD = 100;
    if (currentDists.length > 0) {
      minD = Math.min(...currentDists);
      maxD = Math.max(...currentDists);
    }

    // Helper for export coloring
    function getExpColor(val) {
      if (maxD === minD) return `hsl(240, 100%, 50%)`;
      const t = (val - minD) / (maxD - minD);
      const hue = 240 * (1 - t);
      return `hsl(${hue}, 100%, 50%)`;
    }

    // Draw colored curves in export
    if (showCurves) {
      exCtx.lineWidth = 3;
      exCtx.lineJoin = 'round';
      exCtx.lineCap = 'round';

      const drawExpPoly = (pts) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const dist = currentDists[i] || 0;
          exCtx.beginPath();
          exCtx.strokeStyle = getExpColor(dist);
          exCtx.moveTo(p1[0], p1[1]);
          exCtx.lineTo(p2[0], p2[1]);
          exCtx.stroke();
        }
      };

      drawExpPoly(curveUpPoints);
      drawExpPoly(curveDownPoints);
    }

    // Draw Selection in export
    if (currentPoints[xSelected]) {
      const ptData = currentPoints[xSelected];
      let p1, p2;
      if (Array.isArray(ptData)) {
        p1 = normalizePoint(ptData[0]);
        p2 = normalizePoint(ptData[1]);
      }

      if (p1 && p2) {
        const distVal = currentDists[xSelected];
        const color = getExpColor(distVal);

        exCtx.strokeStyle = color;
        exCtx.fillStyle = color;
        exCtx.lineWidth = 4;

        exCtx.beginPath();
        exCtx.moveTo(p1[0], p1[1]);
        exCtx.lineTo(p2[0], p2[1]);
        exCtx.stroke();

        // Points
        exCtx.beginPath();
        exCtx.arc(p1[0], p1[1], 5, 0, Math.PI * 2);
        exCtx.arc(p2[0], p2[1], 5, 0, Math.PI * 2);
        exCtx.fill();

        // Text
        exCtx.save();
        //   exCtx.resetTransform(); // No, we want it in the scene
        // Draw Text slightly larger for high res export

        const midX = (p1[0] + p2[0]) / 2;
        const lowerY = Math.max(p1[1], p2[1]);

        exCtx.font = 'bold 30px sans-serif';
        exCtx.textAlign = 'center';
        exCtx.fillText(distVal.toFixed(2), midX, lowerY + 50);
        exCtx.restore();
      }
    }



    // --- COMPACT LEGEND (Top Left) ---
    // Make simpler and smaller
    const pad = 20;
    const boxW = 320;
    const boxH = 340;

    // Transparent Background
    exCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    exCtx.beginPath();
    exCtx.roundRect(pad, pad, boxW, boxH, 12);
    exCtx.fill();
    // Border
    exCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    exCtx.lineWidth = 1;
    exCtx.stroke();

    // Text Config
    let ty = pad + 40;
    const tx = pad + 20;

    // Title
    exCtx.textAlign = 'left';
    exCtx.fillStyle = '#0f172a'; // Slate 900
    exCtx.font = 'bold 22px sans-serif';
    exCtx.fillText("OCT Analysis", tx, ty);

    ty += 24;
    exCtx.fillStyle = '#64748b'; // Slate 500
    exCtx.font = '13px sans-serif';
    exCtx.fillText(new Date().toLocaleString(), tx, ty);

    ty += 30;

    // Helper
    const drawSection = (title) => {
      exCtx.fillStyle = '#94a3b8'; // Slate 400
      exCtx.font = 'bold 10px sans-serif';
      exCtx.fillText(title.toUpperCase(), tx, ty);
      ty += 20;
    };

    const drawRow = (label, val) => {
      exCtx.fillStyle = '#64748b'; // Label
      exCtx.font = '14px sans-serif';
      exCtx.fillText(label, tx, y = ty);

      exCtx.fillStyle = '#334155'; // Value
      exCtx.font = 'bold 14px sans-serif';
      const valW = exCtx.measureText(val).width;
      exCtx.fillText(val, tx + boxW - 40 - valW, ty); // Right align
      ty += 22;
    };

    // Global Metrics
    drawSection("Global Metrics");
    drawRow("Min Thickness", `${Math.round(minD)} µm`);
    drawRow("Max Thickness", `${Math.round(maxD)} µm`);
    drawRow("Mean Thickness", `${meanVal.toFixed(1)} µm`);
    drawRow("Std Deviation", `${stdVal ? stdVal.toFixed(1) : '--'} µm`);

    ty += 15;
    // Zonal
    drawSection("Zonal Analysis");
    drawRow("Central (33%)", `${centralMean ? centralMean.toFixed(0) : '--'} µm`);
    drawRow("Peripheral", `${periphMean ? periphMean.toFixed(0) : '--'} µm`);

    ty += 15;
    // Morphology
    drawSection("Morphology");
    drawRow("Symmetry Index", `${symIdx ? symIdx.toFixed(1) : '--'}%`);
    drawRow("Est. Radius", `${rad ? rad.toFixed(2) : '--'} mm`);

    exCtx.restore();

    // --- DRAW GRAPH AT BOTTOM ---
    // --- BOTTOM GRAPH (Compact) ---
    const graphH = 140;
    const graphPad = 30;
    const graphW = exportCanvas.width - (graphPad * 2);
    const graphY = exportCanvas.height - graphH - 30;

    if (graphW > 100) {
      exCtx.save();
      exCtx.resetTransform();

      // Background Panel
      exCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      exCtx.beginPath();
      exCtx.roundRect(graphPad, graphY, graphW, graphH, 12);
      exCtx.fill();

      // Draw Graph inside
      const gInnerX = graphPad + 40;
      const gInnerY = graphY + 30;
      const gInnerW = graphW - 60;
      const gInnerH = graphH - 50;

      // Data
      const dists = currentDists;
      if (dists.length > 0) {
        const minG = Math.min(...dists);
        const maxG = Math.max(...dists);

        // Mapping functions
        const mapX = (i) => gInnerX + (i / (dists.length - 1)) * gInnerW;
        const range = maxG - minG || 1;
        const mapY = (val) => (gInnerY + gInnerH) - ((val - minG) / range) * gInnerH;

        // Path
        exCtx.beginPath();
        exCtx.strokeStyle = '#4f46e5';
        exCtx.lineWidth = 2;

        for (let i = 0; i < dists.length; i++) {
          const px = mapX(i);
          const py = mapY(dists[i]);
          if (i === 0) exCtx.moveTo(px, py);
          else exCtx.lineTo(px, py);
        }
        exCtx.stroke();

        // LABELS for Graph
        exCtx.fillStyle = '#64748b';
        exCtx.font = '14px sans-serif';

        // Y Axis
        exCtx.textAlign = 'right';
        exCtx.fillText(`${Math.round(maxG)}`, gInnerX - 5, gInnerY + 10);
        exCtx.fillText(`${Math.round(minG)}`, gInnerX - 5, gInnerY + gInnerH);

        // X Axis
        exCtx.textAlign = 'center';
        exCtx.fillText("Position (px)", gInnerX + gInnerW / 2, gInnerY + gInnerH + 20);

        // Title
        exCtx.fillStyle = '#1e293b';
        exCtx.font = 'bold 16px sans-serif';
        exCtx.textAlign = 'left';
        exCtx.fillText("Thickness Profile", gInnerX, gInnerY - 15);
      }

      exCtx.restore();
    }

    // Download
    const link = document.createElement('a');
    link.download = `oct-report-${new Date().getTime()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  });

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

  // --- Tabs Logic ---
  function setActiveTab(tab) {
    if (tab === 'overview') {
      contentOverview.classList.remove('hidden');
      contentProfile.classList.add('hidden');

      tabOverview.classList.add('text-indigo-600', 'border-indigo-600');
      tabOverview.classList.remove('text-slate-500', 'border-transparent');

      tabProfile.classList.remove('text-indigo-600', 'border-indigo-600');
      tabProfile.classList.add('text-slate-500', 'border-transparent');
    } else {
      contentOverview.classList.add('hidden');
      contentProfile.classList.remove('hidden');

      tabProfile.classList.add('text-indigo-600', 'border-indigo-600');
      tabProfile.classList.remove('text-slate-500', 'border-transparent');

      tabOverview.classList.remove('text-indigo-600', 'border-indigo-600');
      tabOverview.classList.add('text-slate-500', 'border-transparent');

      // Trigger render for profile canvas as it was hidden
      requestAnimationFrame(updateStats);
    }
  }

  if (tabOverview && tabProfile) {
    tabOverview.addEventListener('click', () => setActiveTab('overview'));
    tabProfile.addEventListener('click', () => setActiveTab('profile'));
  }

  // --- Modal Logic ---
  if (graphPreviewCard && graphModal && closeModalBtn) {
    graphPreviewCard.addEventListener('click', () => {
      graphModal.classList.remove('hidden');
      graphModal.classList.add('flex');
      // Trigger Resize/Render
      requestAnimationFrame(updateStats);
    });

    closeModalBtn.addEventListener('click', () => {
      graphModal.classList.add('hidden');
      graphModal.classList.remove('flex');
    });

    // Close on background click
    graphModal.addEventListener('click', (e) => {
      if (e.target === graphModal) {
        graphModal.classList.add('hidden');
        graphModal.classList.remove('flex');
      }
    });
  }

});