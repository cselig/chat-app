import random, string

from flask import Flask, render_template, jsonify
from flask_scss import Scss
from flask_socketio import SocketIO, join_room, emit, send

app = Flask(
    __name__,
    static_folder="../static/dist",
    template_folder="../static/html",
)
Scss(
    app,
    asset_dir='../static/css',
    static_dir='../static/dist',
)
socketio = SocketIO(app)

ROOM_ID = 1
PARTICIPANTS = []

def new_uuid():
  return ''.join(random.choices(string.ascii_letters, k=8))

@app.route('/')
def index():
  return render_template('index.html')

@socketio.on('join_room')
def on_join(data):
  name = data['name']
  id = new_uuid()
  PARTICIPANTS.append({"id": id, "name": name})
  join_room(ROOM_ID)
  emit(
    'join_room',
    {
      "room_id": ROOM_ID,
      "name": name,
      "id": id,
      "participants": PARTICIPANTS,
    }
  )
  emit(
    'new_participant',
    {
      "room_id": ROOM_ID,
      "name": name,
      "id": id,
      "participants": PARTICIPANTS,
    },
    room=ROOM_ID,
  )

@socketio.on('message')
def on_join(data):
  # append ID and pass message through
  data['id'] = new_uuid()
  emit('message', data, room=ROOM_ID)

@socketio.on('disconnect')
def disconnect():
  print('disconnect')

if __name__ == "__main__":
  socketio.run(app)
