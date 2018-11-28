import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import image as img
import process.processImage as prim
from menus import octViewMenu

class OctView():

    def __init__(self, master):

        self.master = master
        self.master.wm_iconbitmap("logos/logo.ico")
        self.master.wm_title("OctView")
        self.master.wm_resizable(False, False)

        ## MENU BAR ##
        octViewMenu(self)
        ##############
        
        self.processedImage = prim.processSelection(img.Image.getImage())
        self.processedImage = Image.fromarray(self.processedImage)
        #self.image = Image.open(img.Image.getImage())
        self.photo = ImageTk.PhotoImage(self.processedImage)
        tk.Label(self.master, image = self.photo).grid(row = 0, column = 0)
        