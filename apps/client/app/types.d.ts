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

type RepoData = { repoName: string; repoId: string };
