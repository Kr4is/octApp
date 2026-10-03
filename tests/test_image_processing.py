import cv2
import numpy as np

from app.services.image_processing import (
    detect_edges,
    get_biggest_n_contours,
    get_centroids,
    get_contours,
    get_curves,
    improve_image,
    interpolate_curve,
    process_image,
)


def _rect(x, y, w, h):
    """OpenCV-style contour (N,1,2) for a rectangle."""
    return np.array([[[x, y]], [[x + w, y]], [[x + w, y + h]], [[x, y + h]]], dtype=np.int32)


def test_interpolate_curve():
    # interpolate_curve takes a (centroid, contour) tuple, as built by get_centroids
    cnt = np.array([[[0, 0]], [[1, 1]], [[2, 4]]], dtype=np.int32)
    func = interpolate_curve(((1, 2), cnt))

    assert np.isclose(func(0), 0, atol=0.5)
    assert np.isclose(func(1), 1, atol=0.5)
    assert np.isclose(func(2), 4, atol=0.5)


def test_interpolate_curve_empty_contour_returns_zero():
    func = interpolate_curve(((0, 0), []))
    assert func(10) == 0


def test_improve_image_keeps_shape_and_dtype(sample_image_gray):
    out = improve_image(sample_image_gray)
    assert out.shape == sample_image_gray.shape
    assert out.dtype == np.uint8


def test_detect_edges_is_binary(sample_image_gray):
    edges = detect_edges(sample_image_gray)
    assert set(np.unique(edges)) <= {0, 255}


def test_get_contours_filters_by_area():
    img = np.zeros((200, 200), dtype=np.uint8)
    cv2.rectangle(img, (10, 10), (100, 100), 255, -1)  # large
    cv2.rectangle(img, (150, 150), (155, 155), 255, -1)  # tiny

    assert len(get_contours(img, thr=100, method='area')) == 1
    assert len(get_contours(img, thr=1, method='area')) == 2


def test_get_biggest_n_contours_orders_by_area():
    small, mid, big = _rect(0, 0, 5, 5), _rect(0, 0, 20, 20), _rect(0, 0, 50, 50)

    top = get_biggest_n_contours([small, big, mid], 2, method='area')

    assert len(top) == 2
    assert cv2.contourArea(top[0]) > cv2.contourArea(top[1])
    assert cv2.contourArea(top[0]) == cv2.contourArea(big)


def test_get_centroids_sorted_top_to_bottom_and_skips_degenerate():
    low = _rect(10, 80, 20, 10)
    high = _rect(10, 10, 20, 10)
    degenerate = np.array([[[5, 5]], [[5, 5]]], dtype=np.int32)  # zero area

    centroids = get_centroids([low, degenerate, high])

    assert len(centroids) == 2
    ys = [c[0][1] for c in centroids]
    assert ys == sorted(ys)
    assert centroids[0][0] == (20, 15)


def test_process_image_preserves_size(sample_image_gray):
    out = process_image(sample_image_gray)
    assert out.shape == sample_image_gray.shape


def test_get_curves_blank_image_falls_back_to_flat_zero():
    blank = np.zeros((100, 100), dtype=np.uint8)
    bgr = cv2.cvtColor(blank, cv2.COLOR_GRAY2BGR)

    func_up, func_down = get_curves(blank, bgr)

    xs = np.arange(100)
    assert np.all(func_up(xs) == 0)
    assert np.all(func_down(xs) == 0)


def test_get_curves_returns_callables(sample_image_gray, sample_image):
    func_up, func_down = get_curves(sample_image_gray, sample_image)
    assert callable(func_up)
    assert callable(func_down)
