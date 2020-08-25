import React = require("react");
import { IGrypeFinding } from "../../IGrypeFinding";

export function Summary(props: IProps): JSX.Element {
  const count = props.findings.length;
  const noun = count === 1 ? "package" : "packages";

  return (
    <h1>
      Your workspace has {count} vulnerable {noun}.
    </h1>
  );
}

interface IProps {
  findings: IGrypeFinding[];
}
