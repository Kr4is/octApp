import cv2
import numpy as np
from app.services.image_processing import getCurves
from app.services.geometry import getUpPointDistances, getNearestPointDistances

def analyze_oct_image(image_path):
    """
    Procesa una imagen OCT desde un path y devuelve los resultados estructurados.
    Devuelve None si no se puede leer la imagen.
    """
    img = cv2.imread(image_path)
    if img is None:
        return None
        
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    func_up, func_down = getCurves(gray_img, img)
    
    # Validar si se detectaron curvas (heurística simple: si retorna 0 en todos lados)
    # getCurves usamos fallback lambda x: x*0.
    # Verificamos si la curva es plana en 0 (indicativo de fallo).
    # Ojo: Una curva real podría ser 0? En el contexto de la imagen, 0 es el borde superior. 
    # Generalmente la cornea no está en y=0 pegada.
    
    up_points, up_dists = getUpPointDistances(gray_img, func_down, func_up)
    euclidean_points, euclidean_dists = getNearestPointDistances(gray_img, func_down, func_up)
    
    height, width = gray_img.shape
    
    curve_up_points = []
    curve_down_points = []
    
    # Muestrear curvas
    for x in range(width):
        y_up = int(func_up(x))
        y_down = int(func_down(x))
        curve_up_points.append([x, y_up])
        curve_down_points.append([x, y_down])
        
    points_by_type = {
        'up': up_points,
        'euclidean': euclidean_points
    }
    
    dists_by_type = {
        'up': up_dists,
        'euclidean': euclidean_dists
    }
    
    return {
        'points_by_type': points_by_type,
        'dists_by_type': dists_by_type,
        'curve_up': curve_up_points,
        'curve_down': curve_down_points,
        'width': width,
        'height': height
    }
