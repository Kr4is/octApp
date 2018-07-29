#!/usr/bin/python3
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

def seeComparative(initialImage,images):
    comparative = initialImage
    for image in images:
        comparative = np.concatenate((comparative,image), axis=1)
    plt.imshow(comparative)
    mng = plt.get_current_fig_manager()
    #mng.resize(*mng.window.maxsize())
    mng.full_screen_toggle()
    plt.show()

def seeResult(resultImage, imageName):
    plt.imshow(resultImage)
    plt.show()

def saveComparative(image, imageName, folderPath):
	cv2.imwrite(saveImagePath+"/"+folderPath+"/"+"comparative "+imageName,image)

def main():
    if (len(sys.argv) == 2 and (int(sys.argv[1])>=0) and (int(sys.argv[1]) <= 17)):
        casePath = casesPath+"/case"+str(sys.argv[1])
        for imageName in listdir(casePath):
            imageRoute = casePath+"/"+imageName
            readImage = cv2.imread(imageRoute,0)
            preprocessedImage, improvedImage = preprocessImage(readImage)
            edgeDetected = edgeDetection(preprocessedImage)
            seeComparative(readImage,[improvedImage, preprocessedImage, edgeDetected])
    else:
        print("Introducir numero de caso (0-17), solo uno")

main()