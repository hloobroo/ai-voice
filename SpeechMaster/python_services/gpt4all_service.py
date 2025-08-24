#!/usr/bin/env python3
"""
GPT4All Local Chat Service
Runs GPT4All-J quantized model locally without API keys
"""

import os
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
from gpt4all import GPT4All

class GPT4AllService:
    def __init__(self):
        self.model = None
        self.is_loading = False
        self.is_ready = False
        self.load_model()
    
    def load_model(self):
        """Load GPT4All model (downloads on first run)"""
        print("🤖 Loading GPT4All-J model...")
        self.is_loading = True
        
        try:
            # Download and load the model (auto-downloads to ~/.nomic on first run)
            # Try multiple model names in case one is unavailable
            models_to_try = ["orca-mini-3b-gguf2-q4_0.gguf", "gpt4all-falcon-q4_0.gguf", "orca-mini-3b-gguf2-q4_0"]
            
            for model_name in models_to_try:
                try:
                    print(f"🔄 Trying to load model: {model_name}")
                    self.model = GPT4All(model_name)
                    print(f"✅ Successfully loaded model: {model_name}")
                    break
                except Exception as model_error:
                    print(f"❌ Failed to load {model_name}: {model_error}")
                    continue
            
            if self.model is None:
                raise Exception("Failed to load any available model")
            self.is_ready = True
            self.is_loading = False
            print("✅ GPT4All-J model loaded successfully!")
        except Exception as e:
            print(f"❌ Error loading GPT4All model: {e}")
            self.is_loading = False
            self.is_ready = False
    
    def generate_response(self, prompt, max_tokens=200):
        """Generate response using GPT4All"""
        if not self.is_ready:
            return {"error": "Model not ready. Please wait for it to load."}
        
        try:
            print(f"💭 Generating response for: {prompt[:50]}...")
            
            # Generate response using GPT4All
            with self.model.chat_session():
                response = self.model.generate(prompt, max_tokens=max_tokens)
            
            return {
                "response": response.strip(),
                "model": "gpt4all-j",
                "local": True
            }
        except Exception as e:
            print(f"❌ Error generating response: {e}")
            return {"error": f"Failed to generate response: {str(e)}"}
    
    def get_status(self):
        """Get service status"""
        return {
            "ready": self.is_ready,
            "loading": self.is_loading,
            "model": "gpt4all-j" if self.is_ready else None
        }

# Global service instance
gpt_service = GPT4AllService()

class ChatRequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/status':
            self.send_json_response(gpt_service.get_status())
        else:
            self.send_json_response({"error": "Not found"}, 404)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/chat':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                prompt = data.get('prompt', '').strip()
                max_tokens = data.get('max_tokens', 200)
                
                if not prompt:
                    self.send_json_response({"error": "Prompt is required"}, 400)
                    return
                
                # Generate response
                result = gpt_service.generate_response(prompt, max_tokens)
                self.send_json_response(result)
                
            except json.JSONDecodeError:
                self.send_json_response({"error": "Invalid JSON"}, 400)
            except Exception as e:
                self.send_json_response({"error": str(e)}, 500)
        else:
            self.send_json_response({"error": "Not found"}, 404)
    
    def send_json_response(self, data, status_code=200):
        """Send JSON response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"🐍 {self.address_string()} - {format % args}")

def run_server(port=8000):
    """Run the GPT4All HTTP server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, ChatRequestHandler)
    print(f"🚀 GPT4All service running on port {port}")
    print(f"📡 Endpoints:")
    print(f"   GET  /status - Check model status")
    print(f"   POST /chat   - Generate chat response")
    print(f"🔗 CORS enabled for frontend integration")
    httpd.serve_forever()

if __name__ == '__main__':
    # Start the server
    try:
        run_server(8000)
    except KeyboardInterrupt:
        print("\n👋 GPT4All service shutting down...")
    except Exception as e:
        print(f"❌ Server error: {e}")