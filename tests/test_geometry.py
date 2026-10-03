import numpy as np
import pytest

from app.services.geometry import get_euclidean_distances, get_vertical_distances


@pytest.fixture
def img():
    return np.zeros((100, 100), dtype=np.uint8)


def test_vertical_parallel_curves(img):
    points, dists = get_vertical_distances(img, lambda x: x * 0 + 20, lambda x: x * 0 + 10)

    assert len(points) == len(dists) == 100
    assert all(d == 10 for d in dists)
    assert points[5] == ((5, 20), (5, 10))


def test_euclidean_parallel_curves_matches_vertical(img):
    points, dists = get_euclidean_distances(img, lambda x: x * 0 + 20, lambda x: x * 0 + 10)

    assert len(points) == len(dists) == 100
    assert all(abs(d - 10) < 0.1 for d in dists)


def test_euclidean_never_exceeds_vertical_on_sloped_curves(img):
    func_up = lambda x: x * 0.5 + 10
    func_down = lambda x: x * 0.5 + 40

    _, vertical = get_vertical_distances(img, func_down, func_up)
    _, euclid = get_euclidean_distances(img, func_down, func_up)

    # The shortest segment between two curves can't be longer than the vertical one
    assert all(e <= v + 1e-6 for e, v in zip(euclid, vertical, strict=True))
    assert min(euclid) < min(vertical)


def test_euclidean_points_lie_on_curve_up(img):
    func_up = lambda x: x * 0 + 10
    func_down = lambda x: x * 0 + 30

    points, _ = get_euclidean_distances(img, func_down, func_up)

    for p_down, p_up in points:
        assert p_down[1] == 30
        assert p_up[1] == 10


def test_vertical_negative_when_curves_cross(img):
    # down above up -> negative distance; pins current behaviour
    _, dists = get_vertical_distances(img, lambda x: x * 0 + 5, lambda x: x * 0 + 15)
    assert all(d == -10 for d in dists)
