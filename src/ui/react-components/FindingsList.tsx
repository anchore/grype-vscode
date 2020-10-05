import React = require("react");
import { IGrypeFinding } from "../../IGrypeFinding";
import { Table } from "semantic-ui-react";
import _ = require("lodash");
import { Description } from "./Description";

export function FindingsList(props: IProps): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { column, direction } = state;
  const currentRows = state.sort(rows(props.findings));

  return (
    <Table sortable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell
            sorted={column === "packageName" ? direction : undefined}
            onClick={() =>
              dispatch({ type: "CHANGE_SORT", column: "packageName" })
            }
          >
            Package
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={column === "vulnerability" ? direction : undefined}
            onClick={() =>
              dispatch({ type: "CHANGE_SORT", column: "vulnerability" })
            }
          >
            Vulnerability
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={column === "severity" ? direction : undefined}
            onClick={() =>
              dispatch({ type: "CHANGE_SORT", column: "severity" })
            }
          >
            Severity
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={column === "fixedInVersion" ? direction : undefined}
            onClick={() =>
              dispatch({ type: "CHANGE_SORT", column: "fixedInVersion" })
            }
          >
            Fixed In Version
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={column === "description" ? direction : undefined}
            onClick={() =>
              dispatch({ type: "CHANGE_SORT", column: "description" })
            }
          >
            Description
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {currentRows.map(
          (
            {
              packageName,
              vulnerability,
              severity,
              fixedInVersion,
              description,
            },
            index
          ) => (
            <Table.Row key={index}>
              <Table.Cell>{packageName}</Table.Cell>
              <Table.Cell>{tryHyperlinking(vulnerability)}</Table.Cell>
              <Table.Cell>{tryColoring(severity)}</Table.Cell>
              <Table.Cell>{fixedInVersion}</Table.Cell>
              <Table.Cell>
                <Description
                  text={description.text}
                  location={description.location}
                  openFile={props.openFile}
                />
              </Table.Cell>
            </Table.Row>
          )
        )}
      </Table.Body>
    </Table>
  );
}

interface IProps {
  findings: IGrypeFinding[];
  openFile(uri: string): void;
}

interface IState {
  column: string | undefined;
  direction: Direction | undefined;
  sort(rows: IRow[]): IRow[];
}

interface IRow {
  packageName: string; // note: "package" is a reserved word in strict mode, hence "packageName"
  vulnerability: string;
  severity: string;
  fixedInVersion: string;
  description: IDescription;
}

interface IDescription {
  text: string;
  location: string;
}

interface IAction {
  type: "CHANGE_SORT";
  column: Column;
}

type Direction = "ascending" | "descending";
type Column =
  | "packageName"
  | "vulnerability"
  | "severity"
  | "fixedInVersion"
  | "description";

function rows(findings: IGrypeFinding[]): IRow[] {
  return findings.map((f) => {
    const row: IRow = {
      packageName: `${f.artifact.name} (${f.artifact.version})`,
      vulnerability: f.vulnerability.id,
      severity: f.vulnerability.severity,
      fixedInVersion: f.vulnerability.fixedInVersion || "",
      description: {
        text: f.vulnerability.description,
        location: f.artifact.locations[0],
      },
    };

    return row;
  });
}

function tryColoring(severity: string): JSX.Element {
  let color: string | null = null;

  switch (severity.toLocaleLowerCase()) {
    case "critical":
      color = "#f72e13";
      break;
    case "high":
      color = "#f75813";
      break;
    case "medium":
      color = "#f78913";
      break;
    case "low":
      color = "#e8b73c";
      break;
    case "negligible":
      color = "#95bf48";
      break;
  }

  if (color) {
    return <span style={{ color }}>{severity}</span>;
  }

  return <span>{severity}</span>;
}

function tryHyperlinking(vulnerabilityID: string): JSX.Element {
  function hyperlink(url: string, vulnerabilityID: string): JSX.Element {
    return (
      <span className="vulnerabilityID">
        <a href={url}>{vulnerabilityID}</a>
      </span>
    );
  }

  if (vulnerabilityID.startsWith("CVE-")) {
    const url = `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vulnerabilityID}`;
    return hyperlink(url, vulnerabilityID);
  } else if (vulnerabilityID.startsWith("GHSA-")) {
    const url = `https://github.com/advisories/${vulnerabilityID}`;
    return hyperlink(url, vulnerabilityID);
  }

  return <span className="vulnerabilityID">{vulnerabilityID}</span>;
}

function severityNumber(severity: string): number {
  switch (severity.toLowerCase()) {
    case "critical":
      return 100;
    case "high":
      return 80;
    case "medium":
      return 60;
    case "low":
      return 40;
    case "negligible":
      return 20;
  }

  return 1000; // Surface unrecognized input values lest they get hidden
}

function sort(rows: IRow[], column: Column, direction: Direction): IRow[] {
  const sorted = _.orderBy(
    rows,
    [
      (row) => {
        switch (column) {
          case "packageName":
            return row.packageName.toLowerCase();
          case "vulnerability":
            return row.vulnerability.toLowerCase();
          case "severity":
            return severityNumber(row.severity);
          case "fixedInVersion":
            return row.fixedInVersion?.toLowerCase();
          case "description":
            return row.description.text.toLowerCase();
        }
      },
    ],
    direction === "ascending" ? "asc" : "desc"
  );

  return sorted;
}

function initialSort(rows: IRow[]): IRow[] {
  return sort(rows, "severity", "descending");
}

function initialDirection(column: Column): Direction {
  return column === "severity" ? "descending" : "ascending";
}

function updatedDirection(prior: Direction | undefined): Direction {
  return prior === "ascending" ? "descending" : "ascending";
}

function reducer(state: IState, action: IAction): IState {
  switch (action.type) {
    case "CHANGE_SORT":
      if (state.column === action.column) {
        return {
          ...state,
          direction: updatedDirection(state.direction),
          sort: (rows) =>
            sort(rows, action.column, updatedDirection(state.direction)),
        };
      }

      return {
        column: action.column,
        direction: initialDirection(action.column),
        sort: (rows) =>
          sort(rows, action.column, initialDirection(action.column)),
      };
    default:
      throw new Error();
  }
}

const initialState: IState = {
  column: "severity",
  direction: "descending",
  sort: (rows) => initialSort(rows),
};
