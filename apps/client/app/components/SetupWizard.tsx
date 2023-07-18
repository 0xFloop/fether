import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Loader } from "lucide-react";
import { useState } from "react";
import { action, loader } from "~/routes/alpha.dashboard";
import { setupSteps } from "./setupSteps";

interface SetupWizardProps {
  loaderData: ReturnType<typeof useLoaderData<typeof loader>>;
  actionArgs: ReturnType<typeof useActionData<typeof action>>;
  navigation: ReturnType<typeof useNavigation>;
  setupStep: number;
}

const SetupWizard: React.FC<SetupWizardProps> = (props: SetupWizardProps) => {
  const [setupStep, setSetupStep] = useState(props.setupStep);
  const userData = props.loaderData.userData;
  return (
    <div className="w-[1100px] max-w-7xl h-[750px] flex flex-row justify-between items-center">
      <div className="text-white rounded-l-3xl h-full w-1/3 p-4 bg-[#1E1E1E] flex flex-col gap-4">
        <p className="text-lg mt-4 bg-secondary-blue w-20 rounded-lg text-center">Alpha</p>
        <h1 className="text-5xl">Welcome to Fether setup wizard</h1>
        <p className="text-lg">Let's get things set up for you!</p>
        <div id="step-selector" className="flex flex-col justify-between flex-1">
          {setupSteps.map((step, index) => (
            <button
              id={step.stepNumber}
              onClick={() => setSetupStep(index + 1)}
              className={
                (setupStep == index + 1 ? "bg-secondary-blue " : "") +
                "w-full p-4 flex flex-row items-center border rounded-lg border-[#6161FF]"
              }
            >
              <div className="ml-2 text-base">
                {setupStep > index + 1 ? (
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
      <div className="text-white rounded-r-3xl h-full bg-[#545454] flex-1 ">right</div>
    </div>
  );
};

export default SetupWizard;
