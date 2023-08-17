import { ApiKey, Repository, User, Transaction } from "database";

export type UserWithKeyRepoActivity =
  | (User & {
      ApiKey: ApiKey | null;
      Repository:
        | (Repository & {
            Activity: Transaction[] | null;
          })
        | null;
    })
  | null;

export type RepoData = { repoName: string; repoId: string };

export type ContractReturnItem = {
  name: string;
  value: any;
};
export type ContractReturn = { methodName: string; returnItems: ContractReturnItem[] };

export type TxDetails = {
  hash: string;
  status: "Succeded" | "Failed" | "Pending" | "Unknown";
  timestamp: number;
  blockNumber: number;
  from: string;
  to: string | null;
  created: string | null;
  gasUsed: string;
  maxPriorityFee: string;
  maxFee: string;
  nonce: number;
  transactionFee: string;
};

export type DashboardActionReturn = {
  originCallForm: string | null;
  chosenRepoName: string | null;
  repositories: RepoData[] | null;
  solFilesFromChosenRepo: string[] | null;
  chosenFileName: string | null;
  txDetails: TxDetails | null;
  error: any;
};
