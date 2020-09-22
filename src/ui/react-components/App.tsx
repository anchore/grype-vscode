import * as React from "react";

import { render } from "react-dom";
import { IMessage } from "../../IMessage";
import { IGrypeFinding } from "../../IGrypeFinding";
import { Summary } from "./Summary";
import { FindingsList } from "./FindingsList";

export function App(): JSX.Element {
  const [findings, setFindings] = React.useState<IGrypeFinding[] | null>(null);

  React.useEffect(() => {
    window.addEventListener("message", (event) => {
      const message: IMessage<IGrypeFinding[]> = event.data;

      if (message.command === "update") {
        const findings = message.payload;

        setFindings(findings);
      }
    });
  }, []);

  if (findings) {
    const findingsList =
      findings.length >= 1 ? (
        <FindingsList findings={findings} openFile={openFile} />
      ) : null;

    return (
      <div>
        <Summary findings={findings} />
        {findingsList}
      </div>
    );
  }

  return <div></div>;
}

interface IVSCode {
  postMessage(message: IMessage<string>): void;
}

// This "any" type is necessary. VS Code does not provide a TypeScript type definition for the "acquireVsCodeApi" function that they make available in the webview environment for accessing a restricted implementation of the VS Code API object. More details about this mechanism can be found here: https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
// If you're wondering whether it's ironic that a TypeScript definition is missing in VS Code, the answer is "yes".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vscode: IVSCode = (window as any).vscode;

const openFile = (uri: string): void => {
  const message: IMessage<string> = {
    command: "openFile",
    payload: uri,
  };
  vscode.postMessage(message);
};

render(<App />, document.getElementById("main"));
