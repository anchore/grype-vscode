import * as vscode from "vscode";

export default class StatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private isAutomaticScanningEnabled: () => boolean;

  constructor(isAutomaticScanningEnabled: () => boolean) {
    const priority = 1000;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      priority
    );
    this.statusBarItem.command = "extension.launchStatusBarQuickPick";
    this.statusBarItem.show();

    this.isAutomaticScanningEnabled = isAutomaticScanningEnabled;
    this.updateEnabledState();
  }

  public updateEnabledState(): void {
    if (this.isAutomaticScanningEnabled()) {
      this.statusBarItem.tooltip = "Grype Vulnerability Scanner";
      this.statusBarItem.text = "$(ellipsis) Waiting for first scan";
    } else {
      this.statusBarItem.tooltip =
        "Automatic scanning is disabled. Click to enable.";
      this.statusBarItem.text = "$(plug) Disabled";
    }
  }

  public showScanning(): void {
    this.setTextIfEnabled("$(loading) Scanning...");
  }

  public showNoVulnerabilities(): void {
    this.setTextIfEnabled("$(check) No Vulnerabilities");
  }

  public showVulnerabilitiesFound(num: number): void {
    const noun = num === 1 ? "Vulnerability" : "Vulnerabilities";
    this.setTextIfEnabled(`$(alert) ${num} ${noun}`);
  }

  public showError(): void {
    this.setTextIfEnabled("$(error) Unable to scan");
  }

  private setTextIfEnabled(text: string): void {
    if (this.isAutomaticScanningEnabled()) {
      this.statusBarItem.text = text;
    }
  }
}
