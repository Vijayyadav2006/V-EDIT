import React, { useState, useEffect, useRef } from "react";
import Client from "./Client";
import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/theme-terminal";
import "ace-builds/src-noconflict/theme-tomorrow";
import $ from "jquery";
import "./style.css";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { initSocket } from "../socket";

function EditorPage({ onCodeChange }) {
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [output, setOutput] = useState("");
  const [theme, setTheme] = useState("monokai");

  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("c");
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const [typing, setTyping] = useState("");
  const audioElementRef = useRef(null);
  const username = location.state?.username;
  const email = location.state?.email; // You can use email if needed

  useEffect(() => {
    if (!username) {
      toast.error("Username is required");
      navigate('/');
      return;
    }
    if (socketRef.current) return;

    const handleError = (e) => {
      console.log('socket error =>', e);
      toast.error("Socket Connection failed");
      navigate('/');
    };

    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', handleError);
      socketRef.current.on('connect_failed', handleError);

      socketRef.current.on("userTyping", ({ username }) => {
        if (username !== location.state?.username) {
          setTyping(username);
          setTimeout(() => setTyping(""), 1500);
        }
      });

      socketRef.current.emit("join", {
       roomId,
        username,
      });

      socketRef.current.on("joined", ({ clients, username: joinedUser, socketId }) => {
        setClients((prev) => {
          const existingClient = prev.find((client) => client.socketId === socketId);
          if (!existingClient) {
            return [...prev, { socketId, username: joinedUser }];
          }
          return prev;
        });

        if (joinedUser !== username) {
          toast.success(`${joinedUser} joined`);
        }

        const currentCode = editorRef.current.getSession().getValue();
        socketRef.current.emit("code-change", {
          roomId,
          code: currentCode,
          senderSocketId: socketRef.current.id,
        });
      });

      socketRef.current.on("init-clients", ({ clients }) => {
        setClients(clients);
      });

      socketRef.current.on("left", ({ socketId, username }) => {
        toast.success(`${username} left`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      });

      socketRef.current.on("code-change", (data) => {
        const { code, senderSocketId } = data;
        if (socketRef.current.id !== senderSocketId) {
          const editor = editorRef.current;
          const currentPosition = editor.getCursorPosition();
          const currentCode = editor.getValue();

          if (currentCode !== code) {
            editor.session.setValue(code);
            editor.moveCursorToPosition(currentPosition);
          }
        }
      });

      // Handle audio toggle
      socketRef.current.on("toggle-audio", ({ socketId, isAudioEnabled }) => {
        setClients((prev) =>
          prev.map((client) =>
            client.socketId === socketId ? { ...client, isAudioEnabled } : client
          )
        );
      });

      // Handle audio streams
      socketRef.current.on("start-audio", ({ audioTracks }) => {
        const stream = new MediaStream(audioTracks);
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = stream;
          audioElementRef.current.play();
        }
      });

      socketRef.current.on("stop-audio", () => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = null;
        }
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off('joined');
        socketRef.current.off('init-clients');
        socketRef.current.off('left');
        socketRef.current.off('code-change');
        socketRef.current.off("userTyping");
        socketRef.current.off("toggle-audio");
        socketRef.current.off("start-audio");
        socketRef.current.off("stop-audio");
      }
    };
  }, [roomId, username, navigate, location.state?.username]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room id copied");
    } catch (error) {
      toast.error("Failed to copy room id", error);
    }
  };

  const leaveRoom = () => {
    navigate('/home');
  };

  const toggleAudio = (socketId) => {
    const client = clients.find((client) => client.socketId === socketId);
    if (client) {
      const isAudioEnabled = !client.isAudioEnabled;
      socketRef.current.emit("toggle-audio", { socketId, isAudioEnabled });
      setClients((prev) =>
        prev.map((client) =>
          client.socketId === socketId ? { ...client, isAudioEnabled } : client
        )
      );
    }
  };

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log(stream);  // Check if stream is valid
      const audioTracks = stream.getAudioTracks();
      console.log(audioTracks);  // Check if tracks are available
      socketRef.current.emit("start-audio", { roomId, audioTracks });

      if (audioElementRef.current) {
        audioElementRef.current.srcObject = stream;
        audioElementRef.current.play();
      }
    } catch (error) {
      toast.error("Failed to start audio");
    }
  };

  const stopAudio = () => {
    if (audioElementRef.current) {
      const stream = audioElementRef.current.srcObject;
      const tracks = stream?.getTracks();
      
      if (tracks) {
        tracks.forEach(track => track.stop());
      }

      audioElementRef.current.srcObject = null;
    }

    socketRef.current.emit("stop-audio", { roomId });
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    const editor = editorRef.current;
    editor.setTheme(`ace/theme/${newTheme}`);
  };

  useEffect(() => {
    const editor = ace.edit("editor");
    editor.setTheme(`ace/theme/${theme}`);
    editor.session.setMode("ace/mode/c_cpp");
    editor.setOptions({
      fontSize: "14px",
      fontFamily: "Courier New, monospace",
      cursorStyle: "slim",
      showPrintMargin: false,
      wrap: true,
      indentedSoftWrap: false,
      animatedScroll: true,
    });

    editor.renderer.setPadding(10);
    editor.renderer.setScrollMargin(8, 8);

    editorRef.current = editor;

    const debounce = (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    };

    const handleChange = debounce((delta) => {
      const code = editor.session.getValue();
      onCodeChange(code);

      if (delta.action === "insert" || delta.action === "remove") {
        socketRef.current.emit("typing", {
          roomId,
          username,
        });
      }

      const { origin } = delta;
      if (origin !== 'setValue') {
        socketRef.current.emit('code-change', {
          roomId,
          code,
          senderSocketId: socketRef.current.id,
        });
      }
    }, 100);

    editor.on("change", handleChange);

    return () => {
      editor.off("change", handleChange);
      editor.destroy();
    };
  }, [onCodeChange, roomId, username, theme]);

  useEffect(() => {
    const editor = editorRef.current;
    editor.setTheme(`ace/theme/${theme}`);
    document.body.className = `theme-${theme}`;
  }, [theme]);

  useEffect(() => {
    changeLanguage(editorRef.current, language);
  }, [language, theme]);

  function changeLanguage(editor, language) {
    const modes = {
      c: "ace/mode/c_cpp",
      cpp: "ace/mode/c_cpp",
      php: "ace/mode/php",
      python: "ace/mode/python",
      node: "ace/mode/javascript",
      java: "ace/mode/java",
    };
    editor.session.setMode(modes[language] || "ace/mode/c_cpp");
  }

  function executeCode() {
    $.ajax({
      url: "http://localhost/my_editor/compiler.php",
      method: "POST",
      data: {
        language: language,
        code: editorRef.current.getSession().getValue(),
        input: userInput,
      },
      success: function (response) {
        setOutput(response);
      },
      error: function (xhr) {
        const errorMessage = xhr.responseJSON?.message || "An error occurred while executing the code.";
        toast.error(errorMessage);
      },
    });
  }

  return (
    <div className={`container-fluid vh-100 theme-${theme}`}>
      <div className="row h-100">
        <div className="col-md-2 d-flex flex-column h-100">
          <div className="d-flex justify-content-between align-items-center">
            <img src="/images/logo.png" alt="v_editor_logo" className="img-fluid mx-auto" />
          </div>
          <hr />
          <div className="d-flex flex-column overflow-auto">
            {clients.map((client) => (
              <div key={client.socketId} className={`client ${typing === client.username ? 'typing' : ''}`}>
                <Client username={client.username} />
                {typing === client.username && <div className="typing-indicator-box">{client.username} is typing...</div>}
                <div className="audio-controls">
                  <div
                    className={`audio-icon ${client.isAudioEnabled ? 'audio-on' : 'audio-off'}`}
                    onClick={() => toggleAudio(client.socketId)}
                  >
                    {client.isAudioEnabled ? "🔊" : "🔇"}
                  </div>
                  <span>{client.isAudioEnabled ? "Audio On" : "Audio Off"}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto">
            <hr />
            <button onClick={copyRoomId} className="btn btn-success mb-2">Copy Room Id</button>
            <button onClick={leaveRoom} className="btn btn-danger mb-2">Leave</button>
            <button onClick={startAudio} className="btn btn-primary mb-2">Start Audio</button>
            <button onClick={stopAudio} className="btn btn-secondary mb-2">Stop Audio</button>
            <audio ref={audioElementRef} style={{ display: 'none' }}></audio>
          </div>
        </div>

        <div className="col-md-10 d-flex flex-column h-100">
          <div className="header">V EDITOR</div>
          <div className="control-panel">
            <span className="language-icon">🌐</span> Select Language:&nbsp;
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="language-select">
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="php">PHP</option>
              <option value="python">Python</option>
              <option value="node">Node JS</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="theme-selector">
            <button onClick={() => changeTheme('monokai')} className="btn btn-secondary">Monokai</button>
            <button onClick={() => changeTheme('twilight')} className="btn btn-secondary">Twilight</button>
            <button onClick={() => changeTheme('github')} className="btn btn-secondary">GitHub</button>
            <button onClick={() => changeTheme('solarized_dark')} className="btn btn-secondary">Solarized Dark</button>
            <button onClick={() => changeTheme('solarized_light')} className="btn btn-secondary">Solarized Light</button>
            <button onClick={() => changeTheme('terminal')} className="btn btn-secondary">Terminal</button>
            <button onClick={() => changeTheme('tomorrow')} className="btn btn-secondary">Tomorrow</button>
          </div>

          <div className="editor" id="editor"></div>

          <div className="d-flex justify-content-end p-2">
            <button className="btn btn-primary custom-run-btn" onClick={executeCode}>Run</button>
          </div>

          <div className="input-output-section">
            <textarea
              className="form-control"
              placeholder="Enter input here..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            ></textarea>

            <pre className="output">{output}</pre>
          </div>

          <div className="user-info">
            <p>Logged in as: {username} ({email})</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
