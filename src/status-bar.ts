import * as vscode from "vscode";

export default class StatusBar {
	private _statusBarItem: vscode.StatusBarItem;
	private _errorColor: vscode.ThemeColor;
	private _normalColor: string | vscode.ThemeColor | undefined;

	constructor() {
		const priority: number = 1000;
		this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
		this._errorColor = new vscode.ThemeColor("grype.error");
		this._normalColor = this._statusBarItem.color;
	}

	public showUnknown(): void {
		this._statusBarItem.color = this._normalColor;
		this._statusBarItem.text = "$(question) Scanning...";
		this._statusBarItem.show();
	}

	public showNoVulnerabilities(): void {
		this._statusBarItem.color = this._normalColor;
		this._statusBarItem.text = "$(check) No Vulnerabilities";
		this._statusBarItem.show();
	}

	public showVulnerabilitiesFound(num: number): void {
        this._statusBarItem.color = this._errorColor;
		this._statusBarItem.text = `$(alert) ${num} Vulnerabilities`;
		this._statusBarItem.show();
	}
}