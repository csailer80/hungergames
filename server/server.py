import os
from flask import Flask, send_from_directory
app = Flask(__name__)

port = int(os.getenv('PORT', '3000'))

@app.route('/')
def hello1():
    return send_from_directory('webapp', 'index.html')

@app.route("/<path:file>")
def hello(file):
    return send_from_directory('webapp', file)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
