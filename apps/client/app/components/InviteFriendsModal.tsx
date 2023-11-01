import { Copy, X } from "lucide-react";
import { DisplayCodesContextType, UserWithKeyRepoActivityTeam } from "~/types";
import { PopupModal } from "./PopupModal";

type InviteModalProps = {
  userData: UserWithKeyRepoActivityTeam;
  displayCodes: DisplayCodesContextType;
};

export const InviteFriendsModal = (props: InviteModalProps) => {
  return (
    <PopupModal display={true} displaySetter={props.displayCodes.setDisplayInviteCodes}>
      <div className="text-center">
        <h1 className="text-xl font-black">Know someone who needs Fether?</h1>
        <p className="mt-4 text-base">
          Send 'em one of your invite codes below and they <br /> can experience the magic
          themselves.
        </p>
      </div>
      <div className="flex flex-row justify-evenly mt-9">
        {props.userData?.IssuedInviteCodes?.map((code) => (
          <>
            {code.keyStatus == "UNUSED" ? (
              <button
                className="flex flex-col items-center"
                onClick={() => navigator.clipboard.writeText(code.inviteCode)}
              >
                <div className="border border-off-white rounded-lg py-2 px-4">
                  <p className="text-off-white/50 text-xs">
                    {code.keyStatus.slice(0, 1) + code.keyStatus.toLowerCase().slice(1)}
                  </p>
                  <p className="font-bold text-base">{code.inviteCode}</p>
                </div>
                <p className="font-bold text-base text-secondary-orange mt-2">Copy Code</p>
              </button>
            ) : (
              <button className="flex flex-col items-center">
                <div className="border border-off-white/25 rounded-lg py-2 px-4">
                  <p className="text-off-white/50 text-xs">
                    {code.keyStatus.slice(0, 1) + code.keyStatus.toLowerCase().slice(1)}
                  </p>
                  <p className="font-bold text-base text-off-white/25">{code.inviteCode}</p>
                </div>
              </button>
            )}
          </>
        ))}
      </div>
    </PopupModal>
  );
};
