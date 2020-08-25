import * as React from "react";

import { render } from "react-dom";
import { IMessage } from "../../IMessage";
import { IGrypeFinding } from "../../IGrypeFinding";
import { Summary } from "./Summary";
import { FindingsList } from "./FindingsList";

export function App(): JSX.Element {
  const [findings, setFindings] = React.useState<IGrypeFinding[]>([]);

  React.useEffect(() => {
    window.addEventListener("message", (event) => {
      const message: IMessage<IGrypeFinding[]> = event.data;

      if (message.command === "update") {
        const findings = message.payload;

        setFindings(findings);
      }
    });
  }, []);

  return (
    <div>
      <Summary findings={findings} />
      <FindingsList findings={findings} />
    </div>
  );
}

render(<App />, document.getElementById("main"));
