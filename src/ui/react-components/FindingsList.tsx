import React = require("react");
import { IGrypeFinding } from "../../IGrypeFinding";
import { Table } from "semantic-ui-react";
import _ = require("lodash");

export function FindingsList(props: IProps): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { column, direction } = state;
  const currentRows = state.sort(rows(props.findings));

  return (
    <Table sortable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell
            sorted={column === "name" ? direction : undefined}
            onClick={() => dispatch({ type: "CHANGE_SORT", column: "name" })}
          >
            Name
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
          ({ name, vulnerability, severity, description }, index) => (
            <Table.Row key={index}>
              <Table.Cell>{name}</Table.Cell>
              <Table.Cell>{tryHyperlinking(vulnerability)}</Table.Cell>
              <Table.Cell>{tryColoring(severity)}</Table.Cell>
              <Table.Cell>{description}</Table.Cell>
            </Table.Row>
          )
        )}
      </Table.Body>
    </Table>
  );
}

interface IProps {
  findings: IGrypeFinding[];
}

interface IState {
  column: string | undefined;
  direction: Direction | undefined;
  sort(rows: IRow[]): IRow[];
}

interface IRow {
  name: string;
  vulnerability: string;
  severity: string;
  description: string;
}

interface IAction {
  type: "CHANGE_SORT";
  column: Column;
}

type Direction = "ascending" | "descending";
type Column = "name" | "vulnerability" | "severity" | "description";

function rows(findings: IGrypeFinding[]): IRow[] {
  return findings.map((f) => {
    const row: IRow = {
      name: `${f.artifact.name} (${f.artifact.version})`,
      vulnerability: f.vulnerability.id,
      severity: f.vulnerability.severity,
      description: f.vulnerability.description,
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
          case "name":
            return row.name.toLowerCase();
          case "vulnerability":
            return row.vulnerability.toLowerCase();
          case "severity":
            return severityNumber(row.severity);
          case "description":
            return row.description.toLowerCase();
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
