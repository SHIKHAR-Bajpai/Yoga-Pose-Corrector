import { useState, useEffect } from 'react';
import Loader from "@/components/ui/loader-one.jsx";
import { useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL;

console.log(API_URL);

const ProfileEditForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login'); 
          return;
        }

        const response = await fetch(`${API_URL}/user`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log(response);

        if (response.ok) {
          const userData = await response.json();
          setName(userData.name || '');
          setEmail(userData.email || '');
        } else {
          const errorData = await response.json().catch(() => ({ message: `Failed to fetch profile with status: ${response.status}` }));
          console.error('Failed to fetch profile:', response.status, errorData);
          setError(errorData.message || 'Failed to load profile information.');
        }
      } catch (err) {
        console.error('Network error while fetching profile:', err);
        setError('Could not connect to the profile service.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const payload = {};
      if (name) payload.name = name;
      if (email) payload.email = email;
      if (password) payload.password = password; 

      const response = await fetch(`${API_URL}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message || 'Profile updated successfully!');
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({ message: `Failed to update profile with status: ${response.status}` }));
        console.error('Failed to update profile:', response.status, errorData);
        setError(errorData.message || 'Failed to update profile information.');
      }
    } catch (err) {
      console.error('Network error during profile update:', err);
      setError('Could not connect to the profile update service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_URL}/user`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          localStorage.removeItem('authToken');
          window.location.href = '/register';
        } else {
          const errorData = await response.json().catch(() => ({ message: `Failed to delete account with status: ${response.status}` }));
          console.error('Failed to delete account:', response.status, errorData);
          setError(errorData.message || 'Failed to delete your account.');
        }
      } catch (err) {
        console.error('Network error during account deletion:', err);
        setError('Could not connect to the account deletion service.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className='flex justify-center py-14 mt-24'>
      <div className="w-1/3 rounded-lg bg-secondary_bg p-8 text-gray-100">
        <p className="text-center text-3xl font-bold">Edit Profile</p>

        {isLoading && <div className="mt-6"><Loader className="mx-auto h-8 w-8" /></div>}

        {!isLoading && (
          <form className="mt-6" onSubmit={handleUpdateProfile}>
            <div className="mt-4">
              <label htmlFor="name" className="block text-gray-400 mb-1">Name</label>
              <input type="text" name="name" id="name" placeholder="Name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-700 outline-none bg-gray-900 py-3 px-4 text-gray-100 focus:border-primary_accent"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="email" className="block text-gray-400 mb-1">Email</label>
              <input type="email" name="email" id="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-700 outline-none bg-gray-900 py-3 px-4 text-gray-100 focus:border-primary_accent"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="password" className="block text-gray-400 mb-1">New Password (optional)</label>
              <input type={showPassword ? "text" : "password"} name="password" id="password" placeholder="Leave blank to keep current password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-700 outline-none bg-gray-900 py-3 px-4 text-gray-100 focus:border-primary_accent"
              />
              <div className="flex items-center mt-2">
                <input type="checkbox" id="showPassword" checked={showPassword} onChange={() => setShowPassword((prev) => !prev)}
                  className="mr-2 accent-primary_accent" />
                <label htmlFor="showPassword" className="text-sm text-gray-400 select-none"> Show password </label>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-center text-sm text-red-400">{error}</p>
            )}

            {successMessage && (
              <p className="mt-3 text-center text-sm text-green-400">{successMessage}</p>
            )}

            <button type="submit" disabled={isLoading}
              className="mt-6 block w-full p-3 text-center font-mono border border-primary_accent font-semibold hover:bg-primary_accent hover:text-secondary_bg disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader className="mx-auto h-5 w-5" /> : 'Update Profile'}
            </button>
          </form>
        )}

        {!isLoading && (
          <div className="mt-8 pt-4 border-t border-gray-700">
            <button onClick={handleDeleteAccount} className="w-full p-3 text-center font-mono text-red-500 border border-red-500 font-semibold hover:bg-red-500 hover:text-secondary_bg focus:outline-none">
              Delete Account
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          <a rel="noopener noreferrer" href="/"
            className="text-gray-100 text-sm hover:underline hover:decoration-primary_accent ml-1">
            Back to Home
          </a>
        </p>
      </div>
    </div>
  );
};

export default ProfileEditForm;