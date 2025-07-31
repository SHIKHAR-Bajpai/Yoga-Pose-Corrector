import { useEffect, useState } from 'react';
import Loader from "@/components/ui/loader-one.jsx";
import { jwtDecode } from 'jwt-decode';
const API_URL = import.meta.env.VITE_API_URL;

function FavoritePoses() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name , setName] = useState('');
  
  const token = localStorage.getItem('authToken');

  const fetchFavorites = async () => {
    if (!token) return;

    try {
      const decoded_token = jwtDecode(token);
      const user_id = decoded_token.sub;
      const user_name = decoded_token.name;
      setName(user_name);

      const response = await fetch(`${API_URL}/api/favorites/${user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFavorites(data);
    } catch (err) {
      console.error('Error fetching favorite poses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/api/favorites/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(favorites.filter((pose) => pose.id !== id));
    } catch (err) {
      console.error('Failed to delete pose:', err);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  if (loading) return <div className="flex justify-center py-14 mt-24"><Loader /></div>;

  return (
    <div className="flex justify-center py-14 mt-24">
      <div className="w-2/3 rounded-lg bg-secondary_bg p-8 text-gray-100">
        <h2 className="text-center text-2xl font-semibold mb-6 ml-10"> {name ? `${name.charAt(0).toUpperCase() + name.slice(1)}'s Favorite Poses` : 'Favorite Poses'}
        </h2>
        {favorites.length === 0 ? (
          <p className="text-center">No favorite poses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              
              <thead className="bg-gray-900">
                <tr>
                  <th scope="col" className="px-16 py-3 text-left text-xl font-medium text-gray-300 uppercase tracking-wider">
                    Pose
                  </th>
                  <th scope="col" className="px-2 py-3 text-left text-xl font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>

              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {favorites.map((pose) => (
                  <tr key={pose.id}>
                    <td className="px-6 py-4 whitespace-">
                        <div className="flex items-center justify-start h-40 w-40">
                          <img className="h-32 w-32 rounded-xl object-cover object-bottom" src={pose.pose_image} alt={pose.pose_name} />
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xl text-gray-100 cursor-pointer" > {pose.pose_name} </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(pose.id)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default FavoritePoses;
