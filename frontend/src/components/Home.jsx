import { NavLink } from 'react-router-dom'; 
import mainImage from '../assets/images/yoga-main.png';
import Banner from './Banner';
import OurProcess from './OurProcess';
import Working from './Working';
import "../css/Navbar.css";

function MainContent() {
  return (
    <div className='min-h-full pt-32'>
      <div className="flex justify-center items-center min-h-full pb-14">
      <div className="flex w-full mx-12">

        <div className="flex flex-col justify-center items-end bg-pin-300 w-1/2 bg-gren-300 pl-24">
          
          <div className="text-5xl font-extrabold font-mono mt-20 text-main_heading">
            Elevate Your Practice with 
            <div className='my-2'>
              <img src="https://readme-typing-svg.demolab.com?font=Courier&weight=700&size=64&letterSpacing=3px&duration=4000&pause=1000&color=C5C6C7&vCenter=true&width=1202&height=70&lines=Intelligent+Pose+Precision!%F0%9F%A4%B8%F0%9F%8F%BB" alt="Typing SVG" />
            </div>
          </div>

          <p className="text-xl text-gray-500 mt-8 mx-auto text-center font-mono mb-2" >
            Unlock your full potential with personalized feedback <br />that guides your every move
          </p>
            <NavLink to="/video-feedback" className="font-mono font-semibold mx-auto mt-8 px-8 py-4 border-2 border-accent_border text-white bg-primary_bg">
            <div> Get Started </div>
            </NavLink>
        </div>

        {/* Image Section */}
        <div className="flex justify-start w-1/2 bg-ink-200 mt-20 pr-10">
          <img src={mainImage} alt="Yoga Pose" className="w-full h-full"/>
        </div>
      </div>
    </div>

      <Banner/>
      <OurProcess/>  
      <Working/>
    </div>
    
  );
}

export default MainContent;
