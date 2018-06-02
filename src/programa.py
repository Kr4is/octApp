#!/usr/bin/python
import cv2
import numpy as np
from os import listdir

picturesPath = "../res/pictures"
saveImagePath = "../res/results"

def preprocessImage(readImage):
	#aux = cv2.cvtColor(readImage, cv2.COLOR_BGR2GRAY)

	#Equalizacion de histograma

	#Normal
	#equalizedImage = cv2.equalizeHist(readImage)

	#Equalizacion adaptativa de contraste limitado CLAHE 
	#claheOfImage = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(2,2))
	#claheImage = clahe.apply(readImage)
	
	#Difuminado

	#Mediana
	#blurredImage = cv2.medianBlur(readImage, 7)

	#Gausiana
	blurredImage = cv2.GaussianBlur(readImage,(7,7),0)
	#blurredImage = cv2.GaussianBlur(readImage,(13,3),0)

	#Umbralizacion

	#Normal
	#_,preprocessedImage = cv2.threshold(readImage,70,255,cv2.THRESH_BINARY)
	_,preprocessedImage = cv2.threshold(blurredImage,70,255,cv2.THRESH_BINARY)

	#Umbralizacion adaptativa
	#preprocessedImage = cv2.adaptiveThreshold(readImage, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 25, 4)
	#preprocessedImage = cv2.adaptiveThreshold(blurredImage, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 25, 4)

	#Metodo de Otsu
	#_,preprocessedImage = cv2.threshold(readImage,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
	_,preprocessedImage = cv2.threshold(blurredImage,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)

	#Kernels
	kernel2 = np.ones((2,2),np.uint8)

	kernel3 = np.array([[0,1,0],
						[1,1,1],
						[0,1,0]], np.uint8)

	kernel4 = np.array([[0,1,1,0],
						[1,1,1,1],
						[1,1,1,1],
						[0,1,1,0]], np.uint8)

	kernel4b = np.array([[0,0,0,0],
						[0,0,0,0],
						[1,1,1,1],
						[1,1,1,1]], np.uint8)

	kernel5 = np.array([[0,0,1,0,0],
						[0,1,1,1,0],
						[1,1,1,1,1],
						[0,1,1,1,0],
						[0,0,1,0,0]], np.uint8)

	kernel5b = np.array([[0,0,0,0,0],
						[0,0,0,0,0],
						[1,1,1,1,1],
						[1,1,1,1,1],
						[1,1,1,1,1]], np.uint8)

	kernel6 = np.array([[0,0,1,1,0,0],
						[0,1,1,1,1,0],
						[1,1,1,1,1,1],
						[1,1,1,1,1,1],
						[0,0,1,1,1,0],
						[0,0,1,1,0,0]], np.uint8)

	kernel7 = np.array([[0,0,0,1,0,0,0],
						[0,0,1,1,1,0,0],
						[0,1,1,1,1,1,0],
						[1,1,1,1,1,1,1],
						[0,1,1,1,1,1,0],
						[0,0,1,1,1,0,0],
						[0,0,0,1,0,0,0]], np.uint8)
	
	kernel8 = np.array([[0,0],
						[0,0],
						[0,0],
						[0,0],
						[1,1],], np.uint8)
	
	
	#PreprocessedImage = cv2.morphologyEx(preprocessedImage, cv2.MORPH_CLOSE, kernel8)
	#openedPreprocessedImage = cv2.morphologyEx(closedPreprocessedImage, cv2.MORPH_OPEN, kernel2)
	#PreprocessedImage = cv2.morphologyEx(preprocessedImage, cv2.MORPH_OPEN, kernel8)

	return preprocessedImage

def seeComparative(image, imageName):
	cv2.imshow(imageName+" comparative", image)
	cv2.waitKey(0)
	cv2.destroyAllWindows()

def saveComparative(image, imageName):
	cv2.imwrite(saveImagePath+"/"+"comparative "+imageName,image)

def main():
	for imageName in listdir(picturesPath):
		imageRoute = picturesPath+"/"+imageName
		readImage = cv2.imread(imageRoute,0)
		#cv2.imshow(imageName,readImage)
		preprocessedImage = preprocessImage(readImage)
		#cv2.imshow(imageName+" preprocessed",preprocessedImage)
		res = np.hstack((readImage,preprocessedImage))
		seeComparative(res, imageName)
		saveComparative(res, imageName)

main()