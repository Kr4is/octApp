#!/usr/bin/python3
import cv2
import numpy as np
from os import listdir

casesPath = "../res/pictures"
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
	#blurredImage = cv2.medianBlur(readImage, 5)

	#Gausiana
	blurredImage = cv2.GaussianBlur(readImage,(3,3),0)
	#blurredImage = cv2.GaussianBlur(readImage,(7,7),0)
	#blurredImage = cv2.GaussianBlur(readImage,(13,3),0)

	#Umbralizacion

	#Normal
	#_,preprocessedImage = cv2.threshold(readImage,70,255,cv2.THRESH_BINARY)
	##_,preprocessedImage = cv2.threshold(blurredImage,70,255,cv2.THRESH_BINARY)

	#Umbralizacion adaptativa
	#preprocessedImage = cv2.adaptiveThreshold(readImage, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 25, 4)
	#preprocessedImage = cv2.adaptiveThreshold(blurredImage, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 25, 4)

	#Binarizacion de Otsu
	#_,preprocessedImage = cv2.threshold(readImage,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
	##_,preprocessedImage = cv2.threshold(blurredImage,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)

	#Kernels
	'''kernel2 = np.ones((2,2),np.uint8)'''

	'''kernel3 = np.array([[0,1,0],
						[1,1,1],
						[0,1,0]], np.uint8)'''

	'''kernel4 = np.array([[0,1,1,0],
						[1,1,1,1],
						[1,1,1,1],
						[0,1,1,0]], np.uint8)'''

	'''kernel4b = np.array([[0,0,0,0],
						[0,0,0,0],
						[1,1,1,1],
						[1,1,1,1]], np.uint8)'''

	'''kernel5 = np.array([[0,0,1,0,0],
						[0,1,1,1,0],
						[1,1,1,1,1],
						[0,1,1,1,0],
						[0,0,1,0,0]], np.uint8)'''

	'''kernel5b = np.array([[0,0,0,0,0],
						[0,0,0,0,0],
						[1,1,1,1,1],
						[1,1,1,1,1],
						[1,1,1,1,1]], np.uint8)'''

	'''kernel6 = np.array([[0,0,1,1,0,0],
						[0,1,1,1,1,0],
						[1,1,1,1,1,1],
						[1,1,1,1,1,1],
						[0,0,1,1,1,0],
						[0,0,1,1,0,0]], np.uint8)'''

	'''kernel7 = np.array([[0,0,0,1,0,0,0],
						[0,0,1,1,1,0,0],
						[0,1,1,1,1,1,0],
						[1,1,1,1,1,1,1],
						[0,1,1,1,1,1,0],
						[0,0,1,1,1,0,0],
						[0,0,0,1,0,0,0]], np.uint8)'''
	
	'''kernel8 = np.array([[0,0],
						[0,0],
						[0,0],
						[0,0],
						[1,1],], np.uint8)'''
	
	
	#closedImage = cv2.morphologyEx(preprocessedImage, cv2.MORPH_CLOSE, kernel7)
	#openedPreprocessedImage = cv2.morphologyEx(closedPreprocessedImage, cv2.MORPH_OPEN, kernel2)
	#PreprocessedImage = cv2.morphologyEx(preprocessedImage, cv2.MORPH_OPEN, kernel8)


	#Sobel
	#sobely = cv2.Sobel(preprocessedImage,cv2.CV_64F,0,1,ksize=5)
	#preprocessedImage = sobely

	#Canny
	preprocessedImage = cv2.Canny(blurredImage,450,100,L2gradient=True)
	#preprocessedImage = cv2.Canny(blurredImage,100,200)
	#edges = cv2.Canny(preprocessedImage,100,200)
	#preprocessedImage = edges

	return preprocessedImage

def seeComparative(image, imageName):
	print(image)
	cv2.imshow(imageName+" comparative", image)
	cv2.waitKey(0)
	cv2.destroyAllWindows()

def saveComparative(image, imageName, folderPath):
	cv2.imwrite(saveImagePath+"/"+folderPath+"/"+"comparative "+imageName,image)

def main():
	for case in listdir(casesPath):
		if (case != ".DS_Store"): #No Contemplar ese archivo
			casePath = casesPath+"/"+case
			for imageName in listdir(casePath):
				if (imageName != ".DS_Store"): #No Contemplar ese archivo
					imageRoute = casePath+"/"+imageName
					readImage = cv2.imread(imageRoute,0)
					#cv2.imshow(imageName,readImage)
					preprocessedImage = preprocessImage(readImage)
					#cv2.imshow(imageName+" preprocessed",preprocessedImage)
					result = np.hstack((readImage,preprocessedImage))
					#seeComparative(result, imageName)
					saveComparative(result, imageName, case)

main()