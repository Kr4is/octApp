import os

import cv2
import numpy as np
import pytest

from app.services.orchestrator import analyze_oct_image

DEMO_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'static', 'demo_images')
DEMO = os.path.join(DEMO_DIR, 'demo1.jpeg')


def test_missing_file_returns_none(tmp_path):
    assert analyze_oct_image(str(tmp_path / 'nope.jpeg')) is None


def test_not_an_image_returns_none(tmp_path):
    bad = tmp_path / 'bad.jpeg'
    bad.write_text('not an image')
    assert analyze_oct_image(str(bad)) is None


def test_blank_image_gives_flat_zero_curves(tmp_path):
    path = tmp_path / 'blank.png'
    cv2.imwrite(str(path), np.zeros((60, 80, 3), dtype=np.uint8))

    result = analyze_oct_image(str(path))

    assert result['width'] == 80
    assert result['height'] == 60
    assert all(y == 0 for _, y in result['curve_up'])
    assert all(y == 0 for _, y in result['curve_down'])


@pytest.fixture(scope='module')
def demo_result():
    return analyze_oct_image(DEMO)


def test_demo_result_shape(demo_result):
    w, h = demo_result['width'], demo_result['height']
    assert (w, h) == (1180, 786)
    assert set(demo_result['points_by_type']) == {'up', 'euclidean'}
    assert set(demo_result['dists_by_type']) == {'up', 'euclidean'}
    for kind in ('up', 'euclidean'):
        assert len(demo_result['points_by_type'][kind]) == w
        assert len(demo_result['dists_by_type'][kind]) == w
    assert len(demo_result['curve_up']) == len(demo_result['curve_down']) == w


def test_demo_result_is_json_serialisable(demo_result):
    import json

    # Flask's jsonify chokes on numpy scalars, so the frontend payload must be plain python
    json.dumps(demo_result, default=lambda o: pytest.fail(f'non-serialisable: {type(o)}'))
