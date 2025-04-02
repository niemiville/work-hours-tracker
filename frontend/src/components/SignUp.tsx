import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp } from "../api/authApi";
import "../styles/Auth.css";

const SignUp = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [displayname, setDisplayname] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signUp(name, password, displayname); 
      navigate("/signin"); // Redirect to sign in after successful signup
    } catch (err) {
      setError("Signup failed. Try again.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input 
            id="username"
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Choose a username"
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="displayname">Display Name</label>
          <input 
            id="displayname"
            type="text" 
            value={displayname} 
            onChange={(e) => setDisplayname(e.target.value)} 
            placeholder="Enter your display name"
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            id="password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Choose a password"
            required 
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <a href="/signin">Sign in</a></p>
    </div>
  );
};

export default SignUp;