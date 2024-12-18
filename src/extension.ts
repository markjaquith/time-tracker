import * as vscode from "vscode";
import { startTracking, stopTracking, updateStatusBar } from "./tracking";

// COMMANDS
function startTrackingCommand() {
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
  console.log('"time-tracker" extension is now active');

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
