from tkinter.filedialog import askopenfilename, asksaveasfilename, asksaveasfile

class Image():

    def __init__():
        currentImage = ""

    def existImage():
        if (Image.currentImage != ""):
            return True
        else:
            return False

    def setImage():
        Image.currentImage = askopenfilename(filetypes = [("Image files",("*.jpg","*.jpeg","*.png")),
                                                        ("jpg files","*.jpg"),
                                                        ("jpeg files","*.jpeg"), 
                                                        ("png files","*.png")])

    def delImage():
        Image.currentImage = ""

    def getImage():
        return Image.currentImage

    def saveImage():
        asksaveasfile(title = "Select file",filetypes = (("jpeg files","*.jpg"), 
                                                        ("all files","*.*"))
                                                        )