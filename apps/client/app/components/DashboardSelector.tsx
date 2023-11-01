import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { Loader, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import { action } from "~/routes/alpha.dashboard";
import { UserWithKeyRepoActivityTeam } from "~/types";

type DashboardSelectorProps = {
  userData: UserWithKeyRepoActivityTeam;
  navigation: ReturnType<typeof useNavigation>;
  actionArgs: ReturnType<typeof useActionData<typeof action>>;
};
export const DashboardSelector = (props: DashboardSelectorProps) => {
  const [createTeam, setCreateTeam] = useState(false);
  const [validTeamName, setValidTeamName] = useState(false);
  const userData = props.userData;
  const navigation = props.navigation;
  const actionArgs = props.actionArgs;

  const parseTeamNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const teamName = e.target.value;
    const validTeamName = /^[a-zA-Z0-9-_]+$/.test(teamName);
    const validLength = teamName.length > 3 && teamName.length < 21;
    setValidTeamName(validTeamName && validLength);
  };

  return (
    <div className="absolute top-3/4 py-6 px-8 text-xl bg-dark-gray z-50 border border-off-white/50 rounded-md">
      <p className="text-tertiary-gray">Personal Account</p>
      <Link className="underline" to={`/alpha/dashboard`}>
        {userData?.username}
      </Link>{" "}
      <p className="mt-6 text-tertiary-gray">Team Account</p>
      {userData?.memberTeamId ? (
        <Link className="underline" to={`/alpha/team/${userData.MemberTeam?.id}`}>
          {userData.MemberTeam?.name}
        </Link>
      ) : (
        <>
          {createTeam ? (
            <Form method="post" className="flex flex-col">
              <input
                type="hidden"
                name="githubInstallationId"
                value={userData?.githubInstallationId as string}
              />
              <input type="hidden" name="formType" value="createTeam" />
              <input
                type="text"
                maxLength={20}
                name="teamName"
                onChange={parseTeamNameInput}
                placeholder="Enter Team Name"
                className="bg-transparent text-xl py-3 px-4 border border-secondary-orange focus:border-secondary-orange w-full mt-3 text-center focus:ring-0"
              />

              <button
                type="submit"
                className={
                  validTeamName
                    ? `w-full border border-off-white/25 rounded-full mt-3 flex py-3 items-center justify-center bg-black`
                    : `w-full border border-off-white/25 text-off-white/25 rounded-full mt-3 flex py-3 items-center justify-center bg-dark-gray`
                }
              >
                {navigation.state == "submitting" &&
                navigation.formData?.get("formType") == "createTeam" ? (
                  <div className="animate-spin">
                    <Loader size={28} />
                  </div>
                ) : (
                  "Create Team"
                )}
              </button>
            </Form>
          ) : (
            <button
              className="flex flex-row items-center justify-between"
              onClick={() => setCreateTeam(!createTeam)}
            >
              <PlusCircle size={20} color="#FF6B00" />
              <p className="text-secondary-orange border-b ml-3 border-b-secondary-orange">
                Create New Team
              </p>
            </button>
          )}
          {actionArgs?.originCallForm == "createTeam" && actionArgs.error && (
            <p className="text-red-500 text-base">{actionArgs.error}</p>
          )}
        </>
      )}
    </div>
  );
};
