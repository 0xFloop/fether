import { TxDetails } from "~/types";
import { timeSince } from "~/utils/helpers";

type TxDetailsProps = {
  txDetails: TxDetails;
};

const TxViewer: React.FC<TxDetailsProps> = (props: TxDetailsProps) => {
  const txDetails = props.txDetails;
  return (
    <div className="border gap-2 flex flex-col w-3/5 p-4 border-white left-[20%] rounded-lg absolute text-tertiary-gray bg-secondary-border text-lg ">
      <p className="text-white text-2xl">Transaction Details: </p>
      <p className="">
        Hash: <span className="text-white">{txDetails.hash}</span>
      </p>
      <div className="flex flex-row justify-between">
        <p className="">
          Status:{" "}
          <span className="text-white">
            {txDetails.status.charAt(0).toUpperCase() + txDetails.status.slice(1)}
          </span>
        </p>
        <p className="">
          Timestamp: <span className="text-white">{timeSince(txDetails.timestamp)} ago</span>
        </p>
        <p className="">
          Block: <span className="text-white">{txDetails.blockNumber}</span>
        </p>
      </div>

      <p className="">
        From: <span className="text-white">{txDetails.from}</span>
      </p>
      {txDetails.to && (
        <p className="">
          To: <span className="text-white">{txDetails.to}</span>
        </p>
      )}
      {txDetails.created && (
        <p className="">
          Created: <span className="text-white">{txDetails.created}</span>
        </p>
      )}
      <div className="flex flex-row justify-between">
        <p className="">
          Gas used: <span className="text-white">{txDetails.gasUsed}</span>
        </p>
        <p className="">
          Gas price:{" "}
          <span className="text-white">{(txDetails.gasPrice / 1e9).toFixed(2)} gwei</span>
        </p>
        <p className="">
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
  );
};

export default TxViewer;
