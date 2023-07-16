import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Loader } from "lucide-react";
import { useState } from "react";
import { action, loader } from "~/routes/alpha.dashboard";

interface SetupWizardProps {
  userData: ReturnType<typeof useLoaderData<typeof loader>>;
  actionArgs: ReturnType<typeof useActionData<typeof action>>;
  navigation: ReturnType<typeof useNavigation>;
  setupStep: number;
}

const SetupWizard: React.FC<SetupWizardProps> = (props: SetupWizardProps) => {
  return (
    <div className="w-[1100px] max-w-7xl h-[750px] flex flex-row justify-between items-center">
      <div className="text-white rounded-l-3xl h-full w-1/3 p-4 bg-[#1E1E1E] flex flex-col gap-4">
        <p className="text-lg mt-4 bg-secondary-blue w-20 rounded-lg text-center">Alpha</p>
        <h1 className="text-5xl">Welcome to Fether setup wizard</h1>
        <p className="text-lg">Let's get things set up for you!</p>
        <div id="step-selector" className="flex-1 border border-white ">
          <p>hello</p>
        </div>
      </div>
      <div className="text-white rounded-r-3xl h-full bg-[#545454] flex-1 ">right</div>
    </div>
  );
};

export default SetupWizard;
