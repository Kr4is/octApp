import os
from flask import Flask

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    
    # Configuración por defecto
    app.config.from_mapping(
        SECRET_KEY='dev',
        UPLOAD_FOLDER=os.path.join(app.root_path, 'static/uploads'),
    )

    if test_config is None:
        # cargar configuracion de instancia si existe
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    # Asegurar que existe folder de uploads
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'])
    except OSError:
        pass

    # Registrar blueprints
    from . import routes
    app.register_blueprint(routes.bp)

    return app
