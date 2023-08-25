import { TxDetails } from "~/types";
import { timeSince } from "~/utils/helpers";
import { Copy, X } from "lucide-react";
import { Form } from "@remix-run/react";
import { getAddress } from "viem";
type TxDetailsProps = {
  txDetails: TxDetails;
  githubInstallationId: string;
};

const TxViewer: React.FC<TxDetailsProps> = (props: TxDetailsProps) => {
  const txDetails = props.txDetails;
  return (
    <div className="flex justify-center items-center absolute top-0 left-0 w-full h-full">
      <div className="border gap-2 flex flex-col w-3/5 max-w-3xl p-5 border-white rounded-lg text-tertiary-gray bg-secondary-border text-lg ">
        <div className="flex flex-row justify-between">
          <p className="text-white text-2xl">Transaction Details: </p>

          <Form method="post">
            <input
              type="hidden"
              name="githubInstallationId"
              value={props.githubInstallationId as string}
            />
            <button type="submit">
              <X />
            </button>
          </Form>
        </div>

        <div className="text-white hidden xl:flex">
          <p className="text-tertiary-gray">Hash:</p>&nbsp;<p>{txDetails.hash}</p>
        </div>
        <div className="text-white xl:hidden flex items-center">
          <p className="text-tertiary-gray">Hash:</p>&nbsp;{txDetails.hash.slice(0, 15)}••••
          {txDetails.hash.slice(45)}
          <Copy
            className="transform ml-4 active:scale-75 transition-transform"
            size={20}
            onClick={() => navigator.clipboard.writeText(txDetails.hash)}
          />
        </div>
        <div className="flex flex-col xl:flex-row gap-2 xl:gap-0 justify-between">
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
          From: <span className="text-white">{getAddress(txDetails.from)}</span>
        </p>
        {txDetails.to && (
          <p className="">
            To: <span className="text-white">{getAddress(txDetails.to)}</span>
          </p>
        )}
        {txDetails.created && (
          <p className="">
            Created: <span className="text-white">{getAddress(txDetails.created)}</span>
          </p>
        )}
        <div className="flex flex-col xl:flex-row gap-2 xl:gap-0 justify-between">
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
    </div>
  );
};

export default TxViewer;
