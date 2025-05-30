import { FaFacebookF, FaTwitter, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import MapPin from "../assets/images/ri-map-pin-line-icon.svg"
import Phone from "../assets/images/ph-phone-icon.svg"
import Mail from "../assets/images/mdi-email-outline-icon.svg"

function Footer() {
  return (
    <footer className="bg-secondary_bg text-seconday_text pt-10 pb-6 px-32"> 
    {/* bg-secondary_bg text-seconday_text pt-10 pb-6 px-32"> */}
      <div className="flex flex-col md:flex-row justify-between font-mono">
        {/* Company Info */}
        <div className="">
            <h1 className="text-white text-2xl font-semibold mb-4">YogAI</h1>
            <p className="text-main_text max-w-xs font-thin leading-relaxed">
                Harness the power of AI to perfect your yoga practice. YogAI offers real-time pose correction and personalized guidance rooted in ancient Indian wisdom and modern technology.
            </p>
            <p className="text-main_text text-xl mt-4 font-semibold">🇮🇳 India • Est. 2025</p>
        </div>

        {/* Solutions */}
        <div className="">
            <h2 className="text-white text-2xl font-semibold mb-4">Quick Links</h2>
            <ul className="space-y-2 text-main_text">
                <li><a href="/" className="hover:text-secondary_accent">Home</a></li>
                <li><a href="/yoga-info" className="hover:text-secondary_accent">Yoga</a></li>
                <li><a href="/video-feedback" className="hover:text-secondary_accent">AlignNow</a></li>
                <li><a href="/learn-yoga" className="hover:text-secondary_accent">Poses</a></li>
                <li><a href="/assistance" className="hover:text-secondary_accent">Coach</a></li>
                <li>About Us</li>
            </ul>
        </div>

        {/* Contact */}
        <div className="flex flex-col">
            <h2 className="text-white text-2xl font-semibold mb-4">Contact</h2>
            <div className='flex flex-col gap-4 ml-1 text-main_text'>
               <div>
                <p className='flex gap-1 text-gray-50 font-semibold '> <img src={MapPin}  style={{ filter: 'invert(100%)' }} width={20} /> Address : </p>
                <p className='font-thin'>24, Karamchari Nagar, Block B, 4th Floor, <br />Bareilly, Bareilly, 243001, India</p>
               </div>

               <div>
                <p className='flex gap-1 text-gray-50 font-semibold'>
                    <img src={Mail}  style={{ filter: 'invert(100%)' }} width={20} />
                    Email:  <a href="#" className='font-thin text-main_text ml-1 hover:text-accent_border'> yogai@gmail.com </a>
                </p>
               </div>

               <div>
                <p className='flex gap-1 text-gray-50 font-semibold'>
                    <img src={Phone}  style={{ filter: 'invert(100%)' }} width={20} /> Phone: <span className='font-thin text-main_text ml-1'> +91 234 567 890</span>
                </p>
               </div>
            </div>
        </div>

        {/* Social Media */}
        <div className="flex flex-col">
            <h2 className="text-white text-2xl font-semibold mb-4">Socials</h2>
            <div className='flex gap-4'>
                <a href="#" className="text-seconday_text hover:text-primary_accent"><FaFacebookF size={24} /></a>
                <a href="#" className="text-seconday_text hover:text-primary_accent"><FaTwitter size={24} /></a>
                <a href="#" className="text-seconday_text hover:text-primary_accent"><FaLinkedinIn size={24} /></a>
                <a href="#" className="text-seconday_text hover:text-primary_accent"><FaYoutube size={24} /></a>
            </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="text-center text-xs text-main_text pt-8">
        MADE WITH ❤️ BY GROUP 12 &nbsp; | &nbsp; © 2025 SRMS FINAL YEAR PROJECT &nbsp; | &nbsp; ALL RIGHTS RESERVED
      </div>
    </footer>
  );
}

export default Footer