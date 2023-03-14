import Typewriter from "typewriter-effect";

export default function Index() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="m-auto relative flex flex-col justify-center items-center p-6 text-center w-full h-full">
        <div className="font-display flex flex-row text-[150px] absolute bottom-16 md:bottom-4 left-6 align-bottom items-baseline">
          <h1 className="text-[100px] leading-[80px] md:text-[150px] md:leading-[120px]">fether</h1>
          <p className="text-base md:text-2xl">by floop</p>
        </div>
        <p className="font-sans text-base md:text-2xl inline-block">
          <Typewriter
            options={{
              strings: [
                "Enabling frictionless smart contract <—> frontend relationships.",
                "Coming soon.",
              ],
              autoStart: true,
              delay: 40,
              loop: false,
              deleteSpeed: 10,
              pauseFor: 4000,
            }}
          />{" "}
        </p>
      </div>
    </div>
  );
}
