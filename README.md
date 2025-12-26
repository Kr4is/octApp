<div align="center">

<img src="app/static/logo.svg" alt="OCT Vision Logo" width="120">

# OCT Vision
### Ophthalmology Assistance for Contact Lens Fitting and Corneal Analysis

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.x-green.svg)](https://opencv.org/)

*Engineering Project - Bachelor's Degree in Computer Engineering*  
*Universidade da Coruña*

</div>

---

## 🎯 Overview

**OCT Vision** is a specialized tool designed to automate and enhance the measurement of the relationship between the cornea and contact lenses using Anterior Segment Optical Coherence Tomography (AS-OCT) images. 

It provides clinicians with precise data to facilitate the calculation and adaptation of lenses, particularly for patients with irregular corneas (e.g., keratoconus, corneal transplants).

## ✨ Key Features

- **Automated Segmentation**: Precisely detects corneal and contact lens surfaces using optimized image processing pipelines.
- **Metric Suite**:
    - **Vertical Clearances**: Direct measurement of the sagittal gap.
    - **Euclidean Clearance**: Minimum distance between surfaces for safety analysis.
    - **Zonal Metrics**: Analysis of central vs. peripheral thickness.
- **Interactive Visualization**: Real-time cross-sectional measurements with an interactive thickness profile.
- **Demo Mode**: Built-in library of diverse clinical cases for training and validation.

## 🛠️ Technical Stack

- **Backend**: Flask (Python) with a focus on custom computer vision algorithms.
- **Computer Vision**: OpenCV, NumPy, and SciPy for edge detection, morphological processing, and polynomial interpolation.
- **Frontend**: Vanilla JavaScript (Modern ES6+), Tailwind CSS for a premium medical interface.
- **Testing**: Robust test suite using Pytest for core geometry and processing services.

## ⚙️ Installation & Usage

### 1. Prerequisites
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Recommended for dependency management)

### 2. Setup
```bash
uv sync
```

### 3. Run Application
```bash
uv run python run.py
```
Then visit `http://localhost:5000` in your browser.

### 4. Run Tests
```bash
PYTHONPATH=. uv run python3 -m pytest
```

## 📊 Methodology

The application follows a multi-stage processing pipeline:
1. **Preprocessing**: Image enhancement (CLAHE) and noise reduction.
2. **Segmentation**: Canny edge detection and morphological grouping.
3. **Analysis**: Least-squares polynomial fitting to derive smooth corneal/lens models.
4. **Computation**: Geometric algorithms to find vertical and minimum Euclidean distances.

## 📄 License

This project is licensed under the GNU General Public License v3.0.

Developed with precision for the ophthalmology community.
