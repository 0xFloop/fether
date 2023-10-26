import { Copy, X } from "lucide-react";
import { DisplayCodesContextType, UserWithKeyRepoActivityTeam } from "~/types";

type InviteModalProps = {
  userData: UserWithKeyRepoActivityTeam;
  displayCodes: DisplayCodesContextType;
};

export const InviteFriendsModal = (props: InviteModalProps) => {
  return (
    <div className="fixed top-0 left-0 z-50 flex items-center justify-center h-screen w-screen">
      <span className="bg-primary-gray opacity-70 absolute top-0 left-0 h-screen w-screen"></span>
      <div className="p-10 bg-secondary-border font-primary relative rounded-lg">
        <button
          onClick={() => props.displayCodes.setDisplayInviteCodes(false)}
          className="absolute top-4 right-4"
        >
          <X />
        </button>
        <h1 className="text-4xl font-black">Invite friends!</h1>
        <p className="mt-4 text-xl">Have a friend you think might benefit from fether?</p>
        <p className="mt-4 text-xl">
          Send them one of your invite codes below and they can try it out!
        </p>
        <div className="flex flex-row justify-evenly mt-4">
          {props.userData?.IssuedInviteCodes?.map((code) => (
            <div className="flex flex-col items-center">
              <p className={code.keyStatus == "UNUSED" ? "text-green-400" : "text-red-400"}>
                {code.keyStatus.slice(0, 1) + code.keyStatus.toLowerCase().slice(1)}
              </p>
              <div className="flex flex-row text-base items-center">
                <p>{code.inviteCode}</p>
                {code.keyStatus == "UNUSED" && (
                  <button onClick={() => navigator.clipboard.writeText(code.inviteCode)}>
                    <Copy
                      className="transform ml-4 active:scale-75 transition-transform"
                      size={16}
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
