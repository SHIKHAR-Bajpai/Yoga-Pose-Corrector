function VideoInput() {
  return (
    <div className="flex justify-center items-center h-96 border-2 border-dashed border-gray-400 rounded-lg bg-white">
      <input type="file" accept="video/*" className="opacity-0 absolute w-full h-full" />
      <div className="text-gray-500 flex flex-col items-center">
        <p className="text-lg mb-4">Upload a video for pose checking</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Choose Video
        </button>
      </div>
    </div>
  );
}

export default VideoInput;
