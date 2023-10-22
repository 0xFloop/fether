import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Info } from "lucide-react";
import { action, loader } from "~/routes/alpha.dashboard";
import { setupSteps } from "./SetupSteps";
import { TeamWithKeyRepoActivityMembers, UserWithKeyRepoActivityTeam } from "~/types";
import { DashboardProps } from "./PersonalDashboard";
import React from "react";

export type SetupWizardProps = DashboardProps & {
  step: number;
  updateStep: (step: number) => void;
};

const SetupWizard: React.FC<SetupWizardProps> = (props: SetupWizardProps) => {
  if (props.step == 7) throw new Error("Setup wizard error, please sign out and sign back in.");
  return (
    <div className="selection:bg-accent selection:text-primary-gray max-w-screen h-auto min-h-screen display flex flex-col items-center justify-center text-[#a38282]  ">
      <div className="w-11/12 min-w-[800px] max-w-[1100px] h-[750px] flex flex-row justify-between items-center">
        <div className="text-white border border-secondary-border rounded-l-3xl h-full w-1/3 min-w-[350px] p-4 bg-[#1E1E1E] flex flex-col gap-4">
          <p className="text-lg mt-4 bg-accent w-20 rounded-lg text-center">Alpha</p>
          <h1 className="text-5xl">Welcome to Fether setup wizard</h1>
          <p className="text-lg">Let's get things set up for you!</p>
          <div id="step-selector" className="flex flex-col justify-between flex-1">
            {setupSteps.map((step, index) => (
              <React.Fragment key={step.stepNumber}>
                {(props.dashboardType == "personal" ||
                  (props.dashboardType == "team" && step.name != "02")) && (
                  <button
                    id={step.stepNumber}
                    onClick={() => {
                      if (index > 1 && props.step > index) {
                        props.updateStep(index);
                      }
                    }}
                    className={
                      (props.step == index ? "bg-accent " : "") +
                      "w-full p-4 flex flex-row items-center border rounded-lg border-[#6161FF]"
                    }
                  >
                    <div className="ml-2 text-base">
                      {props.step > index ? (
                        <img
                          src="/images/setupCheck.svg"
                          alt="step complete checkmark"
                          className="w-6 h-8"
                        ></img>
                      ) : (
                        <p className="text-2xl">{step.stepNumber}</p>
                      )}
                    </div>
                    <p className="ml-2 text-base">{step.name}</p>
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="text-white relative rounded-r-3xl h-full bg-[#545454] gap-4 flex flex-col flex-1 pt-10">
          <div className="flex flex-row items-center px-10">
            <img src={setupSteps[props.step].iconUrl} alt="setup step icon"></img>
            <h1 className="text-3xl ml-10">{setupSteps[props.step].name}</h1>
          </div>
          <div className="text-2xl flex items-center min-h-[250px] px-10">
            {setupSteps[props.step].description}
          </div>
          <div className="flex-1 px-10 overflow-hidden">
            {setupSteps[props.step].actionComponent({
              dashboardType: props.dashboardType,
              userData: props.userData,
              teamData: props.teamData,
              navigation: props.navigation,
              actionArgs: props.actionArgs,
              updateStep: props.updateStep,
            })}
          </div>
          {props.actionArgs?.error && (
            <div className="text-red-500 px-10">Error: {props.actionArgs?.error}</div>
          )}
          <div className="h-28 border-t-2 border-[#6D6D6D] px-10 flex items-center justify-between">
            <div>
              <p className="text-lg">For more information, visit the documentation!</p>
              <div className="flex flex-row items-center gap-2 text-sm">
                <Info size={16} strokeWidth={3} /> <p> all selections can be updated after setup</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
