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
  const minDistanceEl = document.getElementById('minDistance');
  const maxDistanceEl = document.getElementById('maxDistance');
  const meanDistanceEl = document.getElementById('meanDistance');
  const stdDistanceEl = document.getElementById('stdDistance');
  const centralDistanceEl = document.getElementById('centralDistance');
  const peripheralDistanceEl = document.getElementById('peripheralDistance');
  const exportBtn = document.getElementById('exportBtn');

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
      const min = Math.min(...dists);
      const max = Math.max(...dists);

      // Calculate Mean
      const sum = dists.reduce((a, b) => a + b, 0);
      const mean = sum / dists.length;

      // Calculate Std Dev
      const squareDiffs = dists.map(value => Math.pow(value - mean, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
      const stdDev = Math.sqrt(avgSquareDiff);

      // Calculate Central vs Peripheral
      // Central: middle 33% (approx width index from 1/3 to 2/3)
      // We need to know indices. getCurrentDists returns array matching X indices 0..width.

      const w = dists.length;
      const oneThird = Math.floor(w / 3);
      const twoThirds = Math.floor(2 * w / 3);

      const centralDists = dists.slice(oneThird, twoThirds);
      // Peripheral: 0..oneThird AND twoThirds..w
      const peripheralDists = [...dists.slice(0, oneThird), ...dists.slice(twoThirds)];

      const getMean = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

      const centralMean = getMean(centralDists);
      const peripheralMean = getMean(peripheralDists);

      minDistanceEl.textContent = min.toFixed(2);
      maxDistanceEl.textContent = max.toFixed(2);
      meanDistanceEl.textContent = mean.toFixed(2);
      stdDistanceEl.textContent = stdDev.toFixed(2);

      centralDistanceEl.textContent = centralMean.toFixed(2);
      peripheralDistanceEl.textContent = peripheralMean.toFixed(2);
    } else {
      minDistanceEl.textContent = "--";
      maxDistanceEl.textContent = "--";
      meanDistanceEl.textContent = "--";
      stdDistanceEl.textContent = "--";
      centralDistanceEl.textContent = "--";
      peripheralDistanceEl.textContent = "--";
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


    // Add Legend Box (Top Left)
    const boxW = 350;
    const boxH = 200;
    const boxPad = 20;
    const boxX = 20;
    const boxY = 20;

    exCtx.save();
    exCtx.resetTransform(); // Draw legend in screen space (aka image pixel space here)

    // Semi-transparent background
    exCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    exCtx.strokeStyle = '#cbd5e1';
    exCtx.lineWidth = 1;

    // Round Rect
    const r = 10;
    exCtx.beginPath();
    exCtx.moveTo(boxX + r, boxY);
    exCtx.lineTo(boxX + boxW - r, boxY);
    exCtx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
    exCtx.lineTo(boxX + boxW, boxY + boxH - r);
    exCtx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
    exCtx.lineTo(boxX + r, boxY + boxH);
    exCtx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
    exCtx.lineTo(boxX, boxY + r);
    exCtx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
    exCtx.closePath();
    exCtx.fill();
    exCtx.stroke();

    // Text
    exCtx.fillStyle = '#1e293b';
    exCtx.font = 'bold 24px sans-serif';
    exCtx.textAlign = 'left';

    let ty = boxY + 40;
    exCtx.fillText('OCT Analysis Results', boxX + 20, ty);

    exCtx.font = '18px sans-serif';
    exCtx.fillStyle = '#475569';
    ty += 30;
    exCtx.fillText(`Min Distance: ${minDistanceEl.textContent} μm`, boxX + 20, ty);
    ty += 25;
    exCtx.fillText(`Max Distance: ${maxDistanceEl.textContent} μm`, boxX + 20, ty);
    ty += 25;
    exCtx.fillText(`Mean Distance: ${meanDistanceEl.textContent} μm`, boxX + 20, ty);
    ty += 25;
    exCtx.fillText(`Std Deviation: ${stdDistanceEl.textContent} μm`, boxX + 20, ty);
    ty += 25;

    exCtx.fillStyle = '#4f46e5';
    exCtx.fillText(`Central: ${centralDistanceEl.textContent} μm`, boxX + 20, ty);
    exCtx.fillStyle = '#475569';
    ty += 25;
    exCtx.fillText(`Peripheral: ${peripheralDistanceEl.textContent} μm`, boxX + 20, ty);

    exCtx.restore();

    // Download
    const link = document.createElement('a');
    link.download = 'oct-analysis-result.png';
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

});