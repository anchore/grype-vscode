import * as vscode from "vscode";

export default class StatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private errorColor: vscode.ThemeColor;
  private normalColor: string | vscode.ThemeColor | undefined;

  constructor() {
    const priority: number = 1000;
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
    this.errorColor = new vscode.ThemeColor("grype.error");
    this.normalColor = this.statusBarItem.color;
  }

  public showUnknown(): void {
    this.statusBarItem.color = this.normalColor;
    this.statusBarItem.text = "$(question) Scanning...";
    this.statusBarItem.show();
  }

  public showNoVulnerabilities(): void {
    this.statusBarItem.color = this.normalColor;
    this.statusBarItem.text = "$(check) No Vulnerabilities";
    this.statusBarItem.show();
  }

  public showVulnerabilitiesFound(num: number): void {
        this.statusBarItem.color = this.errorColor;
    this.statusBarItem.text = `$(alert) ${num} Vulnerabilities`;
    this.statusBarItem.show();
  }
}
