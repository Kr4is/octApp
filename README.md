<div align="center">

# OctApp
### Ophthalmology Assistance Application for Custom Contact Lens Fitting on Irregular Corneas

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Python](https://img.shields.io/badge/Python-3.6+-blue.svg)](https://www.python.org/downloads/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.x-green.svg)](https://opencv.org/)

*Engineering Project - Bachelor's Degree in Computer Engineering*  
*Department of Computing - Universidade da Coruña*

</div>

## 🎯 Objective

The primary goal of this project is to develop an application capable of automating the measurement of the distance between the cornea and the contact lens from a sagittal plane image. Additionally, it aims to generate graphical and intuitive maps representing the lens-to-cornea relationship, facilitating the calculation of these lenses and improving the adaptation process.

## 📋 Description

Contact lenses are the preferred corrective solution for visual rehabilitation in patients with irregular corneas (e.g., keratoconus, pellucid marginal degeneration, corneal transplants, trauma, etc.).

Currently, available contact lens options for irregular corneas include:
- Soft contact lenses
- Hybrid designs
- Corneal gas-permeable lenses
- Piggyback systems
- Corneo-scleral lenses
- Mini-scleral and scleral lenses

For several of these designs, there must be little to no contact with the cornea. AS-OCT images, combined with corneal topography, can be used both for detecting corneal microstructural changes and for studying the relationship between the contact lens and the cornea.

## 🛠️ Requirements

- 💻 Computer
- 🔍 AS-OCT Images (Anterior Segment Optical Coherence Tomography)
- 📚 Libraries:
  - OpenCV for computer vision
  - NumPy for numerical computations
  - PyQt5 for graphical interface
- 🔄 Git for version control
- 📝 LaTeX for documentation

## 📊 Methodology

An agile SCRUM methodology is used with iterative development, where each iteration delivers a functional version guiding the objectives of the next phase.

## 🔄 Project Phases

1. 📚 Literature review on computer vision techniques for AS-OCT images
2. 🖼️ Image preprocessing
3. 🎯 Surface detection (cornea and lens)
4. 📏 Measurement generation
5. 📊 Results visualization

## ⚙️ Installation

### Using uv (Recommended)

This project uses `uv` for dependency management.

1. **Sync dependencies**:
   ```bash
   uv sync
   ```

## 🚀 Running the Application

### Web Application (Flask)
```bash
uv run python web/app.py
```

## 📄 License

This project is licensed under the GNU General Public License v3.0.

Developed with ❤️ for the ophthalmology community.

