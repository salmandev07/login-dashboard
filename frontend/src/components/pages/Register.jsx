
import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();

    if (password.length < 8) {
      alert("Password must contain at least 8 characters");
      return;
    }
     if (password.length > 15) {
      alert("Password must be less than 15 characters");
      return;
    }

    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Registration form submitted");
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h1>Create Account</h1>
        <p>Register to get started</p>

        <form onSubmit={handleRegister}>

        <div>

          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

        </div>
        <div>

          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
         
            required
          />
        </div>
          <button type="submit" className="login-button">
            Register
          </button>

        </form>

        <p className="register-text">
          Already have an account? <Link to="/">Login</Link>
        </p>

      </div>
    </div>
  );
}

export default Register;
