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

PORT = 8000

def find_available_port(start_port=8000, max_attempts=10):
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
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Handle file change polling endpoint
        if self.path == '/dev/poll':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            global last_modified_time
            response = {
                'lastModified': last_modified_time,
                'timestamp': time.time()
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Handle regular file serving
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
                last_modified_time = current_time
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Files changed - refresh triggered")
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
