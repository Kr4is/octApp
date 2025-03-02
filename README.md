<div align="center">

# OctApp
### Aplicación de asistencia a la oftalmología para el ajuste de lentes de contacto a medida en córneas irregulares

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Python](https://img.shields.io/badge/Python-3.6+-blue.svg)](https://www.python.org/downloads/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.x-green.svg)](https://opencv.org/)

*Proyecto de Ingeniería - Grado en Ingeniería Informática*  
*Departamento de Computación - Universidade da Coruña*

</div>

## 🎯 Objetivo

El objetivo principal de este trabajo es el desarrollo de una aplicación que sea capaz de automatizar las mediciones de la distancia entre córnea y lente de contacto desde una imagen en plano sagital, así como generar mapas que presenten de forma gráfica e intuitiva la relación entre lente y córnea, con el fin de facilitar el cálculo de éstas lentes y por consiguiente el proceso de adaptación a las mismas.

## 📋 Descripción

Las lentes de contacto son la primera solución correctora de elección para la rehabilitación visual de los pacientes con córnea irregular (pacientes con patologías como el queratocono, degeneración marginal pelúcida, trasplantes de córnea, traumatismos, etc.).

Actualmente, las opciones en lente de contacto para córnea irregular disponibles son:
- Lentes de contacto blandas
- Diseños híbridos
- Lentes gas permeables corneales
- Sistemas en piggyback
- Lentes corneo-esclerales
- Mini-esclerales y esclerales

En varios de estos diseños debe existir una ausencia o reducción del contacto con la córnea. Por ello, las imágenes AS-OCT, en combinación con la topografía corneal, se pueden utilizar tanto para la detección de los cambios microestructurales de la córnea como para el estudio de la relación entre la lente de contacto y la córnea.

## 🛠️ Material

- 💻 Ordenador
- 🔍 Imágenes AS-OCT (Tomografía de coherencia óptica de segmento anterior)
- 📚 Librerías:
  - OpenCV para visión artificial
  - NumPy para cálculos numéricos
  - PyQt5 para interfaz gráfica
- 🔄 Git para control de versiones
- 📝 LaTeX para documentación

## 📊 Metodología

Se utiliza una metodología ágil SCRUM con desarrollo iterativo, donde cada iteración produce una versión funcional que guía los objetivos de la siguiente fase.

## 🔄 Fases del Proyecto

1. 📚 Estudio bibliográfico de técnicas de visión artificial en imágenes AS-OCT
2. 🖼️ Preprocesado de imágenes
3. 🎯 Detección de superficies (córnea y lente)
4. 📏 Generación de mediciones
5. 📊 Visualización de resultados

## ⚙️ Instalación

### Linux
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade

# Instalar Python y pip
sudo apt-get install python3 python3-pip

# Instalar dependencias
pip install numpy opencv-python pyqt5
```

## Ejecución

```bash
python3 octApp.py
```

## 📄 Licencia

Este proyecto está bajo la licencia GNU General Public License v3.0

Desarrollado con ❤️ para la comunidad oftalmológica