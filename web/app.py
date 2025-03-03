import os
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from backend import getCurves, getUpPointDistances, getNearestPointDistances

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.secret_key = 'your_secret_key_here'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        file = request.files.get('image')
        if file:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            img = cv2.imread(filepath)
            if img is None:
                return jsonify({'error': 'Invalid image format'}), 400
                
            gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            func_up, func_down = getCurves(gray_img, img)
            
            if not callable(func_down) or not callable(func_up):
                return jsonify({'error': 'Curve detection failed'}), 400
            
            # Calcular ambos tipos de distancias
            up_points, up_dists = getUpPointDistances(gray_img, func_down, func_up)
            euclidean_points, euclidean_dists = getNearestPointDistances(gray_img, func_down, func_up)
            
            # Convertir a listas si son numpy arrays
            if isinstance(up_points, np.ndarray):
                up_points = up_points.tolist()
            if isinstance(up_dists, np.ndarray):
                up_dists = up_dists.tolist()
            if isinstance(euclidean_points, np.ndarray):
                euclidean_points = euclidean_points.tolist()
            if isinstance(euclidean_dists, np.ndarray):
                euclidean_dists = euclidean_dists.tolist()
            
            # Dimensiones originales de la imagen
            height, width = gray_img.shape
            
            # Generamos arrays de puntos para las curvas, muestreando a lo largo del ancho
            curve_up_points = []
            curve_down_points = []
            for x in range(width):
                y_up = int(func_up(x))
                y_down = int(func_down(x))
                curve_up_points.append([x, y_up])
                curve_down_points.append([x, y_down])
            
            # Crear estructuras para diferentes tipos de distancias
            points_by_type = {
                'up': up_points,
                'euclidean': euclidean_points
            }
            
            dists_by_type = {
                'up': up_dists,
                'euclidean': euclidean_dists
            }
            
            return jsonify({
                'original': f"/uploads/{filename}",  # ruta de la imagen original
                'points_by_type': points_by_type,    # puntos organizados por tipo
                'dists_by_type': dists_by_type,      # distancias organizadas por tipo
                'curve_up': curve_up_points,
                'curve_down': curve_down_points,
                'width': width,
                'height': height
            })
    
    # Si es GET, renderizamos la plantilla
    return render_template('index.html')

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)