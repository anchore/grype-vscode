import * as vscode from 'vscode';
import path = require("path");
import fs = require("fs");
import { config } from "./config";
import { ExecutableHandler } from "./ExecutableHandler";
import { determinePlatform } from './Platform';
import GrypeExtension from "./GrypeExtension";

function createExtensionStorage(context: vscode.ExtensionContext): string {
  if (context.globalStoragePath) {

    const root = path.resolve(context.globalStoragePath, "..");
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root);
    }
    if (!fs.existsSync(context.globalStoragePath)) {
      console.log("creating storage path");
      fs.mkdirSync(context.globalStoragePath);
    }
  }
  return context.globalStoragePath;
}

export function activate(context: vscode.ExtensionContext) {
  // set the extension storage path (create if it does not exist)
  const storagePath = createExtensionStorage(context);
  const execHandler = new ExecutableHandler(config, storagePath, determinePlatform());

	execHandler.storeGrypeApp().then(() => {
    console.log("grype extension activated");
  }).catch(
    console.error
  );

  const extension = new GrypeExtension(context);
  extension.register();
}

// this method is called when your extension is deactivated
export function deactivate() {}


// handler (ensure we have the correct grype and it's downloaded) -> grype class

class Grype {
  constructor() {
  }

  public async version() {
    // invoke the grype exe and get the current version
    // calls exec
  }

  public async scan(directory: string) {
    // invoke the grype exe and scan a given directory
    // resolves the grype exe by downloading or using whats there
    // calls exec
  }

  private async exec(cmd: string) {
  }


}
