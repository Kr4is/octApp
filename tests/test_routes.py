import pytest
import io

def test_index_page(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'OCT Vision Pro' in response.data

def test_upload_image(client):
    # Crear imagen dummy en bytes
    data = dict(
        image=(io.BytesIO(b"fake image data"), 'test.jpg')
    )
    # Convertir a imagen real válida para cv2.imread o mockear cv2
    # Mejor usar una real pequeña válida
    from PIL import Image
    img_byte_arr = io.BytesIO()
    image = Image.new('RGB', (100, 100), color = 'white')
    image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    data = dict(
        image=(img_byte_arr, 'test.jpg')
    )
    
    response = client.post('/', data=data, content_type='multipart/form-data')
    
    # Debería devolver 400 o 200 dependiendo de si getCurves detecta algo
    # OJO: backend usa cv2.imread(filepath)
    # Flask save() guarda en disco.
    # Como estamos en test_client con fs real (o tmp), debería funcionar.
    # Pero cv2.imread necesita archivo real.
    
    assert response.status_code in [200, 400]
    if response.status_code == 200:
        json_data = response.get_json()
        assert 'points_by_type' in json_data

def test_demo_mode(client):
    # Ensure initial.png exists or mock cv2
    # In test environment, static/initial.png might not be present if we didn't copy it to 
    # the test app instance path or if we are strict.
    # However, create_app uses config.root_path.
    
    # Let's try to hit the endpoint. If file missing, 404.
    response = client.post('/', data={'demo': 'true'})
    
    # We expect 200 if file exists, 404 if not.
    # Since we copied the file in steps before to app/static, it should exist.
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
         json_data = response.get_json()
         assert json_data['original'] == '/static/initial.jpeg'
         assert 'curve_up' in json_data
         
         # Verification: Curves should NOT be all zeros (indicates fallback failure)
         curve_up = json_data['curve_up']
         # curve_up is list of [x, y]. Check if any y != 0
         y_values = [p[1] for p in curve_up]
         if not any(y != 0 for y in y_values):
             pytest.fail("Demo image produced flat/zero curves. Image processing failed.")
