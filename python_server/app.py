from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import cv2
import base64
import io
from PIL import Image
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
CONFIG = {
    'face_recognition_threshold': 0.6,  # Lower = more strict matching
    'max_faces_per_image': 10,
    'min_face_size': 20
}

class FaceRecognitionService:
    def __init__(self):
        pass

    def analyze_faces(self, image_data: str):
        """Analyze faces in an image and return their locations and encodings"""
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
                    'faces': [],
                    'message': 'No faces detected in the image'
                }

            # Extract face encodings
            face_encodings = face_recognition.face_encodings(image_array, face_locations)

            faces = []
            for loc, enc in zip(face_locations, face_encodings):
                faces.append({
                    'location': loc,
                    'encoding': enc.tolist()
                })

            return {
                'success': True,
                'faces': faces,
                'total_faces_detected': len(face_locations)
            }
        except Exception as e:
            logger.error(f"Error analyzing faces: {str(e)}")
            return {
                'success': False,
                'error': f'Error analyzing faces: {str(e)}'
            }

# Initialize face recognition service
face_service = FaceRecognitionService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'face-recognition-api'
    })

@app.route('/recognize', methods=['POST'])
def recognize_faces():
    """Analyze faces in an image, compare to student images, and return present/absent students"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        image_data = data.get('image_data')
        student_images = data.get('student_images', [])
        if not image_data:
            return jsonify({'success': False, 'error': 'Missing required field: image_data'}), 400
        if not student_images:
            return jsonify({'success': False, 'error': 'Missing required field: student_images'}), 400

        # Decode classroom image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        image_array = np.array(image)
        if len(image_array.shape) == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)

        # Detect faces in classroom image
        face_locations = face_recognition.face_locations(image_array)
        face_encodings = face_recognition.face_encodings(image_array, face_locations)

        # Prepare student encodings
        student_encodings = []
        for student in student_images:
            try:
                ref_image_data = student['image']
                ref_bytes = base64.b64decode(ref_image_data.split(',')[1])
                ref_image = Image.open(io.BytesIO(ref_bytes))
                ref_array = np.array(ref_image)
                if len(ref_array.shape) == 3:
                    ref_array = cv2.cvtColor(ref_array, cv2.COLOR_RGB2BGR)
                ref_face_locations = face_recognition.face_locations(ref_array)
                ref_face_encodings = face_recognition.face_encodings(ref_array, ref_face_locations)
                if ref_face_encodings:
                    student_encodings.append({
                        'studentId': student['studentId'],
                        'name': student['name'],
                        'email': student['email'],
                        'encoding': ref_face_encodings[0]
                    })
            except Exception as e:
                logger.error(f"Error processing student image for {student.get('name')}: {str(e)}")

        present = set()
        for face_encoding in face_encodings:
            for student in student_encodings:
                distance = face_recognition.face_distance([student['encoding']], face_encoding)[0]
                if distance <= CONFIG['face_recognition_threshold']:
                    present.add(student['studentId'])

        present_students = [
            {'id': s['studentId'], 'name': s['name'], 'email': s['email']}
            for s in student_encodings if s['studentId'] in present
        ]
        absent_students = [
            {'id': s['studentId'], 'name': s['name'], 'email': s['email']}
            for s in student_encodings if s['studentId'] not in present
        ]

        return jsonify({
            'success': True,
            'present': present_students,
            'absent': absent_students,
            'total_faces_detected': len(face_locations)
        }), 200
    except Exception as e:
        logger.error(f"Error in recognize endpoint: {str(e)}")
        return jsonify({'success': False, 'error': f'Internal server error: {str(e)}'}), 500

@app.route('/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    return jsonify({'success': True, 'config': CONFIG})

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
        return jsonify({'success': True, 'message': 'Configuration updated successfully', 'config': CONFIG})
    except Exception as e:
        logger.error(f"Error updating config: {str(e)}")
        return jsonify({'success': False, 'error': f'Error updating config: {str(e)}'}), 500

if __name__ == '__main__':
    logger.info("Starting Face Recognition API Server...")
    logger.info(f"Configuration: {CONFIG}")
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    ) 