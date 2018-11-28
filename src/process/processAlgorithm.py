import sys
import cv2
import numpy as np
import scipy.ndimage as ndimage
from os import listdir
from matplotlib import pyplot as plt

casesPath = "../res/pictures"
saveImagePath = "../res/results"

def imageImprovement(readImage):
    improvedImage = readImage
    #Difuminado
    #Mediana
    improvedImage = cv2.medianBlur(improvedImage, 5)
    #Gausiana
    improvedImage = cv2.GaussianBlur(improvedImage,(3,3),0)

    #Ecualizacion adaptativa clahe
    claheOfImage = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4,4))
    improvedImage = claheOfImage.apply(improvedImage)

    #Umbralización OTSU
    _,improvedImage = cv2.threshold(improvedImage,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)

    return improvedImage

def imageMorphology(readImage):
    morphImage = readImage

    closeKernel = np.ones((3,3),np.uint8)
    morphImage = cv2.morphologyEx(morphImage, cv2.MORPH_CLOSE, closeKernel)
    morphImage = cv2.morphologyEx(morphImage, cv2.MORPH_CLOSE, closeKernel)
    morphImage = cv2.morphologyEx(morphImage, cv2.MORPH_CLOSE, closeKernel)

    return morphImage

def preprocessImage(readImage):
    preprocessedImage = readImage
    
    improvedImage = imageImprovement(preprocessedImage)
    preprocessedImage = imageMorphology(improvedImage)

    return preprocessedImage, improvedImage

def edgeDetection(readImage):
    edgeDetected = readImage
    edgeDetected = cv2.Canny(edgeDetected,450,100,L2gradient=True)
    return edgeDetected

def getOctProcessResult(readImage):
    preprocessedImage, _ = preprocessImage(readImage)
    edgeDetected = edgeDetection(preprocessedImage)
    return edgeDetected

def getOctProcessParts(readImage):
    preprocessedImage, improvedImage = preprocessImage(readImage)
    edgeDetected = edgeDetection(preprocessedImage)
    return improvedImage, preprocessedImage, edgeDetected
