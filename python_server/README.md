# Face Recognition API Server

A Python Flask server that provides face recognition capabilities for the attendance system. This server handles face recognition using the `face_recognition` library.

## Features

- **Face Recognition**: Recognize faces in images and return student information
- **Configuration Management**: Adjust recognition thresholds and settings
- **RESTful API**: Clean HTTP endpoints for integration

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- System dependencies for dlib (see installation section)

## Installation

### 1. System Dependencies (Ubuntu/Debian)

```bash
# Install system dependencies for dlib and OpenCV
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-python-dev \
    python3-dev \
    python3-pip \
    python3-venv
```

### 2. Python Dependencies

```bash
# Navigate to the python_server directory
cd python_server

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Alternative: Use the startup script

```bash
# Make the script executable (if not already)
chmod +x start.sh

# Run the startup script
./start.sh
```

## Usage

### Starting the Server

```bash
# Activate virtual environment
source venv/bin/activate

# Start the server
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```http
GET /health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000000",
  "service": "face-recognition-api"
}
```

### Recognize Faces
```http
POST /recognize
Content-Type: application/json

{
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "student_images": [
    {
      "studentId": "student123",
      "name": "John Doe",
      "email": "john@example.com",
      "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    },
    // ... more students
  ]
}
```
Response:
```json
{
  "success": true,
  "present": [
    { "id": "student123", "name": "John Doe", "email": "john@example.com" }
    // ...
  ],
  "absent": [
    { "id": "student456", "name": "Jane Smith", "email": "jane@example.com" }
    // ...
  ],
  "total_faces_detected": 3
}
```

### Get Configuration
```http
GET /config
```
Response:
```json
{
  "success": true,
  "config": {
    "face_recognition_threshold": 0.6,
    "max_faces_per_image": 10,
    "min_face_size": 20
  }
}
```

### Update Configuration
```http
PUT /config
Content-Type: application/json

{
  "face_recognition_threshold": 0.6,
  "max_faces_per_image": 10,
  "min_face_size": 20
}
```
Response:
```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "config": {
    "face_recognition_threshold": 0.6,
    "max_faces_per_image": 10,
    "min_face_size": 20
  }
}
```

## Configuration

The server uses the following configuration:

```python
CONFIG = {
    'face_recognition_threshold': 0.6,  # Lower = more strict matching
    'max_faces_per_image': 10,
    'min_face_size': 20
}
```

### Configuration Parameters

- **face_recognition_threshold**: Distance threshold for face matching (0.0-1.0)
  - Lower values = more strict matching (fewer false positives, more false negatives)
  - Higher values = more lenient matching (more false positives, fewer false negatives)
  - Recommended: 0.6 for most use cases
- **max_faces_per_image**: Maximum number of faces to process in a single image
- **min_face_size**: Minimum face size to detect (in pixels)

## Integration with Next.js

The Python server is designed to work with the Next.js attendance system. The Next.js API routes communicate with this server for face recognition operations.

### Environment Variables

Add to your Next.js `.env.local`:

```env
PYTHON_SERVER_URL=http://localhost:5000
```

## Error Handling

The server returns consistent error responses:

```json
{
  "success": false,
  "error": "Error description"
}
```

Common error scenarios:
- No faces detected in image
- Invalid image format
- Configuration errors

## Performance Considerations

- **Face Detection**: Uses dlib's HOG face detector (fast and accurate)
- **Face Encoding**: Uses dlib's 128-dimensional face encodings

## Security Considerations

- **Input Validation**: All inputs are validated before processing
- **Error Handling**: Sensitive information is not exposed in error messages
- **CORS**: Configured for development, adjust for production
- **Authentication**: Implement proper authentication for production use

## Troubleshooting

### Common Issues

1. **dlib installation fails**
   ```bash
   # Install system dependencies first
   sudo apt-get install build-essential cmake
   sudo apt-get install libopenblas-dev liblapack-dev
   sudo apt-get install libx11-dev libgtk-3-dev
   sudo apt-get install libboost-python-dev
   ```

2. **OpenCV installation issues**
   ```bash
   # Try installing opencv-python-headless instead
   pip install opencv-python-headless
   ```

3. **Memory issues with large images**
   - Resize images before sending to the API
   - Adjust `max_faces_per_image` configuration

4. **Face recognition accuracy**
   - Adjust `face_recognition_threshold`
   - Ensure good lighting in images
   - Use high-quality face images for registration

### Logs

The server logs all operations to stdout. Check logs for debugging:

```bash
python app.py 2>&1 | tee server.log
```

## Development

### Running in Development Mode

```bash
# Set debug mode
export FLASK_ENV=development
python app.py
```

### Testing

Test the API endpoints using curl or Postman:

```bash
# Health check
curl http://localhost:5000/health

# Get configuration
curl http://localhost:5000/config
```

## Production Deployment

For production deployment:

1. **Use a production WSGI server** (Gunicorn, uWSGI)
2. **Set up proper logging**
3. **Configure environment variables**
4. **Set up monitoring and health checks**
5. **Implement proper authentication**
6. **Set up SSL/TLS**

Example with Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Notes

- **Stateless**: This implementation does not persist face data or use a database. All recognition is performed in-memory per request.
- **Extensibility**: You can extend the server to add registration, face management, and database features as needed.

## License

This project is part of the attendance system and follows the same license. 