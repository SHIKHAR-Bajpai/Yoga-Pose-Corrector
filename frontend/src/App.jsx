import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import Navbar from './components/Navbar';
import MainContent from './components/Home';
import PoseChecker from './components/PoseChecker'; 
import YogaPoses from './components/YogaPoses';
import Assistant from './components/Assistant';
import Login from './components/Login';
import Register from './components/Register';
import EditProfile from './components/EditProfile';
import Footer from './components/Footer';
import FavoritePoses from './components/FavouritePose';
import YogaInfo from './components/YogaInfo';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-primary_bg text-white">
        
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MainContent />} /> 
            <Route path="/login" element={<Login />} /> 
            <Route path="/register" element={<Register />} />
            <Route path='/yoga-info' element={<YogaInfo />} />
            <Route path="/learn-yoga" element={ <YogaPoses/>}/>
            

            {/* Protected Routes */}
            <Route path="/profile" element={ 
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute> 
            } />

            <Route path="/video-feedback" element={ 
              <ProtectedRoute>
                <PoseChecker />
              </ProtectedRoute>
            } /> 

            <Route path="/yoga-list" element={
              <ProtectedRoute>
                <FavoritePoses />
              </ProtectedRoute>
            } />

            <Route path="/assistance" element={ 
              <ProtectedRoute>
                <Assistant />
              </ProtectedRoute>
            }  />

          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
