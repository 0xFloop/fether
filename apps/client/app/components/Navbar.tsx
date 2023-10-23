import { Link } from "@remix-run/react";
import { useContext } from "react";
import { DisplayCodesContext } from "~/routes/alpha";

type NavbarProps = { hasAccess: boolean; displayInvites: boolean };

export const Navbar = (props: NavbarProps) => {
  const displayCodes = useContext(DisplayCodesContext);

  return (
    <div
      id="navbar"
      className="absolute w-full h-20 border-b text-white z-50 border-b-off-white/50 px-20 flex flex-row justify-between items-center font-primary"
    >
      <div className="flex flex-row h-full items-center">
        <Link to="/">
          <img src="/images/fetherLogoWhite.svg" className="h-1/2" />
        </Link>
        <p className="ml-2">
          BETA VERSION <span className="text-secondary-orange"> 0.0.03</span>
        </p>
      </div>
      <div className="flex gap-16 items-center float-right h-full">
        <a id="signout" href="/alpha/sign-out" className="px-8">
          SHARE
        </a>
        <div className="px-16 h-1/2 flex items-center text-secondary-orange border border-off-white/50 rounded-full">
          {props.hasAccess ? (
            <>
              {props.displayInvites ? (
                <button
                  onClick={() =>
                    displayCodes.setDisplayInviteCodes(!displayCodes.displayInviteCodes)
                  }
                >
                  INVITE
                </button>
              ) : (
                <Link to="/alpha">ACCESS</Link>
              )}
            </>
          ) : (
            <a href="https://twitter.com/messages/compose?recipient_id=1366965946548584448">
              GET ACCESS
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
