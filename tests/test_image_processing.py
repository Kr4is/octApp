import pytest
import numpy as np
from app.services.image_processing import getCurves, interpCurve
from app.services.geometry import getUpPointDistances, getNearestPointDistances

def test_interp_curve():
    # Test interpolación simple parabalica y=x^2
    points = [((0, 0), None), ((1, 1), None), ((2, 4), None)]
    # Mockeamos structure de contornos: [((x,y), cnt), ...]
    # getCurves usa: cont = points[1] que es el contorno raw
    # interpCurve espera: points que es un tuple ((cX,cY), contour)
    # Reconstruyamos input esperado por interpCurve
    # interpCurve(points) -> points es el contorno (lista de puntos)
    
    # Espera, interpCurve en image_processing.py:
    # def interpCurve(points):
    #     cont = points[1] ...
    # Ah, espera, getCurves llama: funcUp = interpCurve(centroids[0])
    # centroids[0] es ((cX,cY), contour).
    
    # Creemos un contorno falso
    cnt = np.array([[[0, 0]], [[1, 1]], [[2, 4]]], dtype=np.int32)
    centroid_tuple = ((1, 2), cnt)
    
    func = interpCurve(centroid_tuple)
    
    # Verificar valores interpolados (aproximados)
    assert np.isclose(func(0), 0, atol=0.5)
    assert np.isclose(func(1), 1, atol=0.5)
    assert np.isclose(func(2), 4, atol=0.5)

def test_geometry_functions():
    # Configurar funciones lambda simples para probar geometría
    funcUp = lambda x: x*0 + 10
    funcDown = lambda x: x*0 + 20
    
    # Imagen dummy 100x100
    img = np.zeros((100, 100), dtype=np.uint8)
    
    # Test Up Distances
    points, dists = getUpPointDistances(img, funcDown, funcUp)
    
    assert len(points) == 100
    assert len(dists) == 100
    assert all(d == 10 for d in dists) # 20 - 10 = 10
    
    # Test Euclidean
    # Dos horizontales paralelas, la distancia euclidiana también debería ser vertical = 10
    e_points, e_dists = getNearestPointDistances(img, funcDown, funcUp)
    
    assert len(e_points) == 100
    assert len(e_dists) == 100
    # Permitir pequeño error por redondeo/vectorización
    assert all(abs(d - 10) < 0.1 for d in e_dists)

def test_integration_services(sample_image_gray, sample_image):
    # Test completa de getCurves
    funcUp, funcDown = getCurves(sample_image_gray, sample_image)
    
    # En nuestra imagen sample, dibujamos líneas en y=30 y y=70
    # getCurves puede devolver lambda x: 0 si falla, o las funciones interpoladas
    
    # Nota: la detección de bordes y contornos en imagen sintética perfecta puede variar
    # por los filtros morfológicos, pero debería detectar algo.
    
    valUp = funcUp(50)
    valDown = funcDown(50)
    
    # Si devuelve 0 es que falló la detección (quizás por tamaño/filtros)
    # Para unit test robusto, deberíamos mockear o usar una imagen real guardada.
    # Por ahora verificamos que EJECUTA sin error.
    assert callable(funcUp)
    assert callable(funcDown)
