import * as vscode from "vscode";
import { LogEntry, parseLogs } from "./tracking";

export class TimeTrackerViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {
    console.log("extensionUri", this.extensionUri);
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    console.log("resolveWebviewView");
    this._view = webviewView;

    // Set the webview options
    webviewView.webview.options = {
      enableScripts: true,
    };

    // Initial content
    this._updateWebviewContent();
  }

  async refresh() {
    this._updateWebviewContent();
  }

  displayDuration(duration: number): string {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }

  async _updateWebviewContent() {
    const logs = await parseLogs(); // Use the `parseLogs` function
    const html = this._generateHtml(logs);
    if (this._view) {
      this._view.webview.html = html;
    }
  }

  _generateHtml(logs: LogEntry[]): string {
    const logEntriesHtml = logs
      .map((log) => {
        return `<li><span>${log.date}</span><b>${this.displayDuration(
          log.duration ?? 0
        )}</b><span>${log.task}</span>`;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 0;
            margin: 0;
          }
          ul {
            padding: 10px;
          }
          li {
            margin-bottom: 8px;
						list-style: none;
						display: flex;
						gap: 0.5rem;
          }
        </style>
      </head>
      <body>
        <ul>${logEntriesHtml}</ul>
      </body>
      </html>
    `;
  }
}
