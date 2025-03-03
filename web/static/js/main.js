document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('imageInput');
  const originalImage = document.getElementById('originalImage');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const ctx = overlayCanvas.getContext('2d');

  const xSlider = document.getElementById('xSlider');
  const xValue = document.getElementById('xValue');
  const showAllCheckbox = document.getElementById('showAll');
  const distanceRadios = document.getElementsByName('distanceType');
  const toggleCurvesBtn = document.getElementById('toggleCurvesBtn');

  // Variables globales para datos
  let allPoints = {};         // Todos los puntos para cada tipo de distancia
  let allDists = {};          // Todas las distancias para cada tipo de distancia
  let curveUpPoints = [];     // Array de [x, y] para la curva de arriba
  let curveDownPoints = [];   // Array de [x, y] para la curva de abajo
  let originalWidth = 0;
  let originalHeight = 0;
  let showCurves = false;     // Controla si dibujamos las curvas
  
  // Obtener el tipo de distancia seleccionado
  function getDistanceType() {
    return document.querySelector('input[name="distanceType"]:checked').value;
  }
  
  // Obtener puntos actuales según tipo de distancia
  function getCurrentPoints() {
    const distType = getDistanceType();
    return allPoints[distType] || [];
  }
  
  // Obtener distancias actuales según tipo de distancia
  function getCurrentDists() {
    const distType = getDistanceType();
    return allDists[distType] || [];
  }

  // Ajustar el tamaño del canvas para que coincida exactamente con la imagen mostrada
  function resizeCanvas() {
    if (originalWidth === 0 || originalHeight === 0) return;
    
    // Limpiar cualquier estilo previo
    overlayCanvas.style.position = '';
    overlayCanvas.style.top = '';
    overlayCanvas.style.left = '';
    
    // Obtener el tamaño real que ocupa la imagen en pantalla
    const displayedWidth = originalImage.clientWidth;
    const displayedHeight = originalImage.clientHeight;
    
    // Establecer el canvas con el mismo tamaño que la imagen mostrada
    overlayCanvas.width = displayedWidth;
    overlayCanvas.height = displayedHeight;
    
    // Posicionar el canvas exactamente encima de la imagen
    const imageRect = originalImage.getBoundingClientRect();
    const containerRect = originalImage.parentElement.getBoundingClientRect();
    
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.top = `${imageRect.top - containerRect.top}px`;
    overlayCanvas.style.left = `${imageRect.left - containerRect.left}px`;
    
    console.log("Canvas resized to:", overlayCanvas.width, "x", overlayCanvas.height);
    console.log("Image displayed size:", displayedWidth, "x", displayedHeight);
  }

  // Función para calcular la escala correcta entre coordenadas de la imagen original y el canvas
  function getScaleFactors() {
    const displayedWidth = overlayCanvas.width;
    const displayedHeight = overlayCanvas.height;
    
    // Calcular factores de escala basados en cómo se muestra la imagen (object-contain)
    let scaleX, scaleY;
    let offsetX = 0, offsetY = 0;
    
    // Cuando la imagen se muestra con object-contain, mantiene su relación de aspecto
    const originalAspect = originalWidth / originalHeight;
    const displayedAspect = displayedWidth / displayedHeight;
    
    if (displayedAspect > originalAspect) {
      // La altura limita el tamaño de la imagen
      const actualDisplayedWidth = displayedHeight * originalAspect;
      offsetX = (displayedWidth - actualDisplayedWidth) / 2;
      
      scaleX = actualDisplayedWidth / originalWidth;
      scaleY = displayedHeight / originalHeight;
    } else {
      // El ancho limita el tamaño de la imagen
      const actualDisplayedHeight = displayedWidth / originalAspect;
      offsetY = (displayedHeight - actualDisplayedHeight) / 2;
      
      scaleX = displayedWidth / originalWidth;
      scaleY = actualDisplayedHeight / originalHeight;
    }
    
    // Aplicar transformación para centrar correctamente
    ctx.resetTransform();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scaleX, scaleY);
    
    return { scaleX, scaleY, offsetX, offsetY };
  }

  // Dibuja un polilínea a partir de un array de puntos [x, y]
  function drawPolyline(pointsArray, color) {
    if (!pointsArray || pointsArray.length === 0) return;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < pointsArray.length; i++) {
      const [px, py] = pointsArray[i];
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  // Función para normalizar el formato de un punto
  function normalizePoint(point) {
    if (Array.isArray(point) && point.length >= 2) {
      return [point[0], point[1]];
    } else if (point && typeof point === 'object' && point.x !== undefined && point.y !== undefined) {
      return [point.x, point.y];
    }
    console.error("Formato de punto no reconocido:", point);
    return null;
  }

  // Función para dibujar sobre el canvas
  function drawOverlay() {
    // Limpiar todo el canvas
    ctx.resetTransform();
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Preparar la transformación
    getScaleFactors();
    
    const distType = getDistanceType();
    const xSelected = parseInt(xSlider.value, 10);
    const showAll = showAllCheckbox.checked;
    const currentPoints = getCurrentPoints();
    const currentDists = getCurrentDists();

    // Debug para verificar la estructura de datos
    console.log("Current distance type:", distType);
    console.log("All Points structure:", allPoints);
    console.log("Current points length:", currentPoints?.length);
    console.log("Selected index:", xSelected);
    
    // Dibujar curvas
    if (showCurves) {
      drawPolyline(curveUpPoints, '#00ff00');
      drawPolyline(curveDownPoints, '#ff00ff');
    }

    // Configuración para dibujar puntos
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    // Dibujar puntos según el tipo de distancia
    if (distType === 'up') {
      // Distancia a punto superior
      if (showAll) {
        // Mostrar todos los puntos
        for (let i = 0; i < currentPoints.length; i++) {
          if (!currentPoints[i]) continue;
          
          const normalizedPoint = normalizePoint(currentPoints[i]);
          if (!normalizedPoint) continue;
          
          const [x, y] = normalizedPoint;
          
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Mostrar valor de distancia
          if (currentDists[i] !== undefined) {
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(currentDists[i].toFixed(2), x + 5, y - 5);
            ctx.fillStyle = 'red';
          }
        }
      } else if (currentPoints[xSelected]) {
        // Mostrar solo el punto seleccionado
        const normalizedPoint = normalizePoint(currentPoints[xSelected]);
        if (!normalizedPoint) return;
        
        const [x, y] = normalizedPoint;
        
        // Dibujar círculo
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Mostrar valor de distancia
        if (currentDists[xSelected] !== undefined) {
          ctx.fillStyle = 'blue';
          ctx.font = '14px Arial';
          ctx.fillText(currentDists[xSelected].toFixed(2), x + 8, y - 8);
        }
      }
    } else if (distType === 'euclidean') {
      // Distancia euclidiana (pares de puntos)
      if (showAll) {
        // Mostrar todos los pares de puntos
        for (let i = 0; i < currentPoints.length; i++) {
          if (!currentPoints[i]) continue;
          
          // Para el tipo euclidiano, esperamos un array que contiene dos puntos
          let p1, p2;
          
          if (Array.isArray(currentPoints[i]) && currentPoints[i].length >= 2) {
            // Si tenemos un par de puntos
            p1 = normalizePoint(currentPoints[i][0]);
            p2 = normalizePoint(currentPoints[i][1]);
          } else {
            console.error("Formato euclidiano no reconocido:", currentPoints[i]);
            continue;
          }
          
          if (!p1 || !p2) continue;
          
          // Dibujar los puntos
          ctx.beginPath();
          ctx.arc(p1[0], p1[1], 3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(p2[0], p2[1], 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Dibujar línea entre los puntos
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.stroke();
          
          // Mostrar valor de distancia
          if (currentDists[i] !== undefined) {
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            const midX = (p1[0] + p2[0]) / 2;
            const midY = (p1[1] + p2[1]) / 2;
            ctx.fillText(currentDists[i].toFixed(2), midX, midY - 5);
            ctx.fillStyle = 'red';
          }
        }
      } else if (currentPoints[xSelected]) {
        // Mostrar solo el par seleccionado
        let p1, p2;
        
        if (Array.isArray(currentPoints[xSelected]) && currentPoints[xSelected].length >= 2) {
          p1 = normalizePoint(currentPoints[xSelected][0]);
          p2 = normalizePoint(currentPoints[xSelected][1]);
        } else {
          console.error("Formato euclidiano no reconocido:", currentPoints[xSelected]);
          return;
        }
        
        if (!p1 || !p2) return;
        
        // Dibujar puntos más grandes
        ctx.beginPath();
        ctx.arc(p1[0], p1[1], 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(p2[0], p2[1], 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar línea de conexión
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
        
        // Mostrar valor de distancia
        if (currentDists[xSelected] !== undefined) {
          ctx.fillStyle = 'blue';
          ctx.font = '14px Arial';
          const midX = (p1[0] + p2[0]) / 2;
          const midY = (p1[1] + p2[1]) / 2;
          ctx.fillText(currentDists[xSelected].toFixed(2), midX, midY - 8);
        }
      }
    }
  }

  // Maneja la carga de imagen (única petición al servidor)
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    fetch('/', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Guardar datos recibidos del servidor
      originalImage.src = data.original;
      originalWidth = data.width;
      originalHeight = data.height;
      curveUpPoints = data.curve_up || [];
      curveDownPoints = data.curve_down || [];
      
      // Inicializar estructuras para diferentes tipos de distancia
      allPoints = {};
      allDists = {};
      
      // Si el servidor proporciona puntos y distancias separados por tipo
      if (data.points_by_type && data.dists_by_type) {
        allPoints = data.points_by_type;
        allDists = data.dists_by_type;
        
        // Depuración para verificar la estructura de los puntos recibidos
        console.log("Received points_by_type:", data.points_by_type);
        console.log("Received dists_by_type:", data.dists_by_type);
      } 
      // Si el servidor proporciona estructura específica para cada tipo
      else if (data.up_points && data.euclidean_points) {
        allPoints.up = data.up_points;
        allPoints.euclidean = data.euclidean_points;
        allDists.up = data.up_dists || [];
        allDists.euclidean = data.euclidean_dists || [];
      } 
      // Si el servidor solo proporciona un conjunto de puntos y distancias
      else {
        // Usamos los mismos datos para ambos tipos
        allPoints.up = data.points || [];
        allPoints.euclidean = data.points || [];
        allDists.up = data.dists || [];
        allDists.euclidean = data.dists || [];
      }
      
      console.log("Loaded data:", {
        width: originalWidth,
        height: originalHeight,
        upPoints: allPoints.up?.length,
        euclideanPoints: allPoints.euclidean?.length,
        curveUp: curveUpPoints?.length
      });

      // Configurar slider
      xSlider.max = originalWidth - 1;
      xSlider.value = 0;
      xValue.textContent = '0';

      // Cuando la imagen se cargue, ajustar canvas y dibujar
      originalImage.onload = () => {
        // Esperar a que la imagen se renderice completamente
        setTimeout(() => {
          resizeCanvas();
          drawOverlay();
        }, 200);
      };
    })
    .catch(error => {
      console.error('Error al cargar la imagen:', error);
      alert('Error al procesar la imagen. Por favor, inténtalo de nuevo.');
    });
  });

  // Cuando se redimensiona la ventana, reajustamos el canvas y volvemos a dibujar
  window.addEventListener('resize', () => {
    // Esperar a que el resize se complete
    setTimeout(() => {
      resizeCanvas();
      drawOverlay();
    }, 100);
  });

  // Cambios en el slider -> solo redibuja (sin petición)
  xSlider.addEventListener('input', () => {
    xValue.textContent = xSlider.value;
    drawOverlay();
  });

  // Cambios en el checkbox "Mostrar todos" -> solo redibuja (sin petición)
  showAllCheckbox.addEventListener('change', () => {
    drawOverlay();
  });

  // Botón para mostrar/ocultar curvas
  toggleCurvesBtn.addEventListener('click', () => {
    showCurves = !showCurves;
    toggleCurvesBtn.textContent = showCurves ? 'Ocultar Curvas' : 'Mostrar Curvas';
    drawOverlay();
  });

  // Cambios en los radios para tipo de distancia -> solo redibuja (sin petición)
  distanceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      console.log("Changed distance type to:", getDistanceType());
      drawOverlay();
    });
  });
});