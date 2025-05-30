import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from "@/components/ui/loader-one.jsx";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setTimeout(() => {
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    }, 200); 
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary_bg">
        <Loader />
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

export default ProtectedRoute;
