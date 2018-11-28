import tkinter as tk
from tkinter import ttk

def octAppMenu(self):
    self.menubar = tk.Menu()
    filemenu = tk.Menu(self.menubar, 
                    tearoff = 0
                    )
    filemenu.add_command(label = "Open...", 
                        command = lambda: self.launchOctView()
                        )
    filemenu.add_command(label = "Import..."
                        )
    filemenu.add_separator()
    filemenu.add_command(label = "Exit", 
                        command = quit
                        )
    self.menubar.add_cascade(label = "File", 
                        menu = filemenu
                        )
    tk.Tk.config(self.master, 
            menu = self.menubar
            )
    aboutmenu = tk.Menu(self.menubar, 
                    tearoff = 0
                    )
    aboutmenu.add_command(label = "About", 
                        command = lambda: self.launchOctAbout()
                        )
    self.menubar.add_cascade(label = "Help", 
                        menu = aboutmenu
                        )
    tk.Tk.config(self.master, 
            menu = self.menubar
            )

def octViewMenu(self):
    self.menubar = tk.Menu()
    filemenu = tk.Menu(self.menubar, 
                    tearoff = 0
                    )
    filemenu.add_command(label = "Save...", 
                        )
    filemenu.add_separator()
    filemenu.add_command(label = "Close", 
                        command = self.master.destroy,
                        )
    self.menubar.add_cascade(label = "File", 
                        menu = filemenu
                        )
    tk.Tk.config(self.master, 
            menu = self.menubar
            )