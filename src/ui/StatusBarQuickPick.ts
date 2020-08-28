import { QuickPickItem, window } from "vscode";

export class StatusBarQuickPick {
  public static readonly enableAutomaticScanningOption: QuickPickItem = {
    label: "$(rocket) Enable Automatic Scanning",
  };
  public static readonly disableAutomaticScanningOption: QuickPickItem = {
    label: "$(plug) Disable Automatic Scanning",
  };
  public static readonly scanWorkspaceOption: QuickPickItem = {
    label: "$(play) Scan Now",
  };
  public static readonly showVulnerabilityReportOption: QuickPickItem = {
    label: "$(output) Open Vulnerability Report",
  };

  private readonly isAutomaticScanningEnabled: boolean;
  private readonly areScanResultsAvailable: boolean;
  private readonly selectionHandler: (selectedItem: QuickPickItem) => void;

  constructor(
    isAutomaticScanningEnabled: boolean,
    areScanResultsAvailable: boolean,
    selectionHandler: (selectedItem: QuickPickItem) => void
  ) {
    this.isAutomaticScanningEnabled = isAutomaticScanningEnabled;
    this.areScanResultsAvailable = areScanResultsAvailable;
    this.selectionHandler = selectionHandler;
  }

  public async launch(): Promise<void> {
    const selectedItem = await window.showQuickPick(
      this.statusBarQuickPickItems(),
      {
        placeHolder: "Select an action",
      }
    );

    if (selectedItem) {
      this.selectionHandler(selectedItem);
    }
  }

  private statusBarQuickPickItems(): QuickPickItem[] {
    return this.isAutomaticScanningEnabled
      ? this.areScanResultsAvailable
        ? [
            StatusBarQuickPick.showVulnerabilityReportOption,
            StatusBarQuickPick.scanWorkspaceOption,
            StatusBarQuickPick.disableAutomaticScanningOption,
          ]
        : [
            StatusBarQuickPick.scanWorkspaceOption,
            StatusBarQuickPick.disableAutomaticScanningOption,
          ]
      : this.areScanResultsAvailable
      ? [
          StatusBarQuickPick.enableAutomaticScanningOption,
          StatusBarQuickPick.scanWorkspaceOption,
          StatusBarQuickPick.showVulnerabilityReportOption,
        ]
      : [
          StatusBarQuickPick.enableAutomaticScanningOption,
          StatusBarQuickPick.scanWorkspaceOption,
        ];
  }
}
