
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Automatically redirect to dashboard since we're removing authentication
    navigate("/");
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/40">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Demand Management Platform</h1>
        <p className="text-muted-foreground mt-2">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default Login;
