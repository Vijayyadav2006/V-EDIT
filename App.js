import './App.css';
import Home from './component/Home';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EditorPage from "./component/EditorPage";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from "react-hot-toast";
import Login from './component/Login';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  // Define the handleCodeChange function
  const handleCodeChange = (code) => {
    console.log('Code changed:', code);
    // You can add more logic here to handle the code change
  };

  return (
    <GoogleOAuthProvider clientId="1099090296175-au5rgr6ev296iocfa85g3a0601evgs2l.apps.googleusercontent.com">
      <Router>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<Login />} /> {/* Root path set to Login */}
          <Route path="/home" element={<Home />} />
          <Route path="/editor/:roomId" element={<EditorPage onCodeChange={handleCodeChange} />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
