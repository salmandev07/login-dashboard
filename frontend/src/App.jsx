import { BrowserRouter, Routes, Route } from "react-router-dom";
import ForgotPassword from "./components/pages/ForgotPassword";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import Dashboard from "./components/pages/Dashboard";



function App() {
  return(

    <BrowserRouter>
      <Routes>
        <Route path = "/" element = {<Login />} />
        <Route path = "/register" element = {<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;