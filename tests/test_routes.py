import pytest


def test_landing_page(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'OCT Vision' in response.data
    assert b'href="/app"' in response.data


def test_app_page(client):
    response = client.get('/app')
    assert response.status_code == 200
    # main.js looks these up by id
    for element_id in (b'selectDemoBtn', b'xSlider', b'overlayCanvas', b'tabOverview', b'exportBtn'):
        assert b'id="' + element_id + b'"' in response.data


def test_post_to_landing_not_allowed(client):
    assert client.post('/', data={'filename': 'demo1.jpeg'}).status_code == 405


def test_get_demo_images(client):
    response = client.get('/demo-images')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(img.endswith('.jpeg') for img in data)
    assert data == sorted(data)


def test_demo_analysis(client):
    response = client.post('/app', data={'filename': 'demo1.jpeg'})

    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['original'] == '/static/demo_images/demo1.jpeg'
    assert 'curve_up' in json_data
    assert 'points_by_type' in json_data

    # Curves should NOT be all zeros (indicates fallback failure)
    y_values = [p[1] for p in json_data['curve_up']]
    if not any(y != 0 for y in y_values):
        pytest.fail("Demo image produced flat/zero curves. Image processing failed.")


def test_demo_analysis_requires_filename(client):
    response = client.post('/app', data={})
    assert response.status_code == 400
    assert 'error' in response.get_json()


def test_demo_analysis_unknown_file(client):
    response = client.post('/app', data={'filename': 'missing.jpeg'})
    assert response.status_code == 404


def test_demo_analysis_blocks_path_traversal(client):
    response = client.post('/app', data={'filename': '../../../../etc/passwd'})
    assert response.status_code == 404


def test_demo_analysis_unreadable_image_is_500(client, app, monkeypatch):
    monkeypatch.setattr('app.routes.analyze_oct_image', lambda _path: None)
    response = client.post('/app', data={'filename': 'demo1.jpeg'})
    assert response.status_code == 500


def test_serve_upload(client, app, tmp_path):
    app.config['UPLOAD_FOLDER'] = str(tmp_path)
    (tmp_path / 'scan.txt').write_text('hello')

    response = client.get('/uploads/scan.txt')

    assert response.status_code == 200
    assert response.data == b'hello'
    assert client.get('/uploads/absent.txt').status_code == 404
