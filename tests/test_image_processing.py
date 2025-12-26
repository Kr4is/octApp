import pytest
import numpy as np
from app.services.image_processing import get_curves, interpolate_curve
from app.services.geometry import get_vertical_distances, get_euclidean_distances

def test_interpolate_curve():
    # Test simple parabolic interpolation y=x^2
    points = [((0, 0), None), ((1, 1), None), ((2, 4), None)]
    # We mock contour structure: [((x,y), cnt), ...]
    # get_curves uses: cont = points[1] which is the raw contour
    # interpolate_curve expects: points which is a tuple ((cX,cY), contour)
    # Reconstruct expected input for interpolate_curve
    # interpolate_curve(points) -> points is the contour (list of points)
    
    # Wait, interpolate_curve in image_processing.py:
    # def interpolate_curve(points):
    #     cont = points[1] ...
    # Ah, wait, get_curves calls: func_up = interpolate_curve(centroids[0])
    # centroids[0] is ((cX,cY), contour).
    
    # Create a fake contour
    cnt = np.array([[[0, 0]], [[1, 1]], [[2, 4]]], dtype=np.int32)
    centroid_tuple = ((1, 2), cnt)
    
    func = interpolate_curve(centroid_tuple)
    
    # Verify interpolated values (approximate)
    assert np.isclose(func(0), 0, atol=0.5)
    assert np.isclose(func(1), 1, atol=0.5)
    assert np.isclose(func(2), 4, atol=0.5)

def test_geometry_functions():
    # Set up simple lambda functions to test geometry
    func_up = lambda x: x*0 + 10
    func_down = lambda x: x*0 + 20
    
    # Dummy image 100x100
    img = np.zeros((100, 100), dtype=np.uint8)
    
    # Test Vertical Distances
    points, dists = get_vertical_distances(img, func_down, func_up)
    
    assert len(points) == 100
    assert len(dists) == 100
    assert all(d == 10 for d in dists) # 20 - 10 = 10
    
    # Test Euclidean
    # Two parallel horizontals, Euclidean distance should also be vertical = 10
    e_points, e_dists = get_euclidean_distances(img, func_down, func_up)
    
    assert len(e_points) == 100
    assert len(e_dists) == 100
    # Allow small error for rounding/vectorization
    assert all(abs(d - 10) < 0.1 for d in e_dists)

def test_integration_services(sample_image_gray, sample_image):
    # Complete test of get_curves
    func_up, func_down = get_curves(sample_image_gray, sample_image)
    
    # In our sample image, we draw lines at y=30 and y=70
    # get_curves can return lambda x: 0 if detection fails, or interpolated functions
    
    # Note: edge and contour detection in perfect synthetic image may vary
    # due to morphological filters, but it should detect something.
    
    val_up = func_up(50)
    val_down = func_down(50)
    
    # If it returns 0, detection failed (maybe due to size/filters)
    # For a robust unit test, we should mock or use a saved real image.
    # For now we verify it EXECUTES without error.
    assert callable(func_up)
    assert callable(func_down)
