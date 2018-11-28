import sys
import cv2
from os import listdir
from . import processUtils as prut
from . import processAlgorithm as pral

casesPath = "../res/pictures"
saveImagePath = "../res/results"

def saveComparative(image, imageName, folderPath):
	cv2.imwrite(saveImagePath+"/"+folderPath+"/"+"comparative "+imageName,image)

def processOneCase():
    if (len(sys.argv) == 2 and (int(sys.argv[1])>=0) and (int(sys.argv[1]) <= 17)):
        casePath = casesPath+"/case"+str(sys.argv[1])
        for imageName in listdir(casePath):
            imageRoute = casePath+"/"+imageName
            readImage = cv2.imread(imageRoute,0)
            improvedImage, preprocessedImage, edgeDetected = pral.getOctProcessParts(readImage)
            prut.showComparativeTerminal(readImage,[improvedImage, preprocessedImage, edgeDetected])
    else:
        print("Introducir numero de caso (0-17), solo uno")

def processSelection(path):
    readImage = cv2.imread(path,0)
    improvedImage, preprocessedImage, edgeDetected = pral.getOctProcessParts(readImage)
    return prut.showComparativeUi(readImage,[improvedImage, preprocessedImage, edgeDetected])