import React = require("react");

export function Description(props: IProps): JSX.Element {
  const { text, location, openFile } = props;

  return (
    <span>
      {text} Found in:&nbsp;
      {linkLocation(location, openFile)}
    </span>
  );
}

interface IProps {
  text: string;
  location: string;
  openFile(uri: string): void;
}

function linkLocation(
  location: string,
  openFile: (uri: string) => void
): JSX.Element {
  return (
    <a href={"#"} onClick={() => openFile(location)}>
      {location}
    </a>
  );
}
