import pytest
import os
import cv2
import numpy as np
from app import create_app

@pytest.fixture
def app():
    app = create_app({'TESTING': True, 'UPLOAD_FOLDER': '/tmp/test_uploads'})
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def sample_image():
    # Create a synthetic image for testing
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    # Draw two white lines simulating curves
    cv2.line(img, (0, 30), (100, 30), (255, 255, 255), 2) # Top curve
    cv2.line(img, (0, 70), (100, 70), (255, 255, 255), 2) # Bottom curve
    return img

@pytest.fixture
def sample_image_gray(sample_image):
    return cv2.cvtColor(sample_image, cv2.COLOR_BGR2GRAY)
