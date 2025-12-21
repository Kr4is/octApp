import cv2
import numpy as np
import copy
import random

def imageImprovement(readImage):
    """Mejora la calidad de la imagen usando CLAHE."""
    improvedImage = readImage
    claheOfImage = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
    improvedImage = claheOfImage.apply(improvedImage)
    return improvedImage

def imageMorphology(readImage):
    """Aplica operaciones morfológicas para limpiar la imagen."""
    morphImage = readImage
    openKernel = np.ones((3,3), np.uint8)
    morphImage = cv2.morphologyEx(morphImage, cv2.MORPH_OPEN, openKernel)
    closeKernel = np.ones((20,20),np.uint8)
    morphImage = cv2.morphologyEx(morphImage, cv2.MORPH_CLOSE, closeKernel)
    return morphImage

def preprocessImage(readImage):
    """Pipeline de preprocesamiento."""
    preprocessedImage = readImage
    improvedImage = imageImprovement(preprocessedImage)
    preprocessedImage = imageMorphology(improvedImage)
    return preprocessedImage

def edgeDetection(readImage):
    """Detecta bordes usando Canny."""
    edgeDetected = readImage
    edgeDetected = cv2.Canny(edgeDetected, 425, 150, L2gradient=True)
    return edgeDetected

def getCountours(img, thr=100, method='perimeter'):
    """Obtiene contornos filtrados por umbral."""
    cont, _ = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return [c for c in cont if (cv2.arcLength(c, True) if method == 'perimeter' else cv2.contourArea(c)) > thr]

def getBiggestNCont(cnt, n, method='perimeter'):
    """Devuelve los N contornos más grandes."""
    kfun = None
    if method == 'area':
        kfun = lambda x: cv2.contourArea(x)
    elif method == 'perimeter':
        kfun = lambda x: cv2.arcLength(x, True)
    a = sorted(cnt, key=kfun, reverse=True)
    return a[:n]

def getCentroids(cont):
    """Calcula los centroides de los contornos."""
    centroids = []
    kfun = lambda x: x[0][1]
    for c in cont:
        M = cv2.moments(c)
        if M["m00"] != 0:
            cX = int(M["m10"] / M["m00"])
            cY = int(M["m01"] / M["m00"])
            centroids.append(((cX, cY), c))
    centroids = sorted(centroids, key=kfun, reverse=False)
    return centroids

def interpCurve(points):
    """Interpola una curva polinómica de grado 2 a partir de puntos."""
    cont = points[1]
    cx, cy = ([a[0][0] for a in cont], [b[0][1] for b in cont])
    if not cx or not cy:
        return lambda x: 0
    return np.poly1d(np.polyfit(cx, cy, deg=2))

def processImage(readImage):
    """Procesa la imagen completa redimensionando para rendimiento."""
    scale_percent = 50
    width = int(readImage.shape[1] * scale_percent / 100)
    height = int(readImage.shape[0] * scale_percent / 100)
    dim = (width, height)
    resized = cv2.resize(readImage, dim, interpolation=cv2.INTER_AREA)
    
    preprocessedImage = preprocessImage(resized)
    edgeDetected = edgeDetection(preprocessedImage)
    
    edgeDetected = cv2.resize(edgeDetected, (readImage.shape[1], readImage.shape[0]), 
                             interpolation=cv2.INTER_LINEAR)
    return edgeDetected

def getCurves(readImage, readImageBGR):
    """Función principal para obtener las funciones de las curvas superior e inferior."""
    try:
        processedImage = processImage(readImage)
        preImg = processedImage
        
        cont = getCountours(preImg, 800, method='area')
        if not cont:
            return lambda x: x*0, lambda x: x*0
            
        bc = getBiggestNCont(cont, 4, method='area')
        if len(bc) < 4:
            # Fallback a 3 o 2 si no encuentra 4, pero por ahora mantenemos lógica original
            # Podríamos mejorar esto en el futuro
            pass 
            
        centroids = getCentroids(bc)
        if len(centroids) < 3:
            return lambda x: x*0, lambda x: x*0
            
        # Asumimos que el primer centroide es ruido/exterior y lo quitamos
        centroids.pop(0)
        
        if len(centroids) < 2:
             return lambda x: x*0, lambda x: x*0

        funcUp = interpCurve(centroids[0])
        funcDown = interpCurve(centroids[1])
        
        return funcUp, funcDown
        
    except Exception as e:
        print(f"Error en getCurves: {str(e)}")
        import traceback
        traceback.print_exc()
        return lambda x: x*0, lambda x: x*0
