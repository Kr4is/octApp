# Aplicación de asistencia a la oftamología para el ajuste de lentes de contacto a medida en córneas irregulares

Grao en Enxeñaria Informática

Proyecto clásico de Ingienería

Departamento de Computación

## Objetivo

El objetivo principal de este trabajo es el desarrollo de una aplicación que sea capaz de automatizar las mediciones de la distancia entre córnea y lente de contacto desde una imagen en plano sagital, así como generar mapas que presenten de forma gráfica e intuitiva la relación entre lente y córnea, con el fin de facilitar el cálculo de éstas lentes y por consiguiente el proceso de adaptación a las mismas.

## Descripción

Las lentes de contacto son la primera solución correctora de elección para la rehabilitación visual de los pacientes con córnea irregular (pacientes con patologías como el queratocono, degeneración marginal pelúcida, trasplantes de córnea, traumatismos, etc.).

Actualmente, las opciones en lente de contacto para córnea irregular disponibles son las lentes de contacto blandas, los diseños híbridos, las lentes gas permeables corneales, los sistemas en piggyback, las lentes corneo-esclerales, mini-esclerales y esclerales. 

En varios de estos diseños (hibridas, corneo-esclerales, mini-esclerales y esclerales) debe existir una ausencia o reducción del contacto con la córnea. Por ello, las imágenes AS-OCT, en combinación con la topografía corneal, se puede utilizar tanto para la detección de los cambios microestructurales de la córnea como para el estudio de la relación entre la lente de contacto y la córnea con el fin de facilitar la adaptación de éstas a los usuarios que las usen. 

Cabe destacar que actualmente el experto no dispone de mecanismos para realizar estas mediciones de forma rápida y eliminando factores de subjetividad. Por esto es necesario un software que realice estos cálculos, capaz de aportar las medidas de una forma reproducible y objetiva.

## Material

- Ordenador. 
- Imágenes de tomografía de coherencia óptica de segmento anterior (AS-OCT) sobre las que se realizarán las mediciones. 
- Librerias de visión artificial como OpenCV. 
- Git como gestor de versiones y control del código fuente. 
- Lenguaje de programación que admita las librerias existentes (C++, Python, Java o Matlab). 
- Latex para la redacción de la documentación del proyecto.

## Metodología

Para el desarrollo de esta utilidad se seguirá una metodología ágil e iterativa de desarrollo como es SCRUM, en cada iteración obtendremos una versión, que, dependiendo de los resultados de ésta se decidirán las nuevas tareas y objetivos para la siguiente.

## Fases

1. Estudio de la bibliografia sobre técnicas de visión artificial usadas en imágenes AS-OCT. 
2. Preprocesado de las imágenes con el fin de facilitar los posteriores pasos. 
3. Detección de la zona superficial de la córnea y la superficie lenticular. 
4. Generar mediciones entre lente y córnea con varias métricas. 
5. Mostrar las mediciones obtenidas de forma gráfica e intuitiva.


# Instalación
## Linux
Actualizamos el sistema:

`sudo apt update`

`sudo apt upgrade`

Instalación del lenguaje:

`sudo apt-get install python3`

Instalación del gestor de paquetes pip para Python 3:

`sudo apt install python3-pip`

Instalación de las librerias:

`pip install numpy opencv colorsys pyqt5`

Ejecución octApp:

`python3 octApp.py`

# Licencia
Este proyecto se encuentra bajo la licencia GPLv3. (ver COPYING.txt)
