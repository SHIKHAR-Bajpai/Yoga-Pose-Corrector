import procsesimage from "../assets/images/yoga-process.png"; 

function OurProcess() {
  return (
    <div className="flex items-center justify-around py-16 px-16 bg-secondary_bg">
      
      <div className="w-1/2">
        <img src={procsesimage} alt="Our Process" className="w-3/4 mx-auto" />
      </div>

      <div className="w-1/2 font-sans pb-12 pr-12 text-justify">
        <h2 className="text-4xl font-bold mb-6 text-main_heading font-mono"><span className="border-b-4 border-orange-400">Our P</span>rocess</h2>
        <p className="text-lg text-main_text">
          To begin, we needed to create a system that could fetch feed from the camera.
        </p>
        <p className="text-lg text-main_text mt-4">
          After appropriate Research and Development, we opted for the OpenCV MediaPipe algorithm to analyze human
          poses and detect key points in real-time.
        </p>
        <p className="text-lg text-main_text mt-4">
          Additionally, the detection system is aligned with the task of recognizing the subscriber through image
          analysis to enable access to the web application.
        </p>
        <p className="text-lg text-main_text mt-4">
          Lastly, we custom-trained our model with Convolutional Neural Networks (CNN) and Long Short-Term Memory (LSTM)
          networks to classify Yoga Poses accurately.
        </p>
      </div>
      
    </div>
  );
}

export default OurProcess;
