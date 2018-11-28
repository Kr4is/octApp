import tkinter as tk
from tkinter import ttk
from tkinter import Toplevel
from octAbout import OctAbout
from octView import OctView
from PIL import Image, ImageTk
from menus import octAppMenu
import image as img

class OctApp():

    def __init__(self, master):

        self.master = master
        self.master.wm_iconbitmap("logos/logo.ico")
        self.master.wm_title("OctApp")
        self.master.wm_resizable(False, False)

        ## MENU BAR ##
        octAppMenu(self)
        ##############

        self.image = Image.open("logos/logoPequeñoMod.png")
        self.photo = ImageTk.PhotoImage(self.image)
        tk.Label(self.master, image = self.photo).grid(row = 0, column = 0, rowspan = 3)
        tk.Label(self.master, text = "Oct App").grid(row = 0, column = 1)
        tk.Label(self.master, text = "File to open a new image").grid(row = 1, column = 1)
        tk.Label(self.master, text = "About for more information").grid(row = 2, column = 1)
    
    def launchOctAbout(self):
        root2 = Toplevel(self.master)
        root2.grab_set()
        octAboutApp = OctAbout(root2)
        root2.mainloop()
    
    def launchOctView(self):
        img.Image.setImage()
        if img.Image.existImage():
            root2 = Toplevel(self.master)
            octViewApp = OctView(root2)
            img.Image.delImage()
            root2.mainloop()