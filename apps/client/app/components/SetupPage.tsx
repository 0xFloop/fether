import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Copy, CheckCircle, Loader } from "lucide-react";
import { useState } from "react";
import { sleep } from "~/utils/helpers";
import { action, loader } from "~/routes/alpha.dashboard";

interface SetupPageProps {
  userData: ReturnType<typeof useLoaderData<typeof loader>>;
  actionArgs: ReturnType<typeof useActionData<typeof action>>;
  navigation: ReturnType<typeof useNavigation>;
}

const SetupPage: React.FC<SetupPageProps> = (props: SetupPageProps) => {
  return (
    <div id="content" className="w-3/4 max-w-7xl mx-auto py-20 rounded-lg">
      {!props.userData?.ApiKey ? (
        <div className="text-4xl border-b bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg">
          <h1>Api Key:</h1>
          <Form method="post" action="/keygen">
            <input type="hidden" name="userId" value={props.userData?.id} />
            <input type="hidden" name="formType" value="generateApiKey" />
            <button type="submit">Click here to generate api key</button>
          </Form>
        </div>
      ) : (
        <div>
          <div className="text-4xl border-b  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg">
            <p>Api Key:</p>
            <p className="flex flex-row items-center gap-2">{props.userData?.ApiKey.key}</p>
          </div>
          {!props.userData.githubInstallationId ? (
            <div className="text-4xl  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg mt-10">
              <a href="https://github.com/apps/fetherkit/installations/new" target="_blank">
                Click to add github FetherKit app
              </a>
            </div>
          ) : (
            <div>
              {!props.userData?.Repository ? (
                <div>
                  <div className="text-4xl mt-10 border-b  bg-[#F5F5F5] p-5 flex flex-col justify-between rounded-lg">
                    <Form method="post">
                      <input
                        type="hidden"
                        name="githubInstallationId"
                        value={props.userData.githubInstallationId}
                      />
                      <input type="hidden" name="formType" value="getAllRepos" />
                      {props.navigation.state == "submitting" &&
                      props.navigation.formData.get("formType") == "getAllRepos" ? (
                        <div className="flex flex-row items-center">
                          Loading repositories
                          <div className="ml-5 animate-spin">
                            <Loader size={30} />
                          </div>
                        </div>
                      ) : (
                        <button type="submit">Click to choose repository</button>
                      )}
                    </Form>
                    {props.actionArgs?.originCallForm == "getRepos" && (
                      <>
                        <Form method="post" className="mt-10">
                          <input
                            type="hidden"
                            name="githubInstallationId"
                            value={props.userData.githubInstallationId}
                          />
                          <input type="hidden" name="formType" value="getChosenRepo" />

                          <fieldset className="grid grid-cols-2">
                            {props.actionArgs.repositories?.map((repo: any) => (
                              <label key={repo.repoName} className="text-xl">
                                <input
                                  type="radio"
                                  name="chosenRepoData"
                                  value={[repo.repoName, repo.repoId]}
                                />{" "}
                                {repo.repoName}
                              </label>
                            ))}
                          </fieldset>
                          <br />
                          <button
                            type="submit"
                            className="text-white bg-black py-2 px-4 border rounded-lg"
                          >
                            {props.navigation.state == "submitting" &&
                            props.navigation.formData.get("formType") == "getChosenRepo" ? (
                              <p>Submitting....</p>
                            ) : (
                              <p>Submit</p>
                            )}
                          </button>
                        </Form>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-4xl  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg mt-10">
                    <p>Repository:</p> <p>{props.userData.Repository.name}</p>
                  </div>
                  {props.userData?.Repository?.filename ? (
                    <>
                      <div className="text-4xl  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg mt-10">
                        <p>Contract:</p> <p>{props.userData.Repository.filename}</p>
                      </div>

                      <div className="text-4xl  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg mt-10">
                        <Form method="post">
                          <input
                            type="hidden"
                            name="githubInstallationId"
                            value={props.userData.githubInstallationId}
                          />
                          <input type="hidden" name="formType" value="deployContract" />
                          {props.navigation.state == "submitting" &&
                          props.navigation.formData.get("formType") == "deployContract" ? (
                            <div className="flex flex-row items-center">
                              Deploying....
                              <div className="ml-5 animate-spin">
                                <Loader size={20} />
                              </div>
                            </div>
                          ) : (
                            <button type="submit">Click here to deploy your contract</button>
                          )}
                        </Form>
                      </div>
                    </>
                  ) : (
                    <div className="text-4xl border-b  bg-[#F5F5F5] p-5 flex flex-col justify-between rounded-lg mt-10">
                      {props.actionArgs?.originCallForm != "chooseFileToTrack" &&
                        !props.userData?.Repository.filename && (
                          <>
                            <Form method="post">
                              <input
                                type="hidden"
                                name="githubInstallationId"
                                value={props.userData.githubInstallationId}
                              />
                              <input type="hidden" name="formType" value="getFilesOfChosenRepo" />
                              {props.navigation.state == "submitting" &&
                              props.navigation.formData.get("formType") ==
                                "getFilesOfChosenRepo" ? (
                                <div className="flex flex-row items-center">
                                  Loading files
                                  <div className="ml-5 animate-spin">
                                    <Loader size={30} />
                                  </div>
                                </div>
                              ) : (
                                <button type="submit">
                                  Click to select which solidity file to track
                                </button>
                              )}
                            </Form>
                            {props.actionArgs?.originCallForm == "getFilesOfChosenRepo" && (
                              <>
                                <Form method="post" className="mt-10">
                                  <input
                                    type="hidden"
                                    name="githubInstallationId"
                                    value={props.userData.githubInstallationId}
                                  />
                                  <input type="hidden" name="formType" value="chooseFileToTrack" />
                                  <fieldset className="grid grid-cols-2">
                                    {props.actionArgs.solFilesFromChosenRepo?.map(
                                      (fileName: any, i: number) => (
                                        <label key={i} className="text-xl">
                                          <input
                                            type="radio"
                                            name="chosenFileName"
                                            value={fileName}
                                          />
                                          {fileName}
                                        </label>
                                      )
                                    )}
                                  </fieldset>
                                  <br />
                                  <button
                                    type="submit"
                                    className="text-white bg-black py-2 px-4 border rounded-lg"
                                  >
                                    {props.navigation.state == "submitting" &&
                                    props.navigation.formData.get("formType") ==
                                      "chooseFileToTrack" ? (
                                      <p>Submitting....</p>
                                    ) : (
                                      <p>Submit</p>
                                    )}
                                  </button>
                                </Form>
                              </>
                            )}
                          </>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SetupPage;
