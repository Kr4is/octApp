#!/usr/bin/python3
import sys
import cv2
import numpy as np
import scipy.ndimage as ndimage
from os import listdir
from matplotlib import pyplot as plt

casesPath = "../res/pictures"
saveImagePath = "../res/results"

def preprocessImage(readImage):
    preprocessedImage = readImage
    #Difuminado
    #Mediana
    preprocessedImage = cv2.medianBlur(preprocessedImage, 5)
    #Gausiana
    preprocessedImage = cv2.GaussianBlur(preprocessedImage,(3,3),0)

    claheOfImage = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4,4))
    preprocessedImage = claheOfImage.apply(preprocessedImage)

    _,preprocessedImage = cv2.threshold(preprocessedImage,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)

    #Canny
    #preprocessedImage = cv2.Canny(preprocessedImage,450,100,L2gradient=True)
    return preprocessedImage

def seeComparative(initialImage, resultImage, imageName):
    comparative = np.concatenate((initialImage,resultImage), axis=1)
    plt.imshow(comparative)
    plt.show()

def seeResult(resultImage, imageName):
    plt.imshow(resultImage)
    plt.show()

def saveComparative(image, imageName, folderPath):
	cv2.imwrite(saveImagePath+"/"+folderPath+"/"+"comparative "+imageName,image)

def main():
    if (len(sys.argv) == 2):
        casePath = casesPath+"/case"+str(sys.argv[1])
        for imageName in listdir(casePath):
            imageRoute = casePath+"/"+imageName
            readImage = cv2.imread(imageRoute,0)
            preprocessedImage = preprocessImage(readImage)
            result = preprocessedImage
            seeComparative(readImage, result, imageName)
    else:
        print("Introducir numero de caso (0-17), solo uno")

main()