import Typewriter from "typewriter-effect";

export default function Index() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="m-auto relative flex flex-col justify-center items-center w-full h-full">
        <div className="font-display flex flex-row text-[150px] absolute  bottom-4 left-6 align-bottom items-baseline">
          <h1 className="text-[150px] leading-[120px]">fether</h1>
          <p className="text-2xl">by floop</p>
        </div>
        <p className="font-sans text-2xl inline-block">
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
              pauseFor: 5000,
            }}
          />{" "}
        </p>

        {/* <div className="flex flex-row absolute bottom-4 right-6 border text-2xl">
          <a href="" className="">
            contact
          </a>
          <a href="" className="">
            docs
          </a>
        </div> */}
      </div>
    </div>
  );
}
