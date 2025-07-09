import "./App.css";
import Channel from "./components/Channel";
import Main from "./pages/Main";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const user = {
    id: "1",
    name: "John Doe",
    email: "exzm.gamil.com",
    password: "12345678",
  };

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/main" element={<Main user={user} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
