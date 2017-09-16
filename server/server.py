import os
import MySQLdb as mariadb
import json
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)
port = int(os.getenv('PORT', '3000'))


if os.getenv('VCAP_SERVICES') is not None:
    services = json.loads(os.getenv('VCAP_SERVICES'))
    creds = services['mariadb'][0]['credentials']
    host = creds['host']
    db_port = int(creds['port'])
    username = creds['username']
    pwd = creds['password']
    database = creds['database']
else:
    host = 'localhost'
    db_port = 3306
    username = 'dominik'
    pwd = 'dominik'
    database = 'hackzurich17'

def with_db(fn):
    db = mariadb.connect(host=host, port=db_port, user=username,
                         passwd=pwd, db=database)
    cur = db.cursor()
    res = fn(cur)
    db.commit()
    cur.close()
    db.close()
    return res

with_db(lambda d: d.execute('''DROP TABLE IF EXISTS challenges'''))
with_db(lambda d: d.execute('''
  CREATE TABLE IF NOT EXISTS challenges (
  id INT NOT NULL AUTO_INCREMENT,
  participant VARCHAR(500) NULL,
  sponsors VARCHAR(500) NULL,
  task VARCHAR(150) NULL,
  incentive VARCHAR(100) NULL,
  status VARCHAR(25) NULL,
  PRIMARY KEY (id));
'''))

with_db(lambda d: d.execute('''DROP TABLE IF EXISTS participants'''))
with_db(lambda d: d.execute('''
  CREATE TABLE IF NOT EXISTS participants (
  id VARCHAR(500) NOT NULL,
  name VARCHAR(200),
  image VARCHAR(200),
  rank INT,
  speed DOUBLE,
  PRIMARY KEY (id));
'''))
with_db(lambda d: d.execute('''INSERT INTO participants (id, name, image, rank, speed) VALUES ('1', 'Christian Sailer', 'img/skier1.png', 1, 12.6)'''))
with_db(lambda d: d.execute('''INSERT INTO participants (id, name, image, rank, speed) VALUES ('2', 'David Rudi', 'img/skier2.png', 2, 11.9)'''))
with_db(lambda d: d.execute('''INSERT INTO participants (id, name, image, rank, speed) VALUES ('3', 'Dominik Bucher', 'img/skier3.png', 3, 11.0)'''))
with_db(lambda d: d.execute('''INSERT INTO participants (id, name, image, rank, speed) VALUES ('4', 'Didier Cuche', 'img/skier4.png', 4, 13.0)'''))
with_db(lambda d: d.execute('''INSERT INTO participants (id, name, image, rank, speed) VALUES ('5', 'Alberto Tomba', 'img/skier5.png', 5, 9.9)'''))
with_db(lambda d: d.execute('''INSERT INTO participants (id, name, image, rank, speed) VALUES ('6', 'Hermann Maier', 'img/skier6.png', 6, 8.7)'''))

# Serving frontend.
@app.route('/')
def index():
    return send_from_directory('webapp', 'index.html')

@app.route('/<path:file>')
def serve_file(file):
    return send_from_directory('webapp', file)

# App stuff.
@app.route('/pollChallenges/<path:participant_id>')
def app_poll(participant_id):
    try:
        def get_challenge(cur):
            cur.execute('''SELECT * FROM challenges WHERE participant=%s AND status='INIT' ''', (participant_id,))
            el = cur.fetchall()[0]
            return {'id': el[0],
                    'participant': el[1],
                    'sponsors': el[2],
                    'task': el[3],
                    'incentive': el[4],
                    'status': el[5]}
        res = with_db(get_challenge)
        return jsonify(res)
    except:
        return ''

@app.route('/responseChallenge/<challenge_id>/<command>')
def respond_challenge(challenge_id, command):
    print(command)
    if command == 'accept':
        with_db(lambda d: d.execute('''UPDATE challenges SET status='ACCEPTED' WHERE id=%s''', (challenge_id,)))
        return 'Ok.'
    elif command == 'decline':
        with_db(lambda d: d.execute('''DELETE FROM challenges WHERE id=%s''', (challenge_id,)))
        return 'Ok.'
    elif command == 'fail':
        with_db(lambda d: d.execute('''DELETE FROM challenges WHERE id=%s''', (challenge_id,)))
        # with_db(lambda d: d.execute('''UPDATE challenges SET status='FAIL' WHERE id=%s''', (challenge_id,)))
        return 'Ok.'
    elif command == 'success':
        with_db(lambda d: d.execute('''UPDATE challenges SET status='SUCCESS' WHERE id=%s''', (challenge_id,)))
        return 'Ok.'
    else:
        return 'Ok.'

# Web stuff.
@app.route('/pollParticipantChallenges/<path:participant_id>')
def web_poll(participant_id):
    try:
        def get_challenge(cur):
            cur.execute('SELECT * FROM challenges WHERE participant=%s ORDER BY status', (participant_id,))
            res = cur.fetchall()
            els = [{'id': el[0],
                    'participant': el[1],
                    'sponsors': el[2],
                    'task': el[3],
                    'incentive': el[4],
                    'status': el[5]} for el in res]
            return els
        res = with_db(get_challenge)
        return jsonify(res)
    except:
        return ''

@app.route('/newChallenge', methods=['POST'])
def new_challenge():
    print(request.get_json())
    content = request.get_json(silent=True)
    participant = content['participantId']
    task = content['task']
    incentive = content['incentive']
    sponsors = content['sponsor']
    def insert(cur):
        cur.execute('''INSERT INTO challenges (participant, sponsors, task, incentive, status) VALUES (%s, %s, %s, %s, 'INIT')''',
                  (participant, sponsors, task, incentive))
    with_db(insert)
    return 'Ok.'

@app.route('/pollAllParticipants')
def participants():
        def get_challenge(cur):
            cur.execute('SELECT * FROM participants ORDER BY rank')
            res = cur.fetchall()
            els = [{'id': el[0],
                    'name': el[1],
                    'image': el[2],
                    'rank': el[3], 
                    'speed': el[4]} for el in res]
            return els
        res = with_db(get_challenge)
        return jsonify(res)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
