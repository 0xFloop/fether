import { ConnectButton } from "@rainbow-me/rainbowkit";
export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    data-connected={Boolean(account)}
                    className="text-[#f0f0f0] bg-almost-black py-2 px-4  rounded-lg"
                    onClick={openConnectModal}
                    type="button"
                  >
                    Connect
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button
                    data-connected={Boolean(account)}
                    className="text-[#f0f0f0] bg-red-500 py-2 px-4 rounded-lg"
                    onClick={openChainModal}
                    type="button"
                  >
                    Wrong network
                  </button>
                );
              }
              return (
                <button
                  data-connected={Boolean(account)}
                  className="text-[#f0f0f0] bg-almost-black py-2 px-4  rounded-lg"
                  onClick={openAccountModal}
                  type="button"
                >
                  {account.displayName}
                  {/* {account.displayBalance ? ` (${account.displayBalance})` : ""} */}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
