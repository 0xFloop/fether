export const Footer = () => {
  return (
    <footer className="h-40 border-t border-off-white grid grid-cols-2">
      <div className="flex items-center">
        <img src="images/fetherOrangeLogo.svg" alt="fether orange logo" className="ml-6" />
        <div className="ml-10">
          <h1 className="text-off-white/50 text-4xl">Questions?</h1>
          <h1 className="text-white text-3xl mt-1">
            Visit the{" "}
            <a href="https://docs.fether.xyz" target="_blank" className="underline">
              docs
            </a>
          </h1>
        </div>
      </div>
      <div className="text-white flex justify-center gap-20">
        <div className="flex flex-col justify-center">
          <a href="">Terms of service</a>
          <a href="">Privacy policy</a>
          <p className="mt-9">All Rights Reserved 2023</p>
        </div>
        <div className="flex flex-col justify-center">
          <p>
            Made with <span className="text-secondary-orange font-sans">{"<3"}</span>
          </p>
          <p>from New York, NY</p>
          <p className="mt-9">Code by Floop</p>
        </div>
      </div>
    </footer>
  );
};
