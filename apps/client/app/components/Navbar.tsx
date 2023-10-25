import { Link } from "@remix-run/react";
import { AlignJustify, MenuIcon, X } from "lucide-react";
import { useContext, useState } from "react";
import { DisplayCodesContext } from "~/routes/alpha";

type NavbarProps = { hasAccess: boolean; isSignedIn: boolean };

export const Navbar = (props: NavbarProps) => {
  const displayCodes = useContext(DisplayCodesContext);
  const [menuActive, setMenuActive] = useState(false);
  return (
    <div
      id="navbar"
      className="absolute w-screen h-20 border-b text-white z-50 border-b-off-white/25 px-4 md:px-20 flex flex-row justify-between items-center font-primary"
    >
      <div className="flex flex-row h-full items-center">
        <Link to="/">
          <img src="/images/fetherLogoWhite.svg" className="h-1/2" />
        </Link>
        <p className="ml-2">
          BETA VERSION <span className="text-secondary-orange"> 0.0.03</span>
        </p>
      </div>
      <div className="hidden lg:flex gap-16 items-center float-right h-full">
        <div className="text-sm flex gap-4">
          <a
            href="https://twitter.com/messages/compose?recipient_id=1366965946548584448"
            target="_blank"
          >
            SUPPORT
          </a>
          <a href="https://docs.fether.xyz" target="_blank">
            DOCS
          </a>
          {props.isSignedIn && (
            <button
              onClick={() => displayCodes.setDisplayInviteCodes(!displayCodes.displayInviteCodes)}
            >
              INVITE
            </button>
          )}
        </div>
        <div className="px-16 h-1/2 flex items-center text-secondary-orange border border-off-white rounded-full">
          {props.hasAccess || props.isSignedIn ? (
            <>
              {props.isSignedIn ? (
                <Link id="signout" to="/alpha/sign-out">
                  Sign Out
                </Link>
              ) : (
                <Link id="signin" to="/alpha/login">
                  Log In
                </Link>
              )}
            </>
          ) : (
            <a
              href="https://twitter.com/messages/compose?recipient_id=1366965946548584448"
              target="_blank"
            >
              GET ACCESS
            </a>
          )}
        </div>
      </div>
      <div className="lg:hidden relative">
        <button onClick={() => setMenuActive(!menuActive)}>
          {menuActive ? <X size={30} /> : <AlignJustify size={30} />}
        </button>
        {menuActive ? (
          <div className="flex flex-col absolute bg-black text-white px-8 py-16 right-0 rounded-lg">
            <ul>
              <li className=" border-b">
                <a
                  href="https://twitter.com/messages/compose?recipient_id=1366965946548584448"
                  target="_blank"
                >
                  Support
                </a>
              </li>
              <li className="border-b">
                <a href="https://docs.fether.xyz" target="_blank">
                  Documentation
                </a>
              </li>
              {props.isSignedIn && (
                <button
                  className="border-b w-full text-left"
                  onClick={() =>
                    displayCodes.setDisplayInviteCodes(!displayCodes.displayInviteCodes)
                  }
                >
                  Invite
                </button>
              )}
            </ul>
            {props.hasAccess || props.isSignedIn ? (
              <div className="border-b border-b-secondary-orange">
                {props.isSignedIn ? (
                  <Link id="signout" to="/alpha/sign-out">
                    Sign Out
                  </Link>
                ) : (
                  <Link id="signin" to="/alpha/login">
                    Log In
                  </Link>
                )}
              </div>
            ) : (
              <a
                href="https://twitter.com/messages/compose?recipient_id=1366965946548584448"
                target="_blank"
              >
                GET ACCESS
              </a>
            )}
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
