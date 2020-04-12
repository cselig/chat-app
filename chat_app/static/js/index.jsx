import React from "react";
import ReactDOM from "react-dom";
import io from "socket.io-client"

let $ = require("jquery");

class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = {offscreen: true};
  }

  componentDidMount() {
    setTimeout(
      () => this.setState({offscreen: false}),
      50);
    setTimeout(
      () => $(".message." + this.props.message.id)[0].scrollIntoView({behavior: "smooth"}),
      350 // timeout + transition duration
    );
  }

  render() {
    let {message, user_id} = this.props;
    let {content, id, name, sender_id} = message;

    let className = (sender_id === user_id) ? "self" : "other";

    let x_translate = (!this.state.offscreen) ? 0 :
      (className == "self") ? 100 : -100;
    let translate = `translate(${x_translate}px,0px)`

    return (
      <div
        className={"message " + className + " " + id}
        style={{transform: translate}}
      >
        <p className="author">{name}</p>
        <div className="content">{content}</div>
      </div>);
  }
}

function MessageWindow({messages, user_id}) {
  let messages_disp = messages.map((m, i) => {
    return <Message message={m} key={m.id} user_id={user_id} />;
  });
  return (
    <div className="message-window">
        {messages_disp}
    </div>
  )
}

function Composer({sendMessage}) {
  return (
    <div className="composer">
      <input name="messageInput"></input>
      <button onClick={sendMessage}>Send</button>
    </div>
  )
}

function ChatWindow({participants, messages, user_id, sendMessage}) {
  return (
    <div className="chat-container">
      <div className="participants">
        <p style={{marginRight: 5}}>In Room:</p>
        <p>{participants.map(x => x.name).join(", ")}</p>
      </div>
      <MessageWindow messages={messages} user_id={user_id} />
      <Composer sendMessage={sendMessage} />
    </div>
  );
}

class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      joined_room: false,
      messages: [],
      participants: [],
      user_id: "",
      name: "",
    };
  }

  componentDidMount() {
    // connect to server and register callbacks
    this.socket = io('http://localhost:5000');

    this.socket.on('connect', () => console.log("connected"));
    this.socket.on('disconnect', () => console.log("disconnect"));

    // you joined the room
    this.socket.on('join_room', ({id, participants}) => {
      this.setState({
        user_id: id,
        joined_room: true,
        participants: participants,
      });
      this.socket.emit(
        "message",
        {"content": "hi",
         "sender_id": this.state.user_id,
         "name": this.state.name}
      );
    });

    // anyone joined the room
    this.socket.on("new_participant", ({participants}) => {
      this.setState({participants: participants});
    });

    // received message
    this.socket.on("message", (data) => {
      this.setState(prevState => ({messages: prevState.messages.concat([data])}));
    });
  }

  joinRoom() {
    let name = $("input[name=nameInput]").val();
    if (name !== "") {
      this.setState({name: name})
      this.socket.emit("join_room", {"name": name});
      // server will then send "join_room" event, which triggers client callback
      // and updates component state
    }
  }

  sendMessage() {
    let message = $("input[name=messageInput]").val();
    $("input[name=messageInput]").val("");
    if (message.trim() != "") {
      this.socket.emit(
        "message",
        {"content": message,
        "sender_id": this.state.user_id,
        "name": this.state.name}
      );
    }
  }

  render() {
    if (this.state.joined_room) {
      return <ChatWindow
                participants={this.state.participants}
                messages={this.state.messages}
                user_id={this.state.user_id}
                sendMessage={() => this.sendMessage()} />
    } else {
      return (
        <div className="splash-container">
          <h2>Hi!</h2>
          <input name="nameInput"></input>
          <button onClick={() => this.joinRoom()}>
            Join Room
          </button>
        </div>
      );
    }
  }
}

ReactDOM.render(<Container/>, document.getElementById('app'));
