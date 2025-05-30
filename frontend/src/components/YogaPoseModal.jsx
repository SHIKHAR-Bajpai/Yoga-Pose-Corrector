import { useState, useEffect, useRef } from "react";
import Loader from "@/components/ui/loader-one.jsx";

function PoseModal({ pose, onClose, userId }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null); 

  const modalRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    setSaved(false);
    setFavoriteId(null);
    if (!pose || !userId) return;

    const checkIfSaved = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/favorites/${userId}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        if (response.ok) {
          const favorites = await response.json();
          const existing = favorites.find(
            fav => fav.pose_name === (pose.display_name || pose.name)
          );
          if (existing) {
            setSaved(true);
            setFavoriteId(existing.id);
          }
        }
      } catch (err) {
        console.error("Error checking saved pose:", err);
      }
    };

    checkIfSaved();
  }, [pose, userId]);

  if (!pose) return null;

  const {
    src,
    name,
    display_name,
    sanskrit_names = [],
    category,
    difficulty,
    description,
    benefits
  } = pose;

  const primarySanskrit = sanskrit_names[0] || {};

  const handleSave = async () => {
    if (!pose) return;
    try {
      setIsSaving(true);
      const response = await fetch("http://localhost:5000/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ userId, pose }),
      });

      if (!response.ok) {
        throw new Error("Failed to save pose");
      }

      const resData = await response.json();
      setSaved(true);

      const updatedFavorites = await fetch(`http://localhost:5000/api/favorites/${userId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const favList = await updatedFavorites.json();
      const savedPose = favList.find(fav => fav.pose_name === (display_name || name));
      if (savedPose) {
        setFavoriteId(savedPose.id);
      }
    } catch (err) {
      console.error("Failed to save pose:", err);
      alert("Error saving pose.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!favoriteId) return;
    try {
      setIsRemoving(true);
      const response = await fetch(`http://localhost:5000/api/favorites/${favoriteId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete pose");
      }

      setSaved(false);
      setFavoriteId(null);
    } catch (err) {
      console.error("Failed to remove pose:", err);
      alert("Error removing pose.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-4xl w-full relative flex flex-col md:flex-row gap-6"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl font-bold"
        >
          ×
        </button>

        <div className="w-full md:w-1/2 flex items-center justify-center">
          <img
            src={src}
            alt={name}
            className="object-contain max-h-[400px] rounded-lg"
          />
        </div>

        <div className="w-full md:w-1/2 space-y-3 relative pb-14">
          <h2 className="text-2xl font-bold text-primary_bg">{display_name || name}</h2>
          {primarySanskrit.simplified && (
            <p className="text-secondary_bg text-sm font-semibold">
              Sanskrit Name:&nbsp;
              {primarySanskrit.simplified.charAt(0).toUpperCase() + primarySanskrit.simplified.slice(1)}&nbsp;
              ({primarySanskrit.devanagari && ` ${primarySanskrit.devanagari}`})
            </p>
          )}
          {category && (
            <p className="text-sm text-gray-600">Category: <span className="font-medium">{category.charAt(0).toUpperCase() + category.slice(1)}</span></p>
          )}
          {difficulty && (
            <p className="text-sm text-gray-600">Difficulty: <span className="font-medium">{difficulty}</span></p>
          )}
          {description && (
            <div>
              <p className="text-sm font-semibold mt-4 text-gray-600">Description:</p>
              <p className="text-sm text-gray-700">{description}</p>
            </div>
          )}
          {benefits && (
            <div>
              <p className="text-sm font-semibold mt-4 text-gray-600">Benefits:</p>
              <p className="text-sm text-gray-700">{benefits}</p>
            </div>
          )}

          <div className="absolute bottom-0 right-0">
            {!userId ? (
              <div className="text-red-500 text-sm font-semibold p-2">
                Please login first to save as favorite
              </div>
            ) : saved ? (
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="px-4 py-2 rounded border text-primary_bg border-primary_bg text-sm font-semibold hover:bg-primary_bg hover:text-white"
              >
                {isRemoving ? (
                  <span className="flex items-center gap-2">
                    Removing <Loader className="h-4 w-4 animate-spin" />
                  </span>
                ) : (
                  "Remove from Favorites ❌"
                )}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded text-primary_bg text-sm font-semibold border border-primary_bg hover:bg-primary_bg hover:text-white"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    Saving <Loader className="h-4 w-4 animate-spin" />
                  </span>
                ) : (
                  "❤️ Save to Favorites"
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default PoseModal;
