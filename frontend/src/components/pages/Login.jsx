import { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
    const[ email, setEmail ] = useState("");
    const[password,setPassword] = useState("");
    const[showPassword, setShowPassword] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
    
        if (!email.trim() && !password){
            alert("Enter Your email and Password");
            return;
        }
        if (!email.trim()){
            alert("Enter Your email");
            return;
        } 
        if(!password) {
            alert("Enter Your Password");
            return;
        } 
    console.log("Logging in with:", { email, password });
  };

return(

    <div>
        <h1>Welcome</h1>
        <h1>Please Login</h1>
  
        <div>
            <form onSubmit = {handleLogin}>

             <label> Email : </label>
                 <input type = "text" 
                        name = "email" 
                        placeholder="Enter Your Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} />

            <div className= "Password_wrapper">
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

                <button type= "submit">Sign in</button>

            </form>


        <p> Don't have an account? <Link to="/register">Register</Link></p>

    </div>
</div>
)
}

export default Login;