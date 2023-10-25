export const Footer = () => {
  return (
    <footer className="py-6 px-4 md:px-20 w-screen border-t border-off-white flex flex-col md:flex-row bg-[url('/images/staticGrainSmallerest.png')]">
      <div className="flex flex-1 items-center">
        <img
          src="/images/fetherOrangeLogo.svg"
          alt="fether orange logo"
          className="ml-2 lg:ml-6 h-16 lg:h-24"
        />
        <div className="ml-4 md:ml-10">
          <h1 className="text-off-white/50 text-2xl lg:text-4xl">Questions?</h1>
          <h1 className="text-white text-xl lg:text-3xl mt-1">
            Visit the{" "}
            <a href="https://docs.fether.xyz" target="_blank" className="underline">
              docs
            </a>
          </h1>
        </div>
      </div>
      <div className="text-white flex flex-1 text-xs lg:text-sm justify-evenly md:justify-center md:gap-20 w-full mt-10 md:mt-0">
        <div className="flex flex-col justify-center">
          <a href="">Terms of service</a>
          <a href="">Privacy policy</a>
          <p className="mt-4 md:mt-9">All Rights Reserved '23</p>
        </div>
        <div className="flex flex-col justify-center">
          <p>
            Made with <span className="text-secondary-orange font-sans">{"<3"}</span>
          </p>
          <p>from New York, NY</p>
          <p className="mt-4 md:mt-9">Code by Floop</p>
        </div>
      </div>
    </footer>
  );
};
