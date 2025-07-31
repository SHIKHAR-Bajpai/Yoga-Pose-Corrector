import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { useState, useEffect, useRef } from 'react';
import { FaUserCircle } from 'react-icons/fa';
const API_URL = import.meta.env.VITE_API_URL;

function Navbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [name, setName] = useState(null);
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  const token  = localStorage.getItem('authToken');

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const user = await response.json();
        setName(user.name);
      } catch (err) {
        console.error("Error fetching user:", err);
        localStorage.removeItem("authToken");
      }
    };

    fetchUser();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setName(null);
    navigate('/login');
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target) && isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <div>
      <nav className="fixed top-0 left-0 right-0 z-50 w-full flex justify-between items-center border-b border-secondary_bg px-32 py-3 bg-primary_bg text-main_text mx-auto max-w-scren-lg shadow-glow-strong border_secondary_bg">
        <div className="flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center">
            <img src={logo} className="w-16 h-16 cursor-pointer" alt="Logo" />
            <h1 className="text-4xl font-semibold cursor-pointer font-serif ml-2">
              YogAI
            </h1>
          </NavLink>
        </div>
        <ul className="flex space-x-5 text-xl font-mono items-center">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? "text-primary_accent" : "hover:text-primary_accent border-css cursor-pointer"}>
              Home
            </NavLink>
          </li>

          <li>
            <NavLink to="/yoga-info" className={({ isActive }) => isActive ? "text-primary_accent" : "hover:text-primary_accent border-css cursor-pointer"}>
              Yoga
            </NavLink>
          </li>

      
            <li>
              <NavLink to="/video-feedback" className={({ isActive }) => isActive ? "text-primary_accent" : "hover:text-primary_accent border-css cursor-pointer"}>
                AlignNow
              </NavLink>
            </li>
            <li>
              <NavLink to="/learn-yoga" className={({ isActive }) => isActive ? "text-primary_accent" : "hover:text-primary_accent border-css cursor-pointer"}>
                Poses
              </NavLink>
            </li>
            <li>
              <NavLink to="/assistance" className={({ isActive }) => isActive ? "text-primary_accent" : "hover:text-primary_accent border-css cursor-pointer"}>
                Coach
              </NavLink>
            </li>
            {/* </>
          } */}
          <li className="relative flex items-center" ref={userMenuRef}>
            <button onClick={toggleUserMenu} className="cursor-pointer focus:outline-none flex items-center hover:text-primary_accent">
              <FaUserCircle className="text-3xl" />
              {name && <span className="ml-2 font-semibold">{name.charAt(0).toUpperCase() + name.slice(1)}</span>}
            </button>
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-primary_bg border border-secondary_bg shadow-md rounded-md overflow-hidden">
                {name ? (
                  <>
                    <div className="px-4 py-2 font-semibold text-gray-200 bg-secondary_bg">
                      Hello,{name.charAt(0).toUpperCase() + name.slice(1)}
                    </div>
                    <NavLink to="/yoga-list" className="block px-4 py-2 text-main_text hover:bg-secondary_bg hover:text-primary_accent">
                      PoseList
                    </NavLink>
                    <NavLink to="/profile" className="block px-4 py-2 text-main_text hover:bg-secondary_bg hover:text-primary_accent">
                      Profile
                    </NavLink>
                    <button onClick={handleLogout} className="block w-full text-left text-red-500 px-4 py-2 hover:bg-secondary_bg hover:text-primary_accent focus:outline-none">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/login" className="block px-4 py-2 text-main_text hover:bg-secondary_bg hover:text-primary_accent">
                      Login
                    </NavLink>
                    <NavLink to="/register" className="block px-4 py-2 text-main_text hover:bg-secondary_bg hover:text-primary_accent">
                      Register
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Navbar;