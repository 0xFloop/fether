export const BackgroundLines: React.FC = () => {
  return (
    <div className="absolute -z-10 left-0 top-0 h-full w-full flex justify-center items-center">
      <div className=" h-full w-[95%] grid grid-cols-5">
        <div className="border-x border-x-off-white/25 h-full"></div>
        <div className="border-r border-r-off-white/25 h-full"></div>
        <div className="border-r border-r-off-white/25 h-full"></div>
        <div className="border-r border-r-off-white/25 h-full"></div>
        <div className="border-r border-r-off-white/25 h-full"></div>
      </div>
    </div>
  );
};
