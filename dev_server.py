import http.server
import socketserver
import os
import time
import threading
import json
import socket
from datetime import datetime
from pathlib import Path
import mimetypes

PORT = 8001

def find_available_port(start_port=8002, max_attempts=10):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"Could not find an available port in range {start_port}-{start_port + max_attempts}")

class DevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def end_headers(self):
        # CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Aggressive cache busting for development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        super().end_headers()
    
    def guess_type(self, path):
        """Enhanced MIME type detection"""
        # Convert path to string if it's a Path object
        path_str = str(path)

        # Handle .glb files specifically
        if path_str.endswith('.glb'):
            return 'model/gltf-binary'

        # Call parent method and return just the mimetype
        mimetype, encoding = mimetypes.guess_type(path_str)
        return mimetype or 'application/octet-stream'
    
    def do_GET(self):
        # Handle file change polling endpoint
        if self.path == '/dev/poll':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            # Extra cache busting for poll endpoint
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            
            global last_modified_time
            response = {
                'lastModified': last_modified_time,
                'timestamp': time.time()
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Add cache-busting timestamp to GLB files
        if self.path.endswith('.glb'):
            # Add timestamp query parameter for aggressive cache busting
            parsed_path = self.path
            if '?' not in parsed_path:
                parsed_path += f"?t={int(time.time() * 1000)}"
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Serving GLB with cache-bust: {parsed_path}")
        
        # Handle regular file serving with enhanced cache busting
        super().do_GET()
    
    def do_POST(self):
        # Handle CORS preflight
        if self.path == '/dev/poll':
            self.send_response(200)
            self.end_headers()
            return
        self.send_response(405)  # Method not allowed
        self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

class FileWatcher:
    def __init__(self, directory):
        self.directory = Path(directory)
        self.last_check = time.time()
        self.watched_extensions = {'.js', '.html', '.css', '.py', '.glb'}
        
    def get_latest_modification_time(self):
        latest_time = 0
        
        for root, dirs, files in os.walk(self.directory):
            # Skip hidden directories and __pycache__
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
            
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix.lower() in self.watched_extensions:
                    try:
                        mtime = file_path.stat().st_mtime
                        if mtime > latest_time:
                            latest_time = mtime
                    except (OSError, IOError):
                        continue
        
        return latest_time

# Global variable to track file changes
last_modified_time = time.time()
file_watcher = FileWatcher('.')

def watch_files():
    global last_modified_time
    while True:
        try:
            current_time = file_watcher.get_latest_modification_time()
            if current_time > last_modified_time:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Files changed detected - triggering refresh")
                print(f"  Previous: {datetime.fromtimestamp(last_modified_time).strftime('%H:%M:%S.%f')}")
                print(f"  Current:  {datetime.fromtimestamp(current_time).strftime('%H:%M:%S.%f')}")
                last_modified_time = current_time
        except Exception as e:
            print(f"Error watching files: {e}")
        
        time.sleep(0.5)  # Check every 500ms

def main():
    global last_modified_time
    
    # Find an available port
    try:
        port = find_available_port(PORT)
    except RuntimeError as e:
        print(f"❌ Error: {e}")
        return
    
    # Initialize the last modified time
    last_modified_time = file_watcher.get_latest_modification_time()
    
    # Start file watcher in a separate thread
    watcher_thread = threading.Thread(target=watch_files, daemon=True)
    watcher_thread.start()
    
    # Start the HTTP server
    with socketserver.TCPServer(("", port), DevHandler) as httpd:
        print(f"🚀 Development server running at http://localhost:{port}")
        print("📁 Watching for file changes...")
        print("🔄 Auto-refresh enabled")
        print("Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    main()
