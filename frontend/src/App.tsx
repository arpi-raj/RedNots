import "./App.css";
import User from "./components/User";
import { RecoilRoot } from "recoil";
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
        <RecoilRoot>
          <Routes>
            <Route path="/home" element={<User />} />
          </Routes>
        </RecoilRoot>
      </div>
    </Router>
  );
}

export default App;
