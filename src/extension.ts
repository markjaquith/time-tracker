import * as vscode from "vscode";
import {
  canTrack,
  restoreTrackingFromLog,
  startTracking,
  stopTracking,
  updateStatusBar,
} from "./tracking";
import { TimeTrackerViewProvider } from "./TimeTrackerViewProvider";

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
export async function activate(context: vscode.ExtensionContext) {
  // Create the command mappings.
  const startCommand = vscode.commands.registerCommand(
    "time-tracker.startTracking",
    startTrackingCommand
  );
  const stopCommand = vscode.commands.registerCommand(
    "time-tracker.stopTracking",
    stopTrackingCommand
  );
  const timeTrackerViewProvider = new TimeTrackerViewProvider(
    context.extensionUri
  );
  const viewProvider = vscode.window.registerWebviewViewProvider(
    "timeTrackerLogs",
    timeTrackerViewProvider
  );
  const refreshCommand = vscode.commands.registerCommand(
    "time-tracker.refresh",
    () => timeTrackerViewProvider.refresh()
  );

  // Register the commands and the status bar.
  context.subscriptions.push(
    viewProvider,
    refreshCommand,
    updateStatusBar(),
    startCommand,
    stopCommand
  );

  // If we were tracking when the extension was deactivated, start tracking again.
  await restoreTrackingFromLog();
}

export function deactivate() {
  // stopTracking();
}
