import StatusBar from "./StatusBar";
import * as vscode from "vscode";

export default class GrypeExtension {
  private outputChannel: vscode.OutputChannel;
  private context: vscode.ExtensionContext;
  private statusBar: StatusBar;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel("Grype");
    this.statusBar = new StatusBar();
    this.showEnabledState();
    this.statusBar.showUnknown();
  }

  public register(): void {
    vscode.commands.registerCommand("extension.enableGrype", () => {
      this.isEnabled = true;
    });

    vscode.commands.registerCommand("extension.disableGrype", () => {
      this.isEnabled = false;
    });

    // create a watcher that uses glob from grype
    // implies we ask grype (syft) for cataloger glob patterns it will use.
    const watcher = vscode.workspace.createFileSystemWatcher("**/*", false, false, false);

    watcher.onDidChange((uri: vscode.Uri) => {
      this.handleFileChangeEvent(uri);
    });
  }

  public showEnabledState(): void {
    this.outputChannel.appendLine(`Grype ${this.isEnabled ? "enabled" : "disabled"}.`);
  }

  public showOutputMessage(message: string): void {
    this.outputChannel.appendLine(message);
  }

  public showVulnerabilities(num: number): void {
    if (num === 0) {
      this.statusBar.showNoVulnerabilities();
    } else {
      this.statusBar.showVulnerabilitiesFound(num);
    }
  }

  public handleFileChangeEvent(documentUri: vscode.Uri): void {
    console.log("grype file event:", documentUri);
    // low-pass event filter
    //    -
    // invoking grype.scan()
    // updating UI with results
  }

  public get isEnabled(): boolean {
    return !!this.context.globalState.get("isEnabled", true);
  }

  public set isEnabled(value: boolean) {
    this.context.globalState.update("isEnabled", value);
    this.showEnabledState();
  }

}
