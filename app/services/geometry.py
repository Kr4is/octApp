import numpy as np

def get_vertical_distances(img, func_down, func_up):
    """Calculates vertical distances between curves."""
    width = img.shape[1]
    
    # Simple vectorization
    x_range = np.arange(width)
    y1_values = func_down(x_range)
    y2_values = func_up(x_range)
    
    distances = y1_values - y2_values
    
    # Reconstruct point format for frontend (list of tuples)
    # ((x, y_down), (x, y_up))
    points = []
    for x in range(width):
         points.append(((x, int(round(y1_values[x]))), (x, int(round(y2_values[x])))))
         
    return points, distances.tolist()

def get_euclidean_distances(img, func_down, func_up):
    """Calculates the minimum Euclidean distance between curves."""
    width = img.shape[1]
    points = []
    distances = []
    
    x_range = np.arange(width)
    y1_values = func_down(x_range)
    y2_values = func_up(x_range)
    
    # This is roughly O(N^2), could be optimized with KDTree if it were very slow,
    # but for typical image widths (1000-2000px) it is acceptable.
    # The original implementation already vectorized the internal search.
    
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
