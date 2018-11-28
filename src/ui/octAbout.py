import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk

class OctAbout():

    def __init__(self, master):

        self.master = master
        self.master.wm_iconbitmap("logos/logo.ico")
        self.master.wm_title("OctAbout")
        self.master.wm_resizable(False, False)
        
        self.image = Image.open("logos/logoPequeñoMod.png")
        self.photo = ImageTk.PhotoImage(self.image)
        tk.Label(self.master, image = self.photo).grid(row = 0, column = 0, rowspan = 6)
        tk.Label(self.master, text = "Directores de proyecto:").grid(row = 0, column = 1)
        tk.Label(self.master, text = "Manuel Francisco González Penedo").grid(row = 1, column = 1)
        tk.Label(self.master, text = "Marcos Ortega Hortas").grid(row = 2, column = 1)
        tk.Label(self.master, text = "Autor:").grid(row = 4, column = 1)
        tk.Label(self.master, text = "Bruno Cabado Lousa").grid(row = 5, column = 1)
