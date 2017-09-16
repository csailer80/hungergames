from flask import Flask, send_from_directory
app = Flask(__name__)

@app.route('/')
def hello1():
    return send_from_directory('../webapp', 'index.html')

@app.route("/<path:file>")
def hello(file):
    return send_from_directory('../webapp', file)

if __name__ == '__main__':
    app.run(port=80)
