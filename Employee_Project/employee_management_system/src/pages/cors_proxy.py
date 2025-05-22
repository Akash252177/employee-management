from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Backend API URL
BACKEND_URL = 'http://localhost:5005'

@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy(path):
    # Forward the request to the backend API
    url = f"{BACKEND_URL}/{path}"
    
    # Get request headers and data
    headers = {key: value for key, value in request.headers if key != 'Host'}
    data = request.get_data()
    
    # Forward the request with the appropriate method
    if request.method == 'GET':
        resp = requests.get(url, headers=headers, params=request.args)
    elif request.method == 'POST':
        resp = requests.post(url, headers=headers, data=data)
    elif request.method == 'PUT':
        resp = requests.put(url, headers=headers, data=data)
    elif request.method == 'DELETE':
        resp = requests.delete(url, headers=headers)
    elif request.method == 'OPTIONS':
        resp = requests.options(url, headers=headers)
    else:
        return jsonify({"error": "Method not supported"}), 405
    
    # Create a Flask response with the same content and status code
    response = Response(
        resp.content, 
        status=resp.status_code,
        content_type=resp.headers.get('Content-Type', 'application/json')
    )
    
    # Add CORS headers to ensure browser accepts the response
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    
    return response

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "message": "CORS proxy is running!"})

if __name__ == '__main__':
    print("Starting CORS proxy server on port 5002...")
    print("Forwarding requests to:", BACKEND_URL)
    app.run(debug=True, port=5002) 