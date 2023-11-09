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
  if (props.step == 8) throw new Error("Setup wizard error, please sign out and sign back in.");

  //the dumbest solution to a 3 hour bug hunt
  if (props.step == 7) return <></>;
  return (
    <div className="selection:bg-accent selection:text-primary-gray max-w-screen h-auto min-h-screen display flex flex-col items-center justify-center text-[#a38282]  ">
      <div className="w-11/12 min-w-[800px] max-w-[836px] h-[650px] flex flex-row justify-between items-center rounded-lg overflow-hidden border border-off-white bg-dark-gray">
        <div className="text-white border-r border-r-off-white/50  h-full w-[280px] flex flex-col">
          <div className="flex flex-row justify-between items-end p-4 border-b border-b-off-white/50">
            <img className="w-1/2" src="/images/fetherWideLogoNoBorder.svg" alt="" />
            <p>
              BETA <span className="text-secondary-orange">0.0.03</span>
            </p>
          </div>
          <h1 className="ml-4 py-6 text-4xl">
            Setup <br />
            Wizard
          </h1>
          <div id="step-selector" className="flex flex-col gap-[6px] flex-1 px-4">
            {setupSteps.map((step, index) => (
              <div key={step.stepNumber} className="overflow-hidden">
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
                      (props.step == index ? "bg-secondary-orange " : "") +
                      "w-full h-14 p-3 flex flex-row items-center border relative text-sm " +
                      (props.step < index ? "border-off-white" : "border-secondary-orange")
                    }
                  >
                    {props.step == index ? (
                      <>
                        <div
                          id="slice"
                          className="absolute box-border top-0 right-0 border bg-dark-gray -mt-6 -mr-5 border-secondary-orange rotate-[35deg] w-12 h-10"
                        ></div>
                        <p className="text-base text-black">{step.stepNumber}</p>
                        <p className="ml-2 text-black">{step.name}</p>
                      </>
                    ) : (
                      <>
                        {props.step > index ? (
                          <>
                            <div
                              id="slice"
                              className="absolute box-border top-0 right-0 border bg-dark-gray -mt-6 -mr-5 border-secondary-orange rotate-[35deg] w-12 h-10"
                            ></div>
                            <img
                              src="/images/setupCheckOrange.svg"
                              alt="step complete checkmark"
                              className="w-6 h-8"
                            ></img>
                            <p className="ml-2 text-secondary-orange">{step.name}</p>
                          </>
                        ) : (
                          <>
                            <div
                              id="slice"
                              className="absolute box-border top-0 right-0 border bg-dark-gray -mt-6 -mr-5 border-white rotate-[35deg] w-12 h-10"
                            ></div>
                            <p className="text-base ">{step.stepNumber}</p>
                            <p className="ml-2">{step.name}</p>
                          </>
                        )}
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="text-white relative h-full gap-4 flex flex-col flex-1">
          <div className="flex flex-col justify-center gap-0 items-start px-12 py-8 leading-[50px] text-[44px]">
            <h1>Step {props.step + 1} :</h1>
            <h1>{setupSteps[props.step].name}</h1>
          </div>
          <div className="text-sm flex pb-10 px-12">{setupSteps[props.step].description}</div>
          <div className="flex-1 px-12 overflow-hidden">
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
