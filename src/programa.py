#!/usr/bin/python
import cv2
import numpy as np
from os import listdir

picturesPath = "../res/pictures"

print(cv2.__version__)

for image in listdir(picturesPath):
	readImage = cv2.imread(image)
	cv2.imshow(image, readImage)
	cv2.waitKey(0)

