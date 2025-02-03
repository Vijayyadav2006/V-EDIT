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
  const { roomId } = useParams(); // Extract roomId from URL parameters
  const [clients, setClients] = useState([]);
  const codeRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("c");
  const editorRef = useRef(null);
  const socketRef = useRef(null); // Ensure socketRef is defined

  // Check if location.state is available
  useEffect(() => {
    if (!location.state) {
      navigate('/');
      return;
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const handleError = (e) => {
      console.log('socket error=>', e);
      toast.error("Socket Connection failed");
      navigate('/');
    };

    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', handleError);
      socketRef.current.on('connect_failed', handleError);

      // Emit join event with roomId and username
      socketRef.current.emit("join", {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on("joined", ({ clients, username, socketId, code }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined`);
        }
        setClients(clients);
        
        // Send the current code to the new user
        const currentCode = editorRef.current.getSession().getValue();
        socketRef.current.emit("code-change", {
          roomId,
          code: currentCode, // Send the current code
          senderSocketId: socketRef.current.id,
        });
      });

      socketRef.current.on("left", ({ socketId, username }) => {
        toast.success(`${username} left`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      });

      // Listen for the code change event
      socketRef.current.on("code-change", (data) => {
        const { code, senderSocketId } = data;
        if (socketRef.current.id !== senderSocketId) {
          const editor = editorRef.current;
          const currentPosition = editor.getCursorPosition();
          editor.session.setValue(code); // Set the code in the editor
          editor.moveCursorToPosition(currentPosition); // Maintain cursor position
        }
      });
    };

    init();

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off('joined');
      socketRef.current.off('left');
      socketRef.current.off('code-change'); // Clean up the event listener
    };
  }, [roomId, location.state?.username, navigate]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room id copied ");
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
      onCodeChange(code); // Call the onCodeChange function
      const { origin } = delta;
      if (origin !== 'setValue') {
        socketRef.current.emit('code-change', {
          roomId,
          code,
          senderSocketId: socketRef.current.id,
        });
      }
    }, 300);

    editor.on("change", handleChange);

    return () => {
      editor.destroy();
    };
  }, [onCodeChange]);

  useEffect(() => {
    changeLanguage(language);
  }, [language]);

  function changeLanguage(language) {
    const editor = editorRef.current;
    if (editor) {
      if (language === "c" || language === "cpp") {
        editor.session.setMode("ace/mode/c_cpp");
      } else if (language === "php") {
        editor.session.setMode("ace/mode/php");
      } else if (language === "python") {
        editor.session.setMode("ace/mode/python");
      } else if (language === "node") {
        editor.session.setMode("ace/mode/javascript");
      } else if (language === "java") {
        editor.session.setMode("ace/mode/java");
      }
    }
  }

  function executeCode() {
    $.ajax({
      url: "http://localhost/my_editor/compiler.php",
      method: "POST",
      data: {
        language: language,
        code: editorRef.current.getSession().getValue(),
      },
      success: function (response) {
        $(".output").text(response);
      },
      error: function (xhr, status, error) {
        const errorMessage = xhr.responseJSON?.message || "An error occurred while executing the code.";
        toast.error(errorMessage);
      },
    });
  }

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div className="col-md-2 bg-dark text-light d-flex flex-column h-100" style={{ boxShadow: "2px 0px 4px rgba(0,0,0,0.1)" }}>
          <img src="/images/logo.png" alt="v_editor_logo" className="img-fluid mx-auto" style={{ maxWidth: "150px", marginTop: "-25px" }} />
          <hr style={{ marginTop: "-1rem" }} />
          <div className="d-flex flex-column overflow-auto">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
          <div className="mt-auto">
            <hr />
            <button onClick={copyRoomId} className="btn btn-success">Copy Room Id</button>
            <button onClick={leaveRoom} className="btn btn-danger mt-2 mb-10 px-5 btn-block">Lost</button>
          </div>
        </div>

        <div className="col-md-10 bg-light text-light d-flex flex-column h-100" style={{ border: "2px dotted black" }}>
          <div className="header">V EDITOR</div>
          <div className="control-panel" >
            Select Language: &nbsp;
            <select id="languages" className="languages" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="php">PHP</option>
              <option value="python">Python</option>
              <option value="node">Node JS</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="editor" id="editor" socketRef={socketRef} roomId={roomId} onCodeChange={(code) => codeRef.current = code}></div>

          <div className="d-flex justify-content-end p-2">
            <button className="btn btn-success custom-run-btn" onClick={executeCode}>Run</button>
          </div>

          <div className="output"></div>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;