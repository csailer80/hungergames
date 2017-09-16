import os
import MySQLdb as mariadb
import json
from flask import Flask, send_from_directory

app = Flask(__name__)
port = int(os.getenv('PORT', '3000'))


services = json.loads(os.getenv('VCAP_SERVICES'))
print(services)

creds = services['mariadb'][0]['credentials']
host = creds['host']
db_port = int(creds['port'])
username = creds['username']
pwd = creds['password']
database = creds['database']

db = mariadb.connect(host=host, port=db_port, user=username,
                     passwd=pwd, db=database)
cur = db.cursor()
cur.execute('DROP TABLE temp;')
cur.execute('CREATE TABLE IF NOT EXISTS temp (id int);')
cur.execute('INSERT INTO temp VALUES (1);')
cur.execute('SELECT * FROM temp;')
res = cur.fetchall()
for r in res:
    print(r)

cur.close()
db.close()


@app.route('/')
def index():
    return send_from_directory('webapp', 'index.html')

@app.route('/<path:file>')
def serve_file(file):
    return send_from_directory('webapp', file)

@app.route('/app_poll')
def app_poll():
    return 'Thanks!'

@app.route('/web_poll')
def web_poll():
    return 'Thanks!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
