import { ActionArgs, redirect } from "@vercel/remix";

export const action = async ({ request }: ActionArgs) => {
  const fetherGithubAppInstallUrl = process.env.fetherGithubAppInstallUrl as string;
  return redirect(fetherGithubAppInstallUrl);
};
