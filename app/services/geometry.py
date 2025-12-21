import numpy as np

def getUpPointDistances(img, funcDown, funcUp):
    """Calcula distancias verticales entre curvas."""
    width = img.shape[1]
    points = []
    distances = []
    
    # Vectorización simple
    x_range = np.arange(width)
    y1_values = funcDown(x_range)
    y2_values = funcUp(x_range)
    
    distances = y1_values - y2_values
    
    # Reconstruir formato de puntos para frontend (lista de tuplas)
    # ((x, y_down), (x, y_up))
    points = []
    for x in range(width):
         points.append(((x, int(round(y1_values[x]))), (x, int(round(y2_values[x])))))
         
    return points, distances.tolist()

def getNearestPointDistances(img, funcDown, funcUp):
    """Calcula la distancia euclidiana mínima entre curvas."""
    width = img.shape[1]
    points = []
    distances = []
    
    x_range = np.arange(width)
    y1_values = funcDown(x_range)
    y2_values = funcUp(x_range)
    
    # Esto es O(N^2) más o menos, podría optimizarse con KDTree si fuera muy lento,
    # pero para anchos de imagen típicos (1000-2000px) es aceptable.
    # La implementación original ya vectorizaba la búsqueda interna.
    
    for x1 in range(width):
        y1 = y1_values[x1]
        
        x_diff = x_range - x1
        y_diff = y2_values - y1
        distances_array = np.sqrt(x_diff**2 + y_diff**2)
        min_idx = np.argmin(distances_array)
        min_dist = distances_array[min_idx]
        
        p1 = (x1, int(round(y1)))
        p2 = (int(x_range[min_idx]), int(round(y2_values[min_idx])))
        
        points.append((p1, p2))
        distances.append(min_dist)
    
    return points, distances
