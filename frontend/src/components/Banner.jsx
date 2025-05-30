import banner from '../assets/images/banner.jpg';

const Banner = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden b">
      <img
        src={banner}
        alt="Banner"
        className="w-full h-3/4 object-cover"
      />
      <div className="absolute top-1/3 left-[20%] transform -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-md font-serif">
        <h1 className="felx justify-start text-4xl font-bold mb-4">YOGA</h1>
        <p className="text-xl text-justify max-w-md mx-auto ">
          Yoga is the science of activating your inner energies to such a vibrant and exuberant state that your body,
          mind, and emotions function at their highest peaks  
          <br /> <span className='flex justify-end'> – Sadhguru </span>
        </p>
      </div>
    </div>
  );
};

export default Banner;
