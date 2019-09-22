"""
    Copyright 2018, 2019 Bruno Cabado Lousa
	
	This file is part of octApp.

    octApp is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    octApp is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with octApp.  If not, see <https://www.gnu.org/licenses/>.
"""

#!/usr/bin/python3

import cv2
import numpy as np
import sys
import math
import colorsys
import copy
import random

def imageImprovement(readImage):
    improvedImage = readImage
    #Difuminado
    #Mediana
    #improvedImage = cv2.medianBlur(improvedImage, 11)
    #Gausiana
    #improvedImage = cv2.GaussianBlur(improvedImage, (3, 3), 0)

    #Ecualizacion adaptativa clahe
    claheOfImage = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
    improvedImage = claheOfImage.apply(improvedImage)
    #cv2.imwrite("clahe.png", improvedImage)

    #Umbralización OTSU
    #_,improvedImage = cv2.threshold(improvedImage,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)

    return improvedImage

def imageMorphology(readImage):
    morphImage = readImage

    openKernel = np.ones((3,3), np.uint8)
    morphImage = cv2.morphologyEx(morphImage, cv2.MORPH_OPEN, openKernel)
    #cv2.imwrite("open.png", morphImage)
    closeKernel = np.ones((20,20),np.uint8)
    morphImage = cv2.morphologyEx(morphImage, cv2.MORPH_CLOSE, closeKernel)
    #cv2.imwrite("close.png", morphImage)
    
    return morphImage

def preprocessImage(readImage):
    preprocessedImage = readImage
    
    improvedImage = imageImprovement(preprocessedImage)
    preprocessedImage = imageMorphology(improvedImage)

    return preprocessedImage

def edgeDetection(readImage):
    edgeDetected = readImage
    edgeDetected = cv2.Canny(edgeDetected,425,150,L2gradient=True)
    #cv2.imwrite("canny.png", edgeDetected)
    return edgeDetected

def getCountours(img,thr=100,method='perimeter'):
    im2,cont,hier = cv2.findContours(img,cv2.RETR_TREE,cv2.CHAIN_APPROX_NONE)
    cont2 = []
    for c in cont:
        val = None
        if method == 'perimeter':
            val = cv2.arcLength(c,True)
        elif method == 'area':
            val = cv2.contourArea(c)
        if val > thr:
            cont2.append(c)
    return cont2

def getBiggestNCont(cnt,n,method='perimeter'):
    res = []
    kfun = None
    if method == 'area':
        kfun = lambda x:cv2.contourArea(x)
    elif method == 'perimeter':
        kfun = lambda x: cv2.arcLength(x,True)
    a = sorted(cnt,key=kfun,reverse=True)
    return a[:n]

def approxCont(cnt):
    appr = []
    for c in cnt:
        epsilon = 0.0005 * cv2.arcLength(c,False)
        approx = cv2.approxPolyDP(c,epsilon,False) 
        appr.append(approx)
    return appr

def getCentroids(cont):
    centroids = []
    kfun = lambda x: x[0][1]
    for c in cont:
        M = cv2.moments(c)
        cX = int(M["m10"] / M["m00"])
        cY = int(M["m01"] / M["m00"])
        centroids.append(((cX,cY),c))
    centroids = sorted(centroids,key=kfun,reverse=False)
    return centroids

def interpCurve(points):
    cont = points[1]
    cx,cy = ([a[0][0] for a in cont],[b[0][1] for b in cont])
    return np.poly1d(np.polyfit(cx,cy, deg=2))

def getUpPointDistances(img, funcDown, funcUp):
    width = img.shape[1]
    points = []
    distances = []
    for x in range(width):
        y1 = funcDown(x)
        y2 = funcUp(x)
        points.append(((x,int(round(y1))),(x,int(round(y2)))))
        distances.append((y1-y2))
    return points, distances

def getNearestPointDistances(img, funcDown, funcUp):
    width = img.shape[1]
    points = []
    distances = []
    for x1 in range(width):
        distance = sys.maxsize
        point = (-1,-1)
        y1 = funcDown(x1)
        for x2 in range(width):
            y2 = funcUp(x2)
            newDistance = math.sqrt( (x2 - x1)**2 + (y2 - y1)**2 )
            if (distance > newDistance):
                distance = newDistance
                point = (x2,int(round(y2)))
        points.append(((x1,int(round(y1))),point))
        distances.append(distance)
    return points, distances

def printDistances(img, distances, points):
    numRanges = 100
    maxDistance = max(distances)
    minDistance = min(distances)
    rango = maxDistance - minDistance
    ranges = np.arange(minDistance,maxDistance,rango/numRanges)
    for x in range(len(points)):
        for n in range(len(ranges)):
            if (distances[x] > max(ranges)):
                rgb = colorsys.hsv_to_rgb(len(ranges) / 300., 1., 1.)
                true_rgb = tuple((255*rgb) for rgb in rgb)
                cv2.line(img,points[x][0],points[x][1],true_rgb,1)
                break
            elif (distances[x] <= ranges[n]):
                rgb = colorsys.hsv_to_rgb(n / 300., 1., 1.)
                true_rgb = tuple((255*rgb) for rgb in rgb)
                cv2.line(img,points[x][0],points[x][1],true_rgb,1)
                break

def printDistance(img, distances, points, x):
    numRanges = 100
    maxDistance = max(distances)
    minDistance = min(distances)
    rango = maxDistance - minDistance
    ranges = np.arange(minDistance,maxDistance,rango/numRanges)
    for n in range(len(ranges)):
            if (distances[x] > max(ranges)):
                rgb = colorsys.hsv_to_rgb(len(ranges) / 300., 1., 1.)
                true_rgb = tuple((255*rgb) for rgb in rgb)
                cv2.line(img,points[x][0],points[x][1],true_rgb,1)
                break
            elif (distances[x] <= ranges[n]):
                rgb = colorsys.hsv_to_rgb(n / 300., 1., 1.)
                true_rgb = tuple((255*rgb) for rgb in rgb)
                cv2.line(img,points[x][0],points[x][1],true_rgb,1)
                break

def printCurvePoints(img,curve):
    if len(img.shape) == 3:
        ix,iy,_ = img.shape
    else:
        ix,iy = img.shape
    xr = np.arange(1,iy,iy/100)
    yr = [curve(x) for x in xr]
    for i,x in enumerate(xr):
        p = (int(x),int(yr[i]))
        cv2.circle(img,p,3,(255,0,0),-1)
    return img
    
def printContours(img,cont):
    for cnt in cont:
        r = random.randint(0,255)
        g = random.randint(0,255)
        b = random.randint(0,255)
        color = (r,g,b)
        cv2.drawContours(img,[cnt],0,color,3)

def printCentroids(img,cc):
    for c in cc:
        r = random.randint(0,255)
        g = random.randint(0,255)
        b = random.randint(0,255)
        color = (r,g,b)
        cv2.circle(img,c[0], 5, color, -1)

def printContoursAndCentroids(img, cc):
    for c in cc:
        r = random.randint(0,255)
        g = random.randint(0,255)
        b = random.randint(0,255)
        color = (r,g,b)
        cv2.drawContours(img,[c[1]],0,color,3)
        cv2.circle(img,c[0], 5, color, -1)

def processImage(readImage):
	preprocessedImage = preprocessImage(readImage)
	edgeDetected = edgeDetection(preprocessedImage)
	return edgeDetected

	#upPoints, upDistances = getUpPointDistances(readImage,funcDown,funcUp)
	#nearestPoints, NearestDistances = getNearestPointDistances(readImage,funcDown,funcUp)
	#printDistances(readImage, upDistances, upPoints)
	#printDistance(readImage, upDistances, upPoints, 100)
	
def getCurves(readImage, readImageBGR):
    contoursImg = copy.copy(readImageBGR)
    biggestContoursImg = copy.copy(readImageBGR)
    centroidsImg = copy.copy(readImageBGR)
    popedCentroidsImg = copy.copy(readImageBGR)
    contoursCentroidsImg = copy.copy(readImageBGR)
    finalContoursCentroidsImg = copy.copy(readImageBGR)
    processedImage = processImage(readImage)
    cv2.imwrite(".temp.jpeg", processedImage)
    preImg = cv2.imread(".temp.jpeg",0)
    cont = getCountours(preImg,800)
    printContours(contoursImg, cont)
    #cv2.imwrite("contours.png", cv2.cvtColor(contoursImg, cv2.COLOR_RGB2BGR))
    bc = getBiggestNCont(cont,4)
    printContours(biggestContoursImg, bc)
    #cv2.imwrite("biggestContours.png", cv2.cvtColor(biggestContoursImg, cv2.COLOR_RGB2BGR))
    centroids = getCentroids(bc)
    printContoursAndCentroids(contoursCentroidsImg, centroids)
    #cv2.imwrite("contoursAndCentroids.png", cv2.cvtColor(contoursCentroidsImg, cv2.COLOR_RGB2BGR))
    printCentroids(centroidsImg, centroids)
    #cv2.imwrite("centroids.png", cv2.cvtColor(centroidsImg, cv2.COLOR_RGB2BGR))
    centroids.pop(0)
    printCentroids(popedCentroidsImg, centroids)
    #cv2.imwrite("popedCentroids.png", cv2.cvtColor(popedCentroidsImg, cv2.COLOR_RGB2BGR))
    printContoursAndCentroids(finalContoursCentroidsImg, centroids)
    #cv2.imwrite("finalContoursAndCentroids.png", cv2.cvtColor(finalContoursCentroidsImg, cv2.COLOR_RGB2BGR))
    funcUp = interpCurve(centroids[0])
    funcDown = interpCurve(centroids[1])
    return funcUp, funcDown
