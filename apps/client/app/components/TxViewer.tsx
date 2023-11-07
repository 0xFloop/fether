import { TxDetails } from "~/types";
import { timeSince } from "~/utils/helpers";
import { Copy, X } from "lucide-react";
import { Form, useSubmit } from "@remix-run/react";
import { getAddress } from "viem";
import { PopupModal } from "./PopupModal";
type TxDetailsProps = {
  txDetails: TxDetails;
  githubInstallationId: string;
};

const TxViewer: React.FC<TxDetailsProps> = (props: TxDetailsProps) => {
  const txDetails = props.txDetails;
  let submit = useSubmit();
  return (
    <PopupModal
      display={true}
      displaySetter={() => submit(null, { method: "post", action: "/alpha/dashboard" })}
    >
      <div className="text-base border border-off-white/25 text-tertiary-gray my-5">
        <div className="text-white hidden xl:flex items-center border-b border-off-white/25 p-4">
          <p className="text-tertiary-gray">Hash:</p>&nbsp;{" "}
          <p className="text-sm">{txDetails.hash}</p>
        </div>
        <div className="text-white xl:hidden justify-center flex items-center p-4 border-b border-off-white/25">
          <p className="text-tertiary-gray">Hash:</p>
          <p className="text-sm">
            &nbsp;{txDetails.hash.slice(0, 15)}••••
            {txDetails.hash.slice(45)}
          </p>
          <Copy
            className="transform ml-4 active:scale-75 transition-transform"
            size={20}
            onClick={() => navigator.clipboard.writeText(txDetails.hash)}
          />
        </div>
        <div className="flex flex-col xl:flex-row gap-2 xl:gap-0 justify-between border-b border-b-off-white/25">
          <p className="p-4 w-1/4 flex justify-center border-r border-off-white/25">
            Status:&nbsp;
            <span className="text-white">
              {txDetails.status.charAt(0).toUpperCase() + txDetails.status.slice(1)}
            </span>
          </p>
          <p className="p-4 flex flex-1 justify-center border-r border-off-white/25">
            Timestamp:&nbsp;<span className="text-white">{timeSince(txDetails.timestamp)} ago</span>
          </p>
          <p className="p-4 w-1/4 flex justify-center">
            Block:&nbsp;<span className="text-white">{txDetails.blockNumber}</span>
          </p>
        </div>

        <p className="p-4 border-b border-off-white/25">
          From: <span className="text-white">{getAddress(txDetails.from)}</span>
        </p>
        {txDetails.to && (
          <p className="p-4 border-b border-off-white/25">
            To: <span className="text-white">{getAddress(txDetails.to)}</span>
          </p>
        )}
        {txDetails.created && (
          <p className="p-4 border-b border-off-white/25">
            Created: <span className="text-white">{getAddress(txDetails.created)}</span>
          </p>
        )}
        <div className="flex flex-col xl:flex-row gap-2 xl:gap-0 justify-between text-center">
          <p className="p-4 border-r border-off-white/25">
            Gas used: <span className="text-white">{txDetails.gasUsed}</span>
          </p>
          <p className="p-4 border-r border-off-white/25">
            Gas price:{" "}
            <span className="text-white">{(txDetails.gasPrice / 1e9).toFixed(2)} gwei</span>
          </p>
          <p className="p-4">
            Transaction fee:{" "}
            {txDetails.transactionFeeWei > 1e16 ? (
              <span className="text-white">
                {(txDetails.transactionFeeWei / 1e18).toFixed(2)} FEth
              </span>
            ) : (
              <span className="text-white">
                {(txDetails.transactionFeeWei / 1e9).toFixed(2)} Gwei
              </span>
            )}
          </p>
        </div>
      </div>
    </PopupModal>
  );
};

export default TxViewer;
