
const vscode = require('vscode');

// this method is called when the extension is activated

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('The "grype-vscode" extension is now active.');

	var outputChannel = vscode.window.createOutputChannel("Grype Scan");

	const projectPath = vscode.workspace.rootPath;

	if (projectPath === undefined) {
	  vscode.window.showErrorMessage("grype must have a project directory to scan");
	  return;
	}

	let disposable = vscode.commands.registerCommand('grype-vscode.scan', function () {

		/**
		 * TODO:
		 * 
		 * - check to make sure grype is installed
		 * - update the database on registration, skip it on scan time
		 * 
		 */

 		var cp = require('child_process')

		try {

			/**
			 * TODO:
			 * 
			 * - better handle the case where there are no vulns
			 * - figure out how to show progress along the way?
			 * 
			 */

			var output = cp.execSync('cd ' + projectPath.toString() + '; grype dir://.').toString();
			outputChannel.show();
	        outputChannel.appendLine(output);
		} catch (result) {
			vscode.window.showErrorMessage("grype failed to run: " + result.status);
			return result.stdout.toString();
		}

		/**
		 * TODO:
		 * 
		 * - report the number of packages scanned
		 * 
		 */

		vscode.window.showInformationMessage('Scan with grype complete.');
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
