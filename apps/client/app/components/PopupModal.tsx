import { Link } from "@remix-run/react";
import { X } from "lucide-react";
import { ReactNode, MouseEvent } from "react";

type PopupModalProps = {
  children: ReactNode;
  display: boolean;
  displaySetter: (display: boolean) => void;
};
export const PopupModal = ({ children, display, displaySetter }: PopupModalProps) => {
  return (
    <>
      {display ? (
        <div className="fixed top-0 left-0 z-50 flex items-center justify-center h-screen w-screen bg-black/75">
          <span
            className="absolute top-0 left-0 h-screen w-screen"
            onClick={() => displaySetter(!display)}
          ></span>
          <div className="border z-60 relative border-off-white flex flex-col px-16 rounded-xl bg-dark-gray">
            <span className="absolute w-full top-0 left-0 h-16 border-b border-b-off-white"></span>
            <div className="h-16 w-full flex items-center py-4 justify-center">
              <img src="/images/fetherLogoWhite.svg" className="h-9" />
              <h2 className="text-xs ml-2">
                BETA VERSION <span className="text-secondary-orange">0.0.03</span>
              </h2>
              <button className="absolute right-4" onClick={() => displaySetter(!display)}>
                <X />
              </button>
            </div>
            <div className="p-4">{children}</div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};
