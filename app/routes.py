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
        # Demo Analysis Mode
        demo_filename = request.form.get('filename')
        if not demo_filename:
            return jsonify({'error': 'No filename provided'}), 400
            
        # Security check: ensure filename is just a basename
        demo_filename = secure_filename(demo_filename)
        
        filepath = os.path.join(current_app.root_path, 'static/demo_images', demo_filename)
        if not os.path.exists(filepath):
             return jsonify({'error': 'Demo image not found'}), 404
             
        results = analyze_oct_image(filepath)
        if results is None:
             return jsonify({'error': 'Failed to process demo image'}), 500
             
        results['original'] = f"/static/demo_images/{demo_filename}"
        return jsonify(results)

    return render_template('index.html')

@bp.route('/demo-images')
def get_demo_images():
    demo_dir = os.path.join(current_app.root_path, 'static/demo_images')
    if not os.path.exists(demo_dir):
        return jsonify([])
    
    images = [f for f in os.listdir(demo_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    # Return full paths or just filenames? Filenames are better, frontend can construct path.
    # Actually, frontend just needs filenames to list/select.
    return jsonify(sorted(images))

@bp.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
