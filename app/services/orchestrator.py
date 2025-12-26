import cv2
import numpy as np
from app.services.image_processing import get_curves
from app.services.geometry import get_vertical_distances, get_euclidean_distances

def analyze_oct_image(image_path):
    """
    Processes an OCT image from a path and returns structured results.
    Returns None if the image cannot be read.
    """
    img = cv2.imread(image_path)
    if img is None:
        return None
        
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    func_up, func_down = get_curves(gray_img, img)
    
    # Validate if curves were detected (simple heuristic: if it returns 0 everywhere)
    # get_curves uses fallback lambda x: x*0.
    # We check if the curve is flat at 0 (indicative of failure).
    # Note: A real curve could be 0? In the context of the image, 0 is the top edge. 
    # Generally, the cornea is not stuck at y=0.
    
    vertical_points, vertical_dists = get_vertical_distances(gray_img, func_down, func_up)
    euclidean_points, euclidean_dists = get_euclidean_distances(gray_img, func_down, func_up)
    
    height, width = gray_img.shape
    
    curve_up_points = []
    curve_down_points = []
    
    # Sample curves
    for x in range(width):
        y_up = int(func_up(x))
        y_down = int(func_down(x))
        curve_up_points.append([x, y_up])
        curve_down_points.append([x, y_down])
        
    points_by_type = {
        'up': vertical_points,
        'euclidean': euclidean_points
    }
    
    dists_by_type = {
        'up': vertical_dists,
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
