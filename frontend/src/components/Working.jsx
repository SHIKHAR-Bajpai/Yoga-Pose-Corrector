import working from '../assets/images/yoga-work.png';

const Working = () => {
  return (
    <div className='min-h-screen'>
      <div className="relative flex justify-end items-center min-h-screen bg-primary_bg overflow-hidden py-36">
          
        {/* Image */}
        <img src={working} alt="Working" className="w-[58%] h-full object-cover rounded-l-xl" />

        {/* Content */}
        <div className="pl-32 pr-12 absolute left-0 top-1/2 -translate-y-1/2 w-[50%] bg-orange-300 bg-opacity-90 text-justify py-8 rounded-r-xl shadow-2xl font-sans text-lg">
          
          <h2 className="text-4xl font-bold font-mono mb-8 text-gray-900">
            <span className="border-b-4 border-gray-900">How I</span>t Works
          </h2>

          <p className="text-gray-900 mt-4">
            Start by turning on the web application and give access to the camera. Then, the application will start capturing the feed.
          </p>
          <p className="text-gray-900 mt-4">
            Afterward, the current feed will get sent to the server where our AI model is deployed.
          </p>
          <p className="text-gray-900 mt-4">
            In return, the AI model is responsible for offering feed that gives the pose category and angle of every joint.
          </p>
          <p className="text-gray-900 mt-4">
            Here, it will assess all the angles of your joint, and another ML algorithm will classify whether the pose is correct or not. It will provide insights to ensure that the user can perform the activity accurately without injuries.
          </p>

        </div>
      </div>  
    </div>
  );
};

export default Working;
