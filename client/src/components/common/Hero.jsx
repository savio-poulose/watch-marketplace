import hero2 from "../../assets/images/hero5.png";

const Hero = () => {
  return (
    <section className="w-full pt-1">
      <img
        src={hero2}
        alt="Luxury watches"
        className="block h-auto w-full object-cover"
      />
    </section>
  );
};

export default Hero;