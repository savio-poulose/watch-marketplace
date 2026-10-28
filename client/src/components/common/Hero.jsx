import hero2 from "../../assets/images/hero5.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import toast from "react-hot-toast";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleHeroClick = () => {
    if (!user) {
      toast.error("Please log in to explore our collection");
      navigate("/user/login");
      return;
    }
    navigate("/user/collections");
  };

  return (
    <section
      onClick={handleHeroClick}
      className="relative w-full pt-1 cursor-pointer group"
      title={user ? "Explore Collections" : "Log in to explore collections"}
    >
      <img
        src={hero2}
        alt="Luxury watches"
        className="block h-auto w-full object-cover transition duration-300 group-hover:brightness-95"
      />
    </section>
  );
};

export default Hero;