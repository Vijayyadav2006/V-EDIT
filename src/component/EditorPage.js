import React, { useState } from "react";
import Client from "./Client";

function Editorpage() {
    const [clients, setClient] = useState([
      {socketId:1,username:"Vijay"},
      {socketId:2,username:"VIJAY"},
    ]);
  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div
          className="col-md-2 bg-dark text-light d-flex flex-column h-100"
          style={{ boxShadow: "2px 0px 4px rgba(0,0,0,0.1)" }}
        >
          <img
            src="/images/logo.png"
            alt="v_editor_logo"
            className="img-fluid mx-auto"
            style={{ maxWidth: "150px", marginTop: "-25px" }}
          />
          <hr style={{marginTop:"-1rem"}}/>


          {/*Client list container*/}

          <div className="d-flex flex-column overflow-auto">
            {clients.map((  client) =>(
              <Client key={client.socketId} username={client.username}  />
            ) )}
          </div>
          {/*Button*/}
      
          <div className="mt-auto">
          <hr />
            <button className="btn btn-success">
              Copy Room Id
            </button>
            <button className="btn btn-danger  mt-2 mb-10 px-5 btn-block">
              Lost 
            </button>
          </div>
        </div>

{/*Editor Section*/}

        <div className="col-md-10 text-light d-flex flex-column h-100">
          <div class="header"> VIJAYXZ TEST </div>
          <div class="control-panel">
            Select Language: &nbsp; &nbsp;
            <select
              id="languages"
              class="languages"
              onchange="changeLanguage()"
            >
              <option value="c"> C </option>
              <option value="cpp"> C++ </option>
              <option value="php"> PHP </option>
              <option value="python"> Python </option>
              <option value="node"> Node JS </option>
              <option value="java"> Java </option>
            </select>
          </div>
          <div class="editor" id="editor"></div>

          <div class="button-container">
            <button class="btn" onclick="executeCode()">
              {" "}
              Run{" "}
            </button>
          </div>

          <div class="output"></div>

          <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
          <script src="js/lib/ace.js"></script>
          <script src="js/lib/theme-monokai.js"></script>
          <ide />
        </div>
      </div>
    </div>
  );
}

export default Editorpage;
