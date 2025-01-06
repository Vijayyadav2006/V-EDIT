import './App.css';
import Home from './component/Home';
import { Routes,Route } from "react-router-dom";
import Editorpage from "./component/EditorPage";
import 'bootstrap/dist/css/bootstrap.min.css';
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:roomId" element={<Editorpage />} />
      </Routes>
      </>
  );
}

export default App;
