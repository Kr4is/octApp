import os
import cv2
import numpy as np
from flask import Blueprint, render_template, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
from app.services.orchestrator import analyze_oct_image

bp = Blueprint('main', __name__)

@bp.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Upload Mode
        file = request.files.get('image')
        if file:
            filename = secure_filename(file.filename)
            upload_folder = current_app.config['UPLOAD_FOLDER']
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            
            results = analyze_oct_image(filepath)
            if results is None:
                return jsonify({'error': 'Invalid image format'}), 400
            
            results['original'] = f"/uploads/{filename}"
            return jsonify(results)
    
    # Demo Mode
    if request.method == 'POST' and request.form.get('demo') == 'true':
        filepath = os.path.join(current_app.root_path, 'static/initial.jpeg')
        if not os.path.exists(filepath):
             return jsonify({'error': 'Demo image not found'}), 404
             
        results = analyze_oct_image(filepath)
        if results is None:
             return jsonify({'error': 'Failed to process demo image'}), 500
             
        results['original'] = f"/static/initial.jpeg"
        return jsonify(results)

    return render_template('index.html')

@bp.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
