import sys
import numpy as np
from matplotlib import pyplot as plt

def showComparativeUi(initialImage,images):
    comparative = initialImage
    for image in images:
        comparative = np.concatenate((comparative,image), axis=1)
    return comparative

def showComparativeTerminal(initialImage,images):
    comparative = initialImage
    for image in images:
        comparative = np.concatenate((comparative,image), axis=1)
    plt.imshow(comparative)
    mng = plt.get_current_fig_manager()
    #mng.resize(*mng.window.maxsize())
    mng.full_screen_toggle()
    plt.show()

def showResult(resultImage, imageName):
    plt.imshow(resultImage)
    plt.show()
