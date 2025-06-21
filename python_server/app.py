from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import cv2
import base64
import io
from PIL import Image
import json
import os
import logging
from datetime import datetime
import sqlite3
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
CONFIG = {
    'face_recognition_threshold': 0.6,  # Lower = more strict matching
    'max_faces_per_image': 10,
    'min_face_size': 20,
    'database_path': 'face_data.db'
}

class FaceRecognitionService:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database for storing face encodings"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS face_encodings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                student_name TEXT NOT NULL,
                encoding_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    
    def register_face(self, student_id: str, student_name: str, image_data: str) -> Dict[str, Any]:
        """Register a new face encoding for a student"""
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(io.BytesIO(image_bytes))
            image_array = np.array(image)
            
            # Convert RGB to BGR for OpenCV
            if len(image_array.shape) == 3:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            # Detect faces
            face_locations = face_recognition.face_locations(image_array)
            
            if not face_locations:
                return {
                    'success': False,
                    'error': 'No faces detected in the image'
                }
            
            if len(face_locations) > 1:
                return {
                    'success': False,
                    'error': f'Multiple faces detected ({len(face_locations)}). Please use an image with only one face.'
                }
            
            # Extract face encoding
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            if not face_encodings:
                return {
                    'success': False,
                    'error': 'Could not extract face encoding'
                }
            
            face_encoding = face_encodings[0]
            
            # Store in database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if student already has face data
            cursor.execute('SELECT id FROM face_encodings WHERE student_id = ?', (student_id,))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing record
                cursor.execute('''
                    UPDATE face_encodings 
                    SET student_name = ?, encoding_data = ?, created_at = CURRENT_TIMESTAMP
                    WHERE student_id = ?
                ''', (student_name, json.dumps(face_encoding.tolist()), student_id))
            else:
                # Insert new record
                cursor.execute('''
                    INSERT INTO face_encodings (student_id, student_name, encoding_data)
                    VALUES (?, ?, ?)
                ''', (student_id, student_name, json.dumps(face_encoding.tolist())))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Face registered successfully for student {student_name} ({student_id})")
            
            return {
                'success': True,
                'message': f'Face registered successfully for {student_name}',
                'student_id': student_id,
                'student_name': student_name
            }
            
        except Exception as e:
            logger.error(f"Error registering face: {str(e)}")
            return {
                'success': False,
                'error': f'Error registering face: {str(e)}'
            }
    
    def recognize_faces(self, image_data: str) -> Dict[str, Any]:
        """Recognize faces in an image"""
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(io.BytesIO(image_bytes))
            image_array = np.array(image)
            
            # Convert RGB to BGR for OpenCV
            if len(image_array.shape) == 3:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            # Detect faces
            face_locations = face_recognition.face_locations(image_array)
            
            if not face_locations:
                return {
                    'success': True,
                    'recognized_faces': [],
                    'message': 'No faces detected in the image'
                }
            
            # Extract face encodings
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            if not face_encodings:
                return {
                    'success': True,
                    'recognized_faces': [],
                    'message': 'Could not extract face encodings'
                }
            
            # Load known face encodings from database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('SELECT student_id, student_name, encoding_data FROM face_encodings')
            known_faces = cursor.fetchall()
            conn.close()
            
            recognized_faces = []
            
            for face_encoding in face_encodings:
                best_match = None
                best_distance = float('inf')
                
                for student_id, student_name, encoding_data in known_faces:
                    known_encoding = np.array(json.loads(encoding_data))
                    
                    # Calculate face distance
                    distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
                    
                    # Check if this is a better match
                    if distance < best_distance and distance <= CONFIG['face_recognition_threshold']:
                        best_distance = distance
                        best_match = {
                            'student_id': student_id,
                            'student_name': student_name,
                            'confidence': 1 - distance,
                            'distance': distance
                        }
                
                if best_match:
                    recognized_faces.append(best_match)
                    logger.info(f"Recognized {best_match['student_name']} with confidence {best_match['confidence']:.2f}")
            
            return {
                'success': True,
                'recognized_faces': recognized_faces,
                'total_faces_detected': len(face_locations),
                'faces_recognized': len(recognized_faces)
            }
            
        except Exception as e:
            logger.error(f"Error recognizing faces: {str(e)}")
            return {
                'success': False,
                'error': f'Error recognizing faces: {str(e)}'
            }
    
    def get_all_registered_faces(self) -> Dict[str, Any]:
        """Get all registered face encodings"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                SELECT student_id, student_name, created_at 
                FROM face_encodings 
                ORDER BY created_at DESC
            ''')
            faces = cursor.fetchall()
            conn.close()
            
            return {
                'success': True,
                'faces': [
                    {
                        'student_id': face[0],
                        'student_name': face[1],
                        'created_at': face[2]
                    }
                    for face in faces
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting registered faces: {str(e)}")
            return {
                'success': False,
                'error': f'Error getting registered faces: {str(e)}'
            }
    
    def delete_face(self, student_id: str) -> Dict[str, Any]:
        """Delete face encoding for a student"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM face_encodings WHERE student_id = ?', (student_id,))
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            if deleted_count > 0:
                logger.info(f"Face deleted for student {student_id}")
                return {
                    'success': True,
                    'message': f'Face deleted for student {student_id}'
                }
            else:
                return {
                    'success': False,
                    'error': f'No face found for student {student_id}'
                }
                
        except Exception as e:
            logger.error(f"Error deleting face: {str(e)}")
            return {
                'success': False,
                'error': f'Error deleting face: {str(e)}'
            }

# Initialize face recognition service
face_service = FaceRecognitionService(CONFIG['database_path'])

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'face-recognition-api'
    })

@app.route('/register', methods=['POST'])
def register_face():
    """Register a new face encoding"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        student_id = data.get('student_id')
        student_name = data.get('student_name')
        image_data = data.get('image_data')
        
        if not all([student_id, student_name, image_data]):
            return jsonify({
                'success': False, 
                'error': 'Missing required fields: student_id, student_name, image_data'
            }), 400
        
        result = face_service.register_face(student_id, student_name, image_data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in register endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/recognize', methods=['POST'])
def recognize_faces():
    """Recognize faces in an image"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        image_data = data.get('image_data')
        
        if not image_data:
            return jsonify({
                'success': False, 
                'error': 'Missing required field: image_data'
            }), 400
        
        result = face_service.recognize_faces(image_data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in recognize endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/faces', methods=['GET'])
def get_faces():
    """Get all registered faces"""
    try:
        result = face_service.get_all_registered_faces()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in get_faces endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/faces/<student_id>', methods=['DELETE'])
def delete_face(student_id):
    """Delete face encoding for a student"""
    try:
        result = face_service.delete_face(student_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in delete_face endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    return jsonify({
        'success': True,
        'config': CONFIG
    })

@app.route('/config', methods=['PUT'])
def update_config():
    """Update configuration"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Update allowed configuration values
        allowed_keys = ['face_recognition_threshold', 'max_faces_per_image', 'min_face_size']
        
        for key, value in data.items():
            if key in allowed_keys:
                CONFIG[key] = value
        
        logger.info(f"Configuration updated: {data}")
        
        return jsonify({
            'success': True,
            'message': 'Configuration updated successfully',
            'config': CONFIG
        })
        
    except Exception as e:
        logger.error(f"Error updating config: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error updating config: {str(e)}'
        }), 500

if __name__ == '__main__':
    logger.info("Starting Face Recognition API Server...")
    logger.info(f"Configuration: {CONFIG}")
    
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(CONFIG['database_path']), exist_ok=True)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    ) 