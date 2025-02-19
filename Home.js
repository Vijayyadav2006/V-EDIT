import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { toast } from "react-hot-toast";
import { v4 as uuid } from "uuid";
import { useNavigate, useLocation } from "react-router-dom";
import "./home.css";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      setFirstName(location.state.firstName || "");
      setLastName(location.state.lastName || "");
      setEmail(location.state.email || "");
    }
  }, [location.state]);

  const generateRoomId = (e) => {
    e.preventDefault();
    const id = uuid();
    setRoomId(id);
    toast.success("Congratulations on generating the Room ID! 🎉");
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!roomId.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error("Please enter the Room ID, First Name, and Last Name");
      return;
    }
    if (isUsernameTaken(firstName)) {
      setError("Username is already taken. Please choose another one.");
      return;
    }
    navigate(`/editor/${roomId}`, {
      state: { username: `${firstName} ${lastName}`, email },
    });
    toast.success("You have successfully joined the room! 🎉");
  };

  const isUsernameTaken = (username) => {
    return false; // Implement your logic to check if the username is taken
  };

  const handleLogout = () => {
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("email");
    toast.success("You have successfully logged out!");
    navigate("/login");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    joinRoom(e);
  };

  useEffect(() => {
    // Enable the submit button if the form is valid
    const isFormValid = roomId.trim() && firstName.trim() && lastName.trim();
    const submitButton = document.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = !isFormValid;
    }
  }, [roomId, firstName, lastName]);

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="home-card-body">
          <img
            className="home-logo"
            src="/images/logo.png"
            alt="v_editor_logo"
          />
          <h4 className="home-title">Enter the Room Id</h4>
          <form id="demo-form" onSubmit={handleFormSubmit}>
            <div className="form-group">
              <div className="input-group mb-3 position-relative">
                <span className="input-group-text">
                  <i className="fas fa-door-open"></i>
                </span>
                <input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  type="text"
                  className="form-control"
                  placeholder="Room Id"
                  aria-label="Room ID"
                  required
                />
                {roomId && <span className="input-overlay">{roomId}</span>}
              </div>
              <div className="input-group mb-3 position-relative">
                <span className="input-group-text">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  type="text"
                  className="form-control"
                  placeholder="First Name"
                  aria-label="First Name"
                  required
                />
                {firstName && <span className="input-overlay">{firstName}</span>}
              </div>
              <div className="input-group mb-3 position-relative">
                <span className="input-group-text">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  type="text"
                  className="form-control"
                  placeholder="Last Name"
                  aria-label="Last Name"
                  required
                />
                {lastName && <span className="input-overlay">{lastName}</span>}
              </div>
              {error && <p className="text-danger">{error}</p>}
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
              >
                Submit
              </button>
              <p className="mt-3">
                Don't have a room id?{" "}
                <span
                  className="text-primary p-2"
                  style={{ cursor: "pointer" }}
                  onClick={generateRoomId}
                >
                  New Room
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
      <button onClick={handleLogout} className="btn btn-danger logout-button">
        Logout
      </button>
    </div>
  );
}

Home.propTypes = {
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  email: PropTypes.string,
  roomId: PropTypes.string,
  error: PropTypes.string,
};

export default Home;
