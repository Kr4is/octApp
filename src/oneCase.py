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
	
	#Difuminado

	#Gausiana
	preprocessedImage = cv2.GaussianBlur(readImage,(3,3),0)

	#Canny
	#preprocessedImage = cv2.Canny(preprocessedImage,450,100,L2gradient=True)

	return preprocessedImage

def seeComparative(image, imageName):
    plt.imshow(image)
    plt.show()
	#cv2.imshow(imageName+" comparative", image)
	#cv2.waitKey()
	#cv2.destroyAllWindows()

def saveComparative(image, imageName, folderPath):
	cv2.imwrite(saveImagePath+"/"+folderPath+"/"+"comparative "+imageName,image)

def main():
    if (len(sys.argv) == 2):
        casePath = casesPath+"/case"+str(sys.argv[1])
        for imageName in listdir(casePath):
            imageRoute = casePath+"/"+imageName
            readImage = cv2.imread(imageRoute,0)
            #cv2.imshow(imageName,readImage)
            preprocessedImage = preprocessImage(readImage)
            #cv2.imshow(imageName+" preprocessed",preprocessedImage)
            #result = np.hstack((readImage,preprocessedImage))
            result = preprocessedImage
            seeComparative(result, imageName)
            #saveComparative(result, imageName, case)
    else:
        print("Introducir numero de caso (0-17), solo uno")

main()