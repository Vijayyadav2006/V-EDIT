import React, { useState, useEffect, useRef } from "react";
import Client from "./Client";
import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/theme-monokai";
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

  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("c");
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const [typing, setTyping] = useState("");
  const username = location.state?.username;

  useEffect(() => {
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
        setTyping(username);
        setTimeout(() => setTyping(""), 1500);
      });

      socketRef.current.emit("join", {
        roomId,
        username,
      });

      socketRef.current.on("joined", ({ clients, username, socketId, code }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined`);
        }
        setClients(clients);

        const currentCode = editorRef.current.getSession().getValue();
        socketRef.current.emit("code-change", {
          roomId,
          code: currentCode,
          senderSocketId: socketRef.current.id,
        });
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
    };

    init();

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off('joined');
      socketRef.current.off('left');
      socketRef.current.off('code-change');
      socketRef.current.off("userTyping");
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
    navigate('/');
  };

  useEffect(() => {
    const editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
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
      editor.destroy();
    };
  }, [onCodeChange, roomId, username]);

  useEffect(() => {
    changeLanguage(language);
  }, [language]);

  function changeLanguage(language) {
    const editor = editorRef.current;
    if (editor) {
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
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div className="col-md-2 bg-dark text-light d-flex flex-column h-100">
          <img src="/images/logo.png" alt="v_editor_logo" className="img-fluid mx-auto" />
          <hr />
          <div className="d-flex flex-column overflow-auto">
            {clients.map((client) => (
              <div key={client.socketId} className={`client ${typing === client.username ? 'typing' : ''}`}>
                <Client username={client.username} />
                {typing === client.username && <div className="typing-indicator-box">{client.username} is typing...</div>}
              </div>
            ))}
          </div>
          <div className="mt-auto">
            <hr />
            <button onClick={copyRoomId} className="btn btn-success">Copy Room Id</button>
            <button onClick={leaveRoom} className="btn btn-danger mt-2">Leave</button>
          </div>
        </div>

        <div className="col-md-10 bg-light text-dark d-flex flex-column h-100">
          <div className="header">V EDITOR</div>
          <div className="control-panel">
            Select Language:&nbsp;
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="php">PHP</option>
              <option value="python">Python</option>
              <option value="node">Node JS</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="editor" id="editor"></div>

          <div className="d-flex justify-content-end p-2">
            <button className="btn btn-success" onClick={executeCode}>Run</button>
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
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
