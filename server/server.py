import os
import MySQLdb as mariadb
import json
from flask import Flask, send_from_directory, jsonify, request

app = Flask(__name__)
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

with_db(lambda d: d.execute('''DROP TABLE IF EXISTS hackzurich17.challenges'''))
with_db(lambda d: d.execute('''
  CREATE TABLE IF NOT EXISTS hackzurich17.challenges (
  id INT NOT NULL AUTO_INCREMENT,
  participant VARCHAR(500) NULL,
  sponsors VARCHAR(500) NULL,
  task VARCHAR(150) NULL,
  incentive VARCHAR(100) NULL,
  status VARCHAR(25) NULL,
  PRIMARY KEY (id));
'''))

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
            cur.execute('SELECT * FROM challenges WHERE participant=%s', (participant_id,))
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

@app.route('/respondChallenge/<path:challenge_id>', methods=['POST'])
def respond_challenge(challenge_id):
    content = request.get_json(silent=True)
    if content['response'] == 'ACCEPT':
        with_db(lambda d: d.execute('''UPDATE challenges SET status='ACCEPTED' WHERE id=%s''', (challenge_id,)))
        return 'Ok.'
    elif content['response'] == 'REJECT':
        with_db(lambda d: d.execute('''DELETE FROM challenges WHERE id=%s''', (challenge_id,)))
        return 'Ok.'
    else:
        return 'Ok.'

# Web stuff.
@app.route('/web_poll')
def web_poll():
    try:
        def get_challenge(cur):
            cur.execute('SELECT * FROM challenges')
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
