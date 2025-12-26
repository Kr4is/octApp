import cv2
import numpy as np
import copy
import random

def improve_image(read_image):
    """Improves image quality using CLAHE."""
    improved_image = read_image
    clahe_of_image = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
    improved_image = clahe_of_image.apply(improved_image)
    return improved_image

def apply_morphology(read_image):
    """Applies morphological operations to clean the image."""
    morph_image = read_image
    open_kernel = np.ones((3,3), np.uint8)
    morph_image = cv2.morphologyEx(morph_image, cv2.MORPH_OPEN, open_kernel)
    close_kernel = np.ones((20,20),np.uint8)
    morph_image = cv2.morphologyEx(morph_image, cv2.MORPH_CLOSE, close_kernel)
    return morph_image

def preprocess_image(read_image):
    """Preprocessing pipeline."""
    preprocessed_image = read_image
    improved_image = improve_image(preprocessed_image)
    preprocessed_image = apply_morphology(improved_image)
    return preprocessed_image

def detect_edges(read_image):
    """Detects edges using Canny."""
    edge_detected = read_image
    edge_detected = cv2.Canny(edge_detected, 425, 150, L2gradient=True)
    return edge_detected

def get_contours(img, thr=100, method='perimeter'):
    """Obtains contours filtered by threshold."""
    cont, _ = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return [c for c in cont if (cv2.arcLength(c, True) if method == 'perimeter' else cv2.contourArea(c)) > thr]

def get_biggest_n_contours(cnt, n, method='perimeter'):
    """Returns the N largest contours."""
    kfun = None
    if method == 'area':
        kfun = lambda x: cv2.contourArea(x)
    elif method == 'perimeter':
        kfun = lambda x: cv2.arcLength(x, True)
    a = sorted(cnt, key=kfun, reverse=True)
    return a[:n]

def get_centroids(cont):
    """Calculates centroids of contours."""
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

def interpolate_curve(points):
    """Interpolates a degree 2 polynomial curve from points."""
    cont = points[1]
    cx, cy = ([a[0][0] for a in cont], [b[0][1] for b in cont])
    if not cx or not cy:
        return lambda x: 0
    return np.poly1d(np.polyfit(cx, cy, deg=2))

def process_image(read_image):
    """Processes the complete image resizing for performance."""
    scale_percent = 50
    width = int(read_image.shape[1] * scale_percent / 100)
    height = int(read_image.shape[0] * scale_percent / 100)
    dim = (width, height)
    resized = cv2.resize(read_image, dim, interpolation=cv2.INTER_AREA)
    
    preprocessed_image = preprocess_image(resized)
    edge_detected = detect_edges(preprocessed_image)
    
    edge_detected = cv2.resize(edge_detected, (read_image.shape[1], read_image.shape[0]), 
                             interpolation=cv2.INTER_LINEAR)
    return edge_detected

def get_curves(read_image, read_image_bgr):
    """Main function to obtain the top and bottom curve functions."""
    try:
        processed_image = process_image(read_image)
        
        contours = get_contours(processed_image, 800, method='area')
        if not contours:
            return lambda x: x*0, lambda x: x*0
            
        biggest_contours = get_biggest_n_contours(contours, 4, method='area')
        if len(biggest_contours) < 4:
            # Fallback to 3 or 2 if 4 are not found, but for now keeping original logic
            pass 
            
        centroids = get_centroids(biggest_contours)
        if len(centroids) < 3:
            return lambda x: x*0, lambda x: x*0
            
        # Assume first centroid is noise/exterior and remove it
        centroids.pop(0)
        
        if len(centroids) < 2:
             return lambda x: x*0, lambda x: x*0

        func_up = interpolate_curve(centroids[0])
        func_down = interpolate_curve(centroids[1])
        
        return func_up, func_down
        
    except Exception as e:
        print(f"Error in get_curves: {str(e)}")
        import traceback
        traceback.print_exc()
        return lambda x: x*0, lambda x: x*0
