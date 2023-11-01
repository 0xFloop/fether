import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowUpRight } from "lucide-react";
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
                    className="text-secondary-orange text-3xl flex flex-row items-center"
                    onClick={openConnectModal}
                    type="button"
                  >
                    Connect Wallet{" "}
                    <ArrowUpRight className="ml-2" size={24} color="rgb(156 163 175)" />
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button
                    data-connected={Boolean(account)}
                    className="text-red-500 text-3xl flex flex-row items-center"
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
                  className="text-secondary-orange text-3xl flex flex-row items-center"
                  onClick={openAccountModal}
                  type="button"
                >
                  {account.displayName}{" "}
                  <ArrowUpRight className="ml-2" size={24} color="rgb(156 163 175)" />
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
