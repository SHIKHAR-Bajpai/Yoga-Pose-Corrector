import { useState , useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '@/components/ui/loader-one.jsx';

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const registrationData = { name, email, password };

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Could not connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const backendUrl = `http://localhost:5000/register/${provider}`;
    window.location.href = backendUrl;
  };

   useEffect(() => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('authToken');
      const errorParam = url.searchParams.get('error');
  
      if (token) {
        localStorage.setItem('authToken', token);
        window.location.href = '/'; 
      }
  
      if (errorParam) {
        setError(`Social login error: ${errorParam}`);
        setIsLoading(false);
        }
    }, []);

  return (
    <div className="flex justify-center py-12 mt-16">
      <div className="w-1/3 rounded-lg bg-secondary_bg p-8 text-gray-100">
        <p className="text-center text-3xl font-bold">Register</p>

        {error && (
          <div className="mt-4 text-red-400 text-sm text-center">{error}</div>
        )}

        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="mt-4">
            <label htmlFor="name" className="block text-gray-400 mb-1"> Full Name </label>
            <input type="text" name="name" id="name" required value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading}
              className="w-full rounded-md border border-gray-700 outline-none bg-gray-900 py-3 px-4 text-gray-100 focus:border-primary_accent disabled:opacity-50"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="email" className="block text-gray-400 mb-1"> Email </label>
            <input type="email" name="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
              className="w-full rounded-md border border-gray-700 outline-none bg-gray-900 py-3 px-4 text-gray-100 focus:border-primary_accent disabled:opacity-50"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="password" className="block text-gray-400 mb-1">Password</label>
            <input type={showPassword ? "text" : "password"} name="password" id="password" placeholder="Password" required value={password}
              onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
              className="w-full rounded-md border border-gray-700 outline-none bg-gray-900 py-3 px-4 text-gray-100 focus:border-primary_accent disabled:opacity-50"
            />
            <div className="flex items-center mt-2">
            <input type="checkbox" id="showPassword" checked={showPassword} onChange={() => setShowPassword((prev) => !prev)}
              className="mr-2 accent-primary_accent" />
            <label htmlFor="showPassword" className="text-sm text-gray-400 select-none"> Show password </label>
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="mt-6 block w-full p-3 text-center font-mono border border-primary_accent font-semibold hover:bg-primary_accent hover:text-secondary_bg disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader className="mx-auto h-5 w-5" /> : 'Sign up'}
          </button>

        </form>

        <div className="flex items-center pt-4">
          <div className="h-px flex-1 bg-gray-700" />
          <p className="px-3 text-sm text-gray-400">Sign up with social accounts</p>
          <div className="h-px flex-1 bg-gray-700" />
        </div>

        <div className="flex justify-center space-x-2 mt-4">
          <button aria-label="Sign up with Google" className="rounded-sm p-3 border-none bg-transparent text-gray-100" onClick={() => handleSocialLogin('google')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 fill-current">
              <path d="M16.318 13.714v5.484h9.078c-0.37 2.354-2.745 6.901-9.078 6.901-5.458 0-9.917-4.521-9.917-10.099s4.458-10.099 9.917-10.099c3.109 0 5.193 1.318 6.38 2.464l4.339-4.182c-2.786-2.599-6.396-4.182-10.719-4.182-8.844 0-16 7.151-16 16s7.156 16 16 16c9.234 0 15.365-6.49 15.365-15.635 0-1.052-0.115-1.854-0.255-2.651z" />
            </svg>
          </button>
          <button aria-label="Sign up with GitHub" className="rounded-sm p-3 border-none bg-transparent text-gray-100" onClick={() => handleSocialLogin('github')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 fill-current">
              <path d="M16 0.396c-8.839 0-16 7.167-16 16 0 7.073 4.584 13.068 10.937 15.183 0.803 0.151 1.093-0.344 1.093-0.772 0-0.38-0.009-1.385-0.015-2.719-4.453 0.964-5.391-2.151-5.391-2.151-0.729-1.844-1.781-2.339-1.781-2.339-1.448-0.989 0.115-0.968 0.115-0.968 1.604 0.109 2.448 1.645 2.448 1.645 1.427 2.448 3.744 1.74 4.661 1.328 0.14-1.031 0.557-1.74 1.011-2.135-3.552-0.401-7.287-1.776-7.287-7.907 0-1.751 0.62-3.177 1.645-4.297-0.177-0.401-0.719-2.031 0.141-4.235 0 0 1.339-0.427 4.4 1.641 1.281-0.355 2.641-0.532 4-0.541 1.36 0.009 2.719 0.187 4 0.541 3.043-2.068 4.381-1.641 4.381-1.641 0.859 2.204 0.317 3.833 0.161 4.235 1.015 1.12 1.635 2.547 1.635 4.297 0 6.145-3.74 7.5-7.296 7.891 0.556 0.479 1.077 1.464 1.077 2.959 0 2.14-0.020 3.864-0.020 4.385 0 0.416 0.28 0.916 1.104 0.755 6.4-2.093 10.979-8.093 10.979-15.156 0-8.833-7.161-16-16-16z" />
            </svg>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?
          <a rel="noopener noreferrer" href="/login"
            className="text-gray-100 text-sm hover:underline hover:decoration-primary_accent ml-1"
          >
            Sign in </a>
        </p>

      </div>
    </div>
  );
};

export default RegisterForm;