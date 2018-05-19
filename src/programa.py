#!/usr/bin/python
import cv2
import numpy as np
from os import listdir

picturesPath = "../res/pictures"

def preprocessImage(readImage):
	#aux = cv2.cvtColor(readImage, cv2.COLOR_BGR2GRAY)

	#equ = cv2.equalizeHist(readImage)

	#clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(2,2))
	#cli1 = clahe.apply(readImage)

	_,th = cv2.threshold(readImage,70,255,cv2.THRESH_BINARY)

	kernel2 = np.ones((2,2),np.uint8)
	kernel3 = np.array([[0,1,0],
						[1,1,1],
						[0,1,0]], np.uint8)
	kernel4 = np.array([[0,1,1,0],
						[1,1,1,1],
						[1,1,1,1],
						[0,1,1,0]], np.uint8)
	kernel5 = np.array([[0,0,1,0,0],
						[0,1,1,1,0],
						[1,1,1,1,1],
						[0,1,1,1,0],
						[0,0,1,0,0]], np.uint8)
	
	#closedPreprocessedImage = cv2.morphologyEx(th, cv2.MORPH_CLOSE, kernel)
	#openedPreprocessedImage = cv2.morphologyEx(closedPreprocessedImage, cv2.MORPH_OPEN, kernel)
	openedPreprocessedImage = cv2.morphologyEx(th, cv2.MORPH_OPEN, kernel4)

	return openedPreprocessedImage

for imageName in listdir(picturesPath):
	imageRoute = picturesPath+"/"+imageName
	readImage = cv2.imread(imageRoute,0)
	#cv2.imshow(imageName,readImage)
	preprocessedImage = preprocessImage(readImage)
	#cv2.imshow(imageName+" preprocessed",preprocessedImage)
	res = np.hstack((readImage,preprocessedImage))
	cv2.imshow("comparative", res)
	cv2.waitKey(0)
	cv2.destroyAllWindows()
