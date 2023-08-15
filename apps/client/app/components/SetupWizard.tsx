import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Info, Loader } from "lucide-react";
import { useState } from "react";
import { action, loader } from "~/routes/alpha.dashboard";
import { setupSteps } from "./setupSteps";
import { UserWithKeyRepoActivity } from "~/types";

export interface SetupWizardProps {
  loaderData: ReturnType<typeof useLoaderData<typeof loader>>;
  actionArgs: ReturnType<typeof useActionData<typeof action>>;
  navigation: ReturnType<typeof useNavigation>;
  setupStep: number;
}

const SetupWizard: React.FC<SetupWizardProps> = (props: SetupWizardProps) => {
  const [setupStep, setSetupStep] = useState(props.setupStep);
  const userData = props.loaderData.userData;
  return (
    <>
      {setupSteps[setupStep].iconUrl && (
        <div className="w-[1100px] max-w-7xl h-[750px] flex flex-row justify-between items-center">
          <div className="text-white rounded-l-3xl h-full w-1/3 p-4 bg-[#1E1E1E] flex flex-col gap-4">
            <p className="text-lg mt-4 bg-secondary-blue w-20 rounded-lg text-center">Alpha</p>
            <h1 className="text-5xl">Welcome to Fether setup wizard</h1>
            <p className="text-lg">Let's get things set up for you!</p>
            <div id="step-selector" className="flex flex-col justify-between flex-1">
              {setupSteps.map((step, index) => (
                <button
                  id={step.stepNumber}
                  onClick={() => {
                    if (index > 1 && setupStep > index) {
                      setSetupStep(index);
                    }
                  }}
                  className={
                    (setupStep == index ? "bg-secondary-blue " : "") +
                    "w-full p-4 flex flex-row items-center border rounded-lg border-[#6161FF]"
                  }
                >
                  <div className="ml-2 text-base">
                    {setupStep > index ? (
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
              ))}
            </div>
          </div>
          <div className="text-white relative rounded-r-3xl h-full bg-[#545454] gap-4 flex flex-col flex-1 pt-10">
            <div className="flex flex-row items-center px-10">
              <img src={setupSteps[setupStep].iconUrl} alt="setup step icon"></img>
              <h1 className="text-3xl ml-10">{setupSteps[setupStep].name}</h1>
            </div>
            <div className="text-2xl flex items-center min-h-[250px] px-10">
              {setupSteps[setupStep].description}
            </div>
            <div className="flex-1 px-10 ">
              {setupSteps[setupStep].actionComponent({
                userData: userData as UserWithKeyRepoActivity,
                navigation: props.navigation,
                actionArgs: props.actionArgs,
                updateStep: setSetupStep,
              })}
            </div>
            {props.actionArgs?.error && (
              <div className="text-red-500 px-10">Error: {props.actionArgs?.error}</div>
            )}
            <div className="h-28 border-t-2 border-[#6D6D6D] px-10 flex items-center justify-between">
              <div>
                <p className="text-lg">For more information, visit the documentation!</p>
                <div className="flex flex-row items-center gap-2 text-sm">
                  <Info size={16} strokeWidth={3} />{" "}
                  <p> all selections can be updated after setup</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SetupWizard;
