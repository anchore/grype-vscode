import React = require("react");
import { IGrypeFinding } from "../../IGrypeFinding";

export function Summary(props: IProps): JSX.Element {
  const count = props.findings.length;
  const noun = count === 1 ? "vulnerability" : "vulnerabilities";

  return (
    <h1>
      Your workspace has {count} {noun}.
    </h1>
  );
}

interface IProps {
  findings: IGrypeFinding[];
}
