from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS to allow all origins, methods, and headers
CORS(app, resources={r"/*": {
    "origins": "*",  # Allow all origins
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
}})

@app.route('/test-cors', methods=['GET'])
def test_cors():
    return {'success': True, 'message': 'CORS is working correctly!'}

if __name__ == '__main__':
    app.run(debug=True, port=5001) 