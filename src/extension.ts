import * as vscode from "vscode";
import {
  canTrack,
  startTracking,
  stopTracking,
  updateStatusBar,
} from "./tracking";

// COMMANDS
function startTrackingCommand() {
  if (!canTrack()) {
    // Tell the user they need to be in a workspace.
    vscode.window.showInformationMessage(
      "Please open a folder or a workspace to track your time"
    );
    return;
  }
  vscode.window.showInputBox({ prompt: "Enter task name" }).then((task) => {
    if (task) {
      startTracking(task);
    }
  });
}

function stopTrackingCommand() {
  stopTracking();
}

// VS CODE WIRING
export function activate(context: vscode.ExtensionContext) {
  // Create the command mappings.
  const startCommand = vscode.commands.registerCommand(
    "time-tracker.startTracking",
    startTrackingCommand
  );
  const stopCommand = vscode.commands.registerCommand(
    "time-tracker.stopTracking",
    stopTrackingCommand
  );

  // Register the commands and the status bar.
  context.subscriptions.push(updateStatusBar(), startCommand, stopCommand);
}

export function deactivate() {
  stopTracking();
}
