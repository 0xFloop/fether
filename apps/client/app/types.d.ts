import { ApiKey, Repository, User, Transaction, InviteCode, Team, TeamInviteCode } from "database";

export type UserWithKeyRepoActivityTeam =
  | (User & {
      ApiKey: ApiKey | null;
      IssuedInviteCodes: InviteCode[] | null;
      MemberTeam: Team | null;
      Repository:
        | (Repository & {
            Activity: Transaction[] | null;
          })
        | null;
    })
  | null;

export type returnedMemberData = {
  username: string;
  isOwner: boolean;
};

export type TeamWithKeyRepoActivityMembers =
  | (Team & {
      ApiKey: ApiKey | null;
      InviteCodes: TeamInviteCode[] | null;
      Owner: User | null;
      Members: User[] | null;
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
  status: "success" | "reverted";
  timestamp: number;
  blockNumber: number;
  from: string;
  to: string | null;
  created: string | null;
  gasUsed: number;
  gasPrice: number;
  maxPriorityFee: number;
  maxFee: number;
  transactionFeeWei: number;
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
