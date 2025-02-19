import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Login.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import GitHubLogin from "react-github-login";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(""); // For sign-up
  const [lastName, setLastName] = useState(""); // For sign-up
  const [isSignUp, setIsSignUp] = useState(true);
  const [message, setMessage] = useState(""); // For displaying messages
  const [loading, setLoading] = useState(false); // To handle loading state
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setMessage("Please enter a valid email.");
      return;
    }
    setLoading(true); // Set loading state

    const data = isSignUp
      ? {
          signUp: true,
          fName: firstName, // Ensure correct variable used here
          lName: lastName, // Ensure correct variable used here
          email,
          password,
        }
      : {
          signIn: true,
          email,
          password,
        };

    try {
      const response = await fetch("http://localhost/my_editor/register.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setLoading(false); // Reset loading state after response
      if (result.success) {
        setMessage(result.message);
        if (!isSignUp) {
          navigate("/home", {
            state: { firstName: result.fName, email },
          });
        }
      } else if (result.error === "username-taken") {
        setMessage("Username is already taken. Please choose a different username.");
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setLoading(false); // Reset loading state on error
      console.error("Error:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse) => {
    console.log(credentialResponse);
    // Handle Google login success, extract user info and navigate to home
    // Decode the credential to get user info (you may need a library like jwt-decode)
    const user = {}; // Extract user info from the credential
    navigate("/home", {
      state: { firstName: user.given_name, email: user.email },
    });
  };

  const handleGoogleLoginError = () => {
    console.log("Login Failed");
    setMessage("Google login failed. Please try again.");
  };

  const handleGitHubLoginSuccess = (response) => {
    console.log(response);
    // Handle GitHub login success, extract user info and navigate to home
    // You may need to exchange the code for an access token on your backend
    const user = {}; // Extract user info from the response
    navigate("/home", {
      state: { firstName: user.name, email: user.email },
    });
  };

  const handleGitHubLoginFailure = (response) => {
    console.log("Login Failed", response);
    setMessage("GitHub login failed. Please try again.");
  };

  useEffect(() => {
    const inputs = document.querySelectorAll("input[type='text'], input[type='email'], input[type='password']");
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.classList.add("typing");
      });
      input.addEventListener("blur", () => {
        input.classList.remove("typing");
      });
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("focus", () => {
          input.classList.add("typing");
        });
        input.removeEventListener("blur", () => {
          input.classList.remove("typing");
        });
      });
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId="1099090296175-au5rgr6ev296iocfa85g3a0601evgs2l.apps.googleusercontent.com">
      <div className="login-container">
        {/* Remove the video background */}
        <div className="container">
          <h1 className="form-title">{isSignUp ? "Register" : "Sign In"}</h1>
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div className="input-group mb-3">
                  <span className="input-group-text">
                    <i className="fas fa-user"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    name="firstName"
                    placeholder="First Name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="input-group mb-3">
                  <span className="input-group-text">
                    <i className="fas fa-user"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    name="lastName"
                    placeholder="Last Name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control typing-effect"
                name="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ border: "1px solid #ced4da" }}
              />
            </div>
            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type="password"
                className="form-control typing-effect"
                name="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ border: "1px solid #ced4da" }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span>
                  <i className="fas fa-spinner fa-spin"></i> Loading...
                </span>
              ) : isSignUp ? (
                "Register"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="or">----------or----------</p>

          <div className="icons">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
            />
            <GitHubLogin
              clientId="Ov23liwzTy9pLq4DPrCx"
              onSuccess={handleGitHubLoginSuccess}
              onFailure={handleGitHubLoginFailure}
              redirectUri="http://localhost:3000/auth/github/callback"
              buttonText="Login with GitHub"
              className="btn btn-dark"
            />
          </div>

          <div className="links">
            <p>{isSignUp ? "Already have an account?" : "Don't have an account yet?"}</p>
            <button onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>

          {message && <div className="alert alert-info">{message}</div>}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
