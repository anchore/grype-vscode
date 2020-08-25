import * as vscode from "vscode";
import fs = require("fs");
import { IGrypeFinding } from "../IGrypeFinding";
import { IMessage } from "../IMessage";

export class DetailsView {
  private readonly context: vscode.ExtensionContext;
  private readonly nonce: string;
  private panel: vscode.WebviewPanel | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.nonce = DetailsView.getNonce();
  }

  public open(): void {
    if (this.panel === null) {
      this.panel = vscode.window.createWebviewPanel(
        "grypeDetails",
        "Grype Details",
        vscode.ViewColumn.Active,
        {
          localResourceRoots: [vscode.Uri.file(this.context.extensionPath)],
          enableScripts: true,
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = null;
      });
    }

    this.panel.reveal();

    this.panel.webview.html = this.templateSubstitutions(
      fs.readFileSync(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "src",
          "ui",
          "webview-assets",
          "DetailsView.html"
        ).fsPath,
        "utf-8"
      )
    );
  }

  public async loadFindings(findings: IGrypeFinding[]): Promise<void> {
    if (this.panel) {
      const message: IMessage<IGrypeFinding[]> = {
        command: "update",
        payload: findings,
      };

      await this.panel.webview.postMessage(message);
    }
  }

  private static getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private uiDirectory(): vscode.Uri {
    return vscode.Uri.joinPath(this.context.extensionUri, "src", "ui").with({
      scheme: "vscode-resource",
    });
  }

  private bundleDirectory(): vscode.Uri {
    return vscode.Uri.joinPath(this.context.extensionUri, "dist").with({
      scheme: "vscode-resource",
    });
  }

  private templateSubstitutions(input: string): string {
    let cspSource = "";

    if (this.panel) {
      cspSource = this.panel.webview.cspSource;
    }

    const substitutions: { find: string; replaceWith: string }[] = [
      { find: "ui", replaceWith: this.uiDirectory().toString() },
      { find: "bundle", replaceWith: this.bundleDirectory().toString() },
      { find: "webview.cspSource", replaceWith: cspSource },
      { find: "nonce", replaceWith: this.nonce },
    ];

    let output = input;

    substitutions.forEach((s) => {
      output = output.split(`[[${s.find}]]`).join(s.replaceWith);
    });

    return output;
  }
}
