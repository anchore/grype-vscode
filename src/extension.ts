import * as vscode from "vscode";
import { config } from "./config";
import { determinePlatform } from "./Platform";
import GrypeExtension from "./GrypeExtension";

export async function activate(context: vscode.ExtensionContext) {
  const extension = new GrypeExtension(context, config, determinePlatform());

  try {
    await extension.activate();
    console.log("grype extension activated");
  } catch (e) {
    console.error(e);
    console.error("unsuccessful grype extension activation");
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
