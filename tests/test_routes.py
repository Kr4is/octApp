import pytest
import io
import json

def test_index_page(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'OCT Vision Pro' in response.data

def test_get_demo_images(client):
    response = client.get('/demo-images')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    # We expect some demo images since we created them in previous steps
    assert len(data) > 0
    assert any(img.endswith('.jpeg') for img in data)

def test_demo_analysis(client):
    # Test analysis of a specific demo image
    response = client.post('/', data={'filename': 'demo1.jpeg'})
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['original'] == '/static/demo_images/demo1.jpeg'
    assert 'curve_up' in json_data
    assert 'points_by_type' in json_data
    
    # Verification: Curves should NOT be all zeros (indicates fallback failure)
    curve_up = json_data['curve_up']
    # curve_up is list of [x, y]. Check if any y != 0
    y_values = [p[1] for p in curve_up]
    if not any(y != 0 for y in y_values):
        pytest.fail("Demo image produced flat/zero curves. Image processing failed.")
