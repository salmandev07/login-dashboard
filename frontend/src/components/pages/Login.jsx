import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
    const[ email, setEmail ] = useState("");
    const[password,setPassword] = useState("");
    const[showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
   

    const navigate = useNavigate();


    const handleLogin = async(e) => {
        e.preventDefault();
    
        if (!email.trim() && !password){
            setError("Enter Your email and Password");
            return;
        }
        if (!email.trim()){
            setError("Enter Your email");
            return;
        } 
        if(!password) {
            setError("Enter Your Password");
            return;
        } 
    try {
         await api.post("/auth/login", {
            email: email.trim().toLowerCase(),
            password,
        });

      

        setEmail("");
        setPassword("");

        setTimeout(() => {
            navigate("/dashboard");
        }, 1000);

    } catch (error) {
        setError(
            error.response?.data?.message || "Login failed. Please try again."
        );
    }
    };

return(
<div className="auth-page">
    <div className="auth-container">
        <h1>Login</h1>
  
        <div>
            <form onSubmit = {handleLogin}>

                {error && <p style={{ color: "red" }}>{error}</p>}
               

             <label> Email : </label>
                 <input type = "text" 
                        name = "email" 
                        placeholder="Enter Your Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} />

            <div className="password-field">
            
             <label> Password: </label>
               
                    <input type = {showPassword ? "text" : "password"} 
                      name = "Password" 
                      placeholder="Enter Your Password"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} />
               
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                >
                    {showPassword ? "Hide" : "Show"}
                </button>
            </div>
                <div>
                <p>
                <Link to="/forgot-password">Forgot Password?</Link>
                </p>
          </div>

                <button type= "submit">Sign in</button>

            </form>


        <p> Don't have an account? <Link to="/register">Register</Link></p>

    </div>
</div>
</div>
)
}

export default Login;