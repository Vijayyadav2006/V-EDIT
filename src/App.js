import './App.css';
import Home from './component/Home';
import { Routes, Route } from "react-router-dom";
import EditorPage from "./component/EditorPage"; // Ensure the import name matches the component name
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from "react-hot-toast";

function App() {
  // Define the handleCodeChange function
  const handleCodeChange = (code) => {
    console.log('Code changed:', code);
    // You can add more logic here to handle the code change
  };

  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:roomId" element={<EditorPage onCodeChange={handleCodeChange} />} />
      </Routes>
    </>
  );
}

export default App;