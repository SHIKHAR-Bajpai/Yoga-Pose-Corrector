import { useState } from "react";
import yogaPosesData from '../assets/poses_cleaned.json';
import YogaPoseModal from "./YogaPoseModal";
import { jwtDecode } from "jwt-decode";

function MainContent() {
  const token = localStorage.getItem("authToken");

  let userId = null;
  try {
    if (token) {
      const decoded_token = jwtDecode(token);
      userId = decoded_token.sub;
    }
  } catch (error) {
    console.error("Invalid token:", error);
    userId = null;
  }

  const [allYogaPoses] = useState(yogaPosesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPose, setSelectedPose] = useState(null);

  const handlePoseClick = (pose) => {
      setSelectedPose(pose);
  };

  const handleModalClose = () => setSelectedPose(null);

  const posesPerPage = 12;
  const totalDisplayLimit = 120;

  const topPosesNames = [
    'Tree', 'Chair', 'WarriorIII', 'WarriorII', 'Plank', 'Butterfly', 'Cobra',
    'Downward-Facing Dog', 'Goddess', 'Hero', 'King Dancer', 'Mountain', 'Sitting', 'Boat'
  ];

  const topPoses = allYogaPoses.filter(pose => topPosesNames.includes(pose.name));
  const remainingPoses = allYogaPoses.filter(pose => !topPosesNames.includes(pose.name));

  const orderedTopPoses = topPosesNames.map(name =>
    topPoses.find(pose => pose.name === name)
  ).filter(Boolean);

  const combinedPosesUnfiltered = [...orderedTopPoses, ...remainingPoses].slice(0, totalDisplayLimit);

  const filteredPoses = combinedPosesUnfiltered
    .filter(pose =>
      pose.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pose.sanskrit_names &&
        pose.sanskrit_names.some(sn =>
          sn.simplified.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sn.latin.toLowerCase().includes(searchTerm.toLowerCase())
        ))
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      } else if (sortBy === 'difficulty') {
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        const difficultyA = a.difficulty ? difficultyOrder[a.difficulty] : Infinity;
        const difficultyB = b.difficulty ? difficultyOrder[b.difficulty] : Infinity;
        return difficultyA - difficultyB;
      }
      return 0;
    });

  const indexOfLastPose = currentPage * posesPerPage;
  const indexOfFirstPose = indexOfLastPose - posesPerPage;
  const currentPoses = filteredPoses.slice(indexOfFirstPose, indexOfLastPose);
  const totalPages = Math.ceil(filteredPoses.length / posesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className='pt-28 bg-primary_bg text-main_text'>
      <div className="w-full px-8 md:px-20 lg:px-32 py-4 sticky top-0 bg-primary_bg z-10 flex items-center space-x-6">
        <input
          type="text"
          placeholder="Search yoga poses..."
          className="w-full sm:w-1/2 px-4 py-2 rounded-md text-main_text bg-secondary_bg focus:outline-none focus:ring-2 focus:ring-accent_border"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex items-center">
          <label htmlFor="sortBy" className="mr-2 text-sm">Sort by:</label>
          <select
            id="sortBy"
            className="px-2 py-1 rounded-md text-main_text bg-secondary_bg focus:outline-none focus:ring-2 focus:ring-accent_border text-sm"
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>
      </div>

      <ul className="px-8 md:px-20 lg:px-32 py-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 list-none">
        {currentPoses.map((pose, index) => (
          <li
            key={index}
            className="rounded-md overflow-hidden shadow-md bg-white cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => handlePoseClick(pose)}
          >
            <div className="relative w-full aspect-square">
              <img
                src={pose.src}
                alt={pose.name}
                className="absolute inset-0 w-full h-full object-cover object-bottom"
              />
            </div>
            <div className="text-center pt-2 pb-2 px-2">
              <h3 className="text-sm font-semibold text-primary_bg">
                {pose.display_name || pose.name}
              </h3>
              {pose.sanskrit_names?.[0] && (
                <p className="text-sm font-thin text-secondary_bg">
                  {pose.sanskrit_names[0].simplified}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {selectedPose && (
        <YogaPoseModal pose={selectedPose} onClose={handleModalClose} userId={userId} />
      )}

      {totalPages > 1 && (
        <div className="px-8 md:px-20 lg:px-32 py-4 flex justify-center items-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`px-3 py-1 rounded-full text-primary_bg ${
                currentPage === number ? 'bg-primary_accent' : 'bg-secondary_bg text-white'
              } focus:outline-none`}
            >
              {number}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MainContent;
