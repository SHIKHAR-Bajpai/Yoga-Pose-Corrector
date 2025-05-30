import { useEffect, useState } from "react";
import working2 from "../assets/images/working-2.jpg"; 
import Loader from "@/components/ui/loader-one.jsx"; 
// import { useNavigate } from "react-router-dom";

const HIGH_ACCURACY_THRESHOLD = 80;
const TARGET_TIMER_SECONDS = 15;

const PoseChecker = () => {
  // const navigate = useNavigate()  
  // const token = localStorage.getItem("authToken");
  // if( !token ){
  //   navigate("/login")
  // }

  const [poseData, setPoseData] = useState({
    pose: "N/A",
    score: 0,
    feedback: "Please select a pose to start",
  });

  const [isStarted, setIsStarted] = useState(false);
  const [videoSrc, setVideoSrc] = useState("");
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const [availablePoses, setAvailablePoses] = useState([]);
  const [userSelectedPoseName, setUserSelectedPoseName] = useState(null);

  const [selectedPoseDetails, setSelectedPoseDetails] = useState({ imageUrl: null, youtubeUrl: null, });

  const [wellDoneTimer, setWellDoneTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showWellDonePopup, setShowWellDonePopup] = useState(false);

  // --- Fetch available poses on mounting ---
  useEffect(() => {
    fetch("http://localhost:5000/available_poses")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.poses && Array.isArray(data.poses)) {
          setAvailablePoses(data.poses);
        } else {
          console.error(
            "Failed to fetch available poses: Invalid data format",
            data
          );
          setAvailablePoses(["Error loading poses"]);
        }
      })
      .catch((error) => {
        console.error("Error fetching available poses:", error);
        setAvailablePoses(["Error loading poses"]);
      });
  }, []);

  // --- Fetch detailed pose information ---
  useEffect(() => {
  const fetchPoseDetails = async () => {
    if (userSelectedPoseName) {
      setSelectedPoseDetails({ imageUrl: null, youtubeUrl: null });
      try {
        const res = await fetch(`http://localhost:5000/poses/${userSelectedPoseName}`);
        if (!res.ok) {
          if (res.status === 404) {
            console.error(`Pose details not found for: ${userSelectedPoseName}`);
          } else {
            console.error(`HTTP error fetching pose details! status: ${res.status}`);
          }
          setSelectedPoseDetails({ imageUrl: null, youtubeUrl: null });
          return;
        }
        const data = await res.json();
        if (data) {
          setSelectedPoseDetails({
            imageUrl: data.pose_image,
            youtubeUrl: data.pose_link,
          });
        } else {
          setSelectedPoseDetails({ imageUrl: null, youtubeUrl: null });
        }
      } catch (error) {
        console.error("Error fetching pose details:", error);
        setSelectedPoseDetails({ imageUrl: null, youtubeUrl: null }); 
      }
    } else {
      setSelectedPoseDetails({ imageUrl: null, youtubeUrl: null });
    }
  };
  fetchPoseDetails();
}, [userSelectedPoseName]);


  // --- Fetch pose feedback when video is started ---
  useEffect(() => {
    let interval = null;
    const fetchFeedback = () => {
      fetch("http://localhost:5000/pose_feedback")
        .then((res) => {
          if (!res.ok) {
            if (res.status >= 400 || res.status === 0) { 
              console.error( `Backend error or network issue getting feedback. Status: ${res.status}` );
              if (interval) clearInterval(interval);
              interval = null;
              setIsStarted(false); 
              setVideoSrc(""); 
              setIsCameraLoading(false); 

              setIsTimerActive(false);
              setWellDoneTimer(0);
              setShowWellDonePopup(false);

              setPoseData((prev) => ({
                ...prev,
                feedback: "Connection lost. Please stop and try again.",
              }));
            }
            throw new Error(`HTTP error fetching feedback! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setPoseData(data); 
          if (isStarted) { 
            if (data.score >= HIGH_ACCURACY_THRESHOLD) {
              if (!isTimerActive) { 
                setIsTimerActive(true);
                setWellDoneTimer(0); 
              }
            } else {
              if (isTimerActive) { 
                setIsTimerActive(false);
                setWellDoneTimer(0); 
              }
            }
          } else { 
            if (isTimerActive) { 
              setIsTimerActive(false);
              setWellDoneTimer(0);
            }
          }
        })
        .catch((error) => { 
          console.error("Network error fetching pose feedback:", error);
          if (interval) clearInterval(interval);
          interval = null;
          setIsStarted(false);
          setVideoSrc("");
          setIsCameraLoading(false);

          setIsTimerActive(false);
          setWellDoneTimer(0);
          setShowWellDonePopup(false);

          setPoseData((prev) => ({
            ...prev,
            feedback: "Network Error. Please stop and try again.",
          }));
        });
    };

    if (isStarted) {
      fetchFeedback(); 
      interval = setInterval(fetchFeedback, 500); 
    } else {
      if (interval) clearInterval(interval); 
      interval = null;
    }

    return () => { 
      if (interval) clearInterval(interval);
    };
  }, [isStarted, isTimerActive]); 

  // --- Well Done Popup ---
  useEffect(() => {
    let timerInterval = null;
    if (isTimerActive) {
      timerInterval = setInterval(() => {
        setWellDoneTimer((prevTimer) => {
          const newTimer = prevTimer + 1;
          if (newTimer >= TARGET_TIMER_SECONDS) {
            clearInterval(timerInterval); 
            setIsTimerActive(false); 
            setShowWellDonePopup(true); 
            if (userSelectedPoseName) {
              logPractice(userSelectedPoseName); 
            } else {
              console.warn("Timer completed but no pose was selected for logging.");
            }
            return TARGET_TIMER_SECONDS; 
          }
          return newTimer; 
        });
      }, 1000); 
    } else {
      if (timerInterval) clearInterval(timerInterval); 
    }

    return () => { 
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isTimerActive, userSelectedPoseName]); 

  // --- Function to log practice ---
  const logPractice = async (poseName) => {
    if (!poseName) {
      console.error("Cannot log practice: no pose name provided.");
      return;
    }
    console.log(`Logging practice for pose: ${poseName}`);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error("No authentication token found. Cannot log practice.");
        return;
      }

      const response = await fetch("http://localhost:5000/log_practice", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ poses: [poseName] }), 
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to log practice:", data.message || response.statusText);
        return;
      }
      console.log("Practice logged successfully:", data.message);
    } catch (error) {
      console.error("Network error during log practice:", error);
    }
  };


  const handleDropdownChange = (event) => {
    const poseName = event.target.value;
    if (poseName === "") { 
      setUserSelectedPoseName(null);
      setIsTimerActive(false);
      setWellDoneTimer(0);
      setShowWellDonePopup(false);
      setPoseData({
        pose: "N/A",
        score: 0,
        feedback: "Please select a pose to start",
      });
      return;
    }
    selectPose(poseName); 
  };

  const selectPose = (poseName) => {
    if (!availablePoses.includes(poseName)) {
      console.warn(`Attempted to select invalid pose from list: ${poseName}`);
      alert(`Internal Error: The selected pose "${poseName}" is not in the available list.`);
      return;
    }

    setIsTimerActive(false);
    setWellDoneTimer(0);
    setShowWellDonePopup(false);

    setUserSelectedPoseName(poseName);
    if (isStarted) {
      fetch("http://localhost:5000/stop_camera")
        .then(() => {
          setVideoSrc("");
          setIsStarted(false);
          setIsCameraLoading(false);
          console.log("Video stopped before selecting new pose.");
          sendPoseSelectionRequestToBackend(poseName); 
        })
        .catch((error) => {
          console.error("Error stopping camera before selecting new pose:", error);
          alert("Could not stop the current video feed gracefully. Please try stopping manually first.");
          setVideoSrc("");
          setIsStarted(false);
          setIsCameraLoading(false);
          sendPoseSelectionRequestToBackend(poseName);
        });
    } else {
      sendPoseSelectionRequestToBackend(poseName); 
    }
  };

  // --- Function to send the selected pose to the backend ---
  const sendPoseSelectionRequestToBackend = (poseName) => {
    setPoseData({
      pose: poseName, 
      score: 0,      
      feedback: `Preparing for "${poseName}"...`,
    });

    fetch("http://localhost:5000/select_pose", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pose_name: poseName }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error selecting pose on backend! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Backend response to pose selection:", data);
        if (data.status === "success") {
          setPoseData((prev) => ({
            ...prev, 
            feedback: `Selected: ${poseName}. Ready to start check.`,
          }));
        } else {
          console.error("Backend reported an error selecting pose:", data.message);
          setPoseData({ 
            pose: "N/A",
            score: 0,
            feedback: `Error selecting pose: ${data.message || "Unknown error"}`,
          });
          alert(`Failed to select pose on backend: ${data.message || "Unknown error"}`);
        }
      })
      .catch((error) => {
        console.error("Network error sending pose selection to backend:", error);
        setPoseData({ 
          pose: "N/A",
          score: 0,
          feedback: "Network error selecting pose. Please try again.",
        });
        alert(`Network error selecting pose: ${error.message}`);
      });
  };


  // Start/stop button for video feed
  const toggleVideo = () => {
    if (!isStarted) { // 
      if (userSelectedPoseName === null) {
        alert("Please select a pose from the dropdown first!");
        return;
      }
      setIsCameraLoading(true); 
      setVideoSrc("http://localhost:5000/video_feed"); 
      setIsStarted(true); 
      setPoseData((prev) => ({
        ...prev,
        feedback: `Starting video, attempting to detect ${userSelectedPoseName}...`,
      }));
      
      setIsTimerActive(false);
      setWellDoneTimer(0);
      setShowWellDonePopup(false);

  
      setTimeout(() => {
        setIsCameraLoading(false); 
      }, 1500); 

    } else { 
      fetch("http://localhost:5000/stop_camera")
        .then(() => {
          setVideoSrc("");
          setIsStarted(false);
          setIsCameraLoading(false); 
          setIsTimerActive(false);
          setWellDoneTimer(0);
          setShowWellDonePopup(false);
          setPoseData({
            pose: userSelectedPoseName || "N/A",
            score: 0,
            feedback: "Video feed stopped.",
          });
          window.location.reload();
        })
        .catch((error) => {
          console.error("Error stopping camera:", error);
          setPoseData((prev) => ({
            ...prev,
            feedback: `Error stopping video: ${error.message}. Try refreshing.`,
          }));
          setVideoSrc("");
          setIsStarted(false);
          setIsCameraLoading(false);
          setIsTimerActive(false);
          setWellDoneTimer(0);
          setShowWellDonePopup(false);
          window.location.reload();
        });
    }
  };


  const handleClosePopup = () => {
    setShowWellDonePopup(false);
  };


  const borderColor =
    poseData.score > 90
      ? "border-green-500" 
      : poseData.score >= 60
        ? "border-yellow-500" 
        : "border-blue-500"; 

  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      let videoId = null;

      if (urlObj.hostname === "www.youtube.com" || urlObj.hostname === "youtube.com") {
        if (urlObj.pathname === "/watch") {
          videoId = urlObj.searchParams.get("v");
        } else if (urlObj.pathname.startsWith("/embed/")) {
          const pathParts = urlObj.pathname.split('/');
          videoId = pathParts[pathParts.length - 1];
        }
      } else if (urlObj.hostname === "youtu.be") { 
        videoId = urlObj.pathname.substring(1);
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (e) {
      console.error("Invalid YouTube URL provided:", url, e);
      return null; 
    }
  };

  const embedYouTubeUrl = getEmbedUrl(selectedPoseDetails.youtubeUrl);

  const formatPoseNameForDisplay = (name) => {
    if (!name || name === "N/A") return "N/A";
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };


  return (
    <div className="h-screen relative flex bg-primary_bg text-white overflow-hidden pt-28 font-mono">

      {/* --- Well Done Popup --- */}
      {showWellDonePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-4xl font-bold text-green-500 mb-4 animate-pulse">🎉 Well Done! 🎉</h2>
            <p className="text-xl text-gray-300">
              You held {formatPoseNameForDisplay(userSelectedPoseName)}  with high accuracy for {TARGET_TIMER_SECONDS} seconds!
            </p>
            <button
              onClick={handleClosePopup}
              className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors"
            >
              Great!
            </button>
          </div>
        </div>
      )}


      {/* --- Left Panel for Pose Selection & Feedback --- */}
      <div className="w-1/5 overflow-y-auto min-h-full">
        <div className="border-e border-t border-b border-accent_border mb-2 overflow-hidden px-4 py-3">
          <h2 className="border-b border-accent_border text-2xl font-bold text-center py-2 mb-3">
            Select a Pose
          </h2>
          {availablePoses.length > 0 && availablePoses[0] !== "Error loading poses" ? (
            <select
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-gray-300 border border-accent_border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              onChange={handleDropdownChange}
              value={userSelectedPoseName || ""} 
              disabled={isStarted} 
            >
              <option value="" disabled>
                -- Select a Pose --
              </option>
              {availablePoses.map((poseName) => (
                <option key={poseName} value={poseName}>
                  {formatPoseNameForDisplay(poseName)}
                </option>
              ))}
            </select>
          ) : availablePoses[0] === "Error loading poses" ? (
            <p className="text-center text-red-400 py-4">
              Error loading poses. Check connection.
            </p>
          ) : (
            <p className="text-center text-gray-500 py-4">Loading poses...</p>
          )}
        </div>

        {/* --- Feedback Section --- */}
        <div className="border-r border-t border-b py-6 px-4 border-accent_border font-mono">
          <p className="text-2xl text-gray-400 font-semibold">
            Pose:{" "}
            <span className="text-white font-semibold">
              {formatPoseNameForDisplay(poseData.pose)}
            </span>
          </p>
          <p className="text-2xl text-gray-400 mt-6 font-semibold">
            Accuracy:{" "}
            <span className="text-white font-semibold">{poseData.score}%</span>
          </p>
          {isTimerActive && (
            <p className="text-2xl text-yellow-400 mt-6 font-semibold">
              Holding Pose: <span className="text-white">{wellDoneTimer}s / {TARGET_TIMER_SECONDS}s</span>
            </p>
          )}
          <p
            className={`text-xl mt-6 font-semibold ${ 
              poseData.score > 90
                ? "text-green-400"
                : poseData.score >= 60
                  ? "text-yellow-400"
                  : "text-red-400"
            }`}
          >
            {poseData.feedback.charAt(0).toUpperCase() + poseData.feedback.slice(1)}
          </p>

          {/* --- Start/Stop Check Button --- */}
          {userSelectedPoseName !== null && !isStarted && (
            <button
              onClick={toggleVideo}
              className="flex mx-auto mt-8 px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 transition-all text-white font-bold text-lg shadow-md"
            >
              Start Check
            </button>
          )}
          {isStarted && (
            <button
              onClick={toggleVideo}
              className="flex mx-auto mt-8 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 transition-all text-white font-bold text-lg shadow-md"
            >
              Stop Check
            </button>
          )}
          {userSelectedPoseName === null && !isStarted && ( 
            <button
              className="flex mx-auto mt-8 px-6 py-3 rounded-full bg-gray-600 text-gray-400 font-bold text-lg cursor-not-allowed shadow-md"
              disabled
            >
              Select Pose First
            </button>
          )}
        </div>
      </div>

      {/* --- Center Panel for Video Feed --- */}
      <div className="flex-1 flex flex-col items-center justify-center mb-10 p-4 md:p-8">
        <div
          className={`relative flex justify-center items-center border-2 rounded-xl ${borderColor} w-full max-w-4xl aspect-[16/10] bg-black`} // Added aspect ratio and max-width for video container
        >
          {videoSrc ? (
            <img
              id="video-feed"
              src={videoSrc}
              alt="Live Pose Video Feed"
              className="w-full h-full rounded-lg object-contain"
              style={{ display: isCameraLoading ? 'none' : 'block' }}
              onLoad={() => setIsCameraLoading(false)} 
              onError={() => {
                setIsCameraLoading(false);
                console.error("Video stream failed to load.");
                setPoseData((prev) => ({ ...prev, feedback: "Video stream error. Try stopping." }));
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
              Video Feed Paused or Not Started
            </div>
          )}
          {isCameraLoading && videoSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-xl z-10">
              <Loader />
              <p className="ml-2 text-lg">Starting camera...</p>
            </div>
          )}
        </div>
      </div>

      {/* --- Right Panel for reference Image and YouTube Video --- */}
      <div className="w-1/5 overflow-y-auto min-h-full">
        <div className="border border-r-0 border-t border-accent_border text-xl font-bold text-center py-3">
          <h2 className="border-b border-accent_border text-xl font-bold text-center py-2 mb-2">
            Reference Image
          </h2>
          <div className="px-3 space-y-3">
            {!userSelectedPoseName && ( 
              <>
                <p className="text-sm text-gray-400 py-2">Select a pose to see its reference.</p>
                <img src={working2} alt="Default reference placeholder" className="rounded-lg object-cover w-full max-h-48" />
              </>
            )}
            {userSelectedPoseName && selectedPoseDetails.imageUrl && ( 
              <img
                src={selectedPoseDetails.imageUrl}
                alt={`Reference for ${formatPoseNameForDisplay(userSelectedPoseName)}`}
                className="rounded-lg object-contain w-full max-h-60 mb-2 bg-gray-800 p-1" 
                onError={(e) => {
                  e.target.style.display = 'none'; 
                  const parent = e.target.parentNode;
                  if (parent && !parent.querySelector('.img-error-msg')) {
                    const errorMsg = document.createElement('p');
                    errorMsg.textContent = "Reference image failed to load.";
                    errorMsg.className = 'text-sm text-yellow-400 py-2 img-error-msg';
                    parent.appendChild(errorMsg);
                  }
                }}
              />
            )}
            {userSelectedPoseName && !selectedPoseDetails.imageUrl && ( 
              <p className="text-sm text-gray-400 py-2">
                No reference image available for {formatPoseNameForDisplay(userSelectedPoseName)}.
              </p>
            )}
          </div>
        </div>

        <div className="border border-r-0 border-t border-accent_border mt-2">
          <h2 className="border-b border-accent_border text-xl font-bold text-center py-1">
            Watch Tutorial
          </h2>
          <div className="p-3">
            {!userSelectedPoseName && (
              <p className="text-sm text-gray-400 text-center py-2">Select a pose to see tutorial.</p>
            )}
            {userSelectedPoseName && embedYouTubeUrl && (
              <div className="aspect-w-16 aspect-h-9"> 
                <iframe
                  className="w-full h-full rounded-md"
                  src={embedYouTubeUrl}
                  title={`YouTube video player for ${formatPoseNameForDisplay(userSelectedPoseName)}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            {userSelectedPoseName && selectedPoseDetails.youtubeUrl && !embedYouTubeUrl && ( 
              <p className="text-sm text-yellow-400 text-center py-2">
                Could not embed YouTube video. <br />
                <a href={selectedPoseDetails.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                  Watch on YouTube
                </a>
              </p>
            )}
            {userSelectedPoseName && !selectedPoseDetails.youtubeUrl && ( 
              <p className="text-sm text-gray-400 text-center py-2">
                No YouTube tutorial available for {formatPoseNameForDisplay(userSelectedPoseName)}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoseChecker;

