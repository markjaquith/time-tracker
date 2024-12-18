import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import assert from "assert";

// CONFIG
const MINIMUM_LOGGING_SECONDS = 1;
const MAX_STATUS_BAR_LENGTH = 57;
const TRACKING_PREFIX = "TRACKING:";
const TRACKING_FILENAME = "time-tracking.md";

// STATE
let task: string | null = null;
let statusBar: vscode.StatusBarItem;
let timerInterval: NodeJS.Timeout | null = null;
let startTime: number | null = null;

// API
function isTracking(): boolean {
  return startTime !== null;
}

export function startTracking(taskName: string): void {
  if (isTracking()) {
    stopTracking();
  }

  startTime = Date.now();
  task = taskName;
  timerInterval = setInterval(updateStatusBar, 50);
  logTentativeTask(taskName, startTime);
  updateStatusBar();
}

export function stopTracking(): void {
  if (!isTracking()) {
    vscode.window.showInformationMessage("Not tracking a task");
    return;
  }

  if ((elapsedSeconds() ?? 0) < MINIMUM_LOGGING_SECONDS) {
    vscode.window.showInformationMessage(
      "Did not log task (less than 1 minute)"
    );
    resetTracking();
    updateStatusBar();
    return;
  }

  logTask(task ?? "", startTime ?? 0, elapsedSeconds() ?? 0).then(() => {
    resetTracking();
    updateStatusBar();
  });
}

function resetTracking() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  startTime = null;
  task = null;
}

function elapsedSeconds(): number | null {
  const now = Date.now();
  return isTracking() ? Math.floor((now - (startTime ?? now)) / 1000) : null;
}

function formatTaskForStatusBar(task: string | null): string {
  if (!task) {
    return "";
  }

  if (task.length > MAX_STATUS_BAR_LENGTH) {
    return task.substring(0, MAX_STATUS_BAR_LENGTH) + "...";
  }

  return task;
}

export function updateStatusBar() {
  statusBar ??= vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  if (isTracking()) {
    const time = formatTime(elapsedSeconds());
    statusBar.text = `$(stop-circle) ${time} ${formatTaskForStatusBar(task)}`;
    statusBar.command = "time-tracker.stopTracking";
    statusBar.tooltip = "Stop tracking";
  } else {
    statusBar.text = "$(record) 00:00:00";
    statusBar.command = "time-tracker.startTracking";
    statusBar.tooltip = "Start tracking";
  }

  statusBar.show();

  return statusBar;
}

function formatTime(seconds: number | null): string {
  if (!seconds || seconds < 1) {
    return "00:00:00";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

async function logTask(task: string, startTime: number, duration: number) {
  const logFilePath = getLogFilePath();

  // Create the date for the final output line.
  const startDate = new Date(startTime).toISOString().split("T")[0];
  console.log({ startDate });
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const formattedDuration = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  const finalEntry = `- ${startDate} ${formattedDuration} ${task}`;

  try {
    const logContent = await fs.promises.readFile(logFilePath, "utf8");
    const updatedLogContent = logContent.replace(
      makeTentativeTaskLine(task, startTime),
      finalEntry
    );
    await fs.promises.writeFile(logFilePath, updatedLogContent, "utf8");
    vscode.window.showInformationMessage(`Logged task: ${task}`);
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to finalize log entry: ${err}`);
  }
}

function getLogFilePath(): string {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  assert(workspaceFolders, "No workspace folders are open");

  return path.join(workspaceFolders[0].uri.fsPath, TRACKING_FILENAME);
}

async function logTentativeTask(task: string, startTime: number) {
  const logFilePath = getLogFilePath();
  const tentativeEntry = makeTentativeTaskLine(task, startTime) + "\n";

  try {
    await fs.promises.appendFile(logFilePath, tentativeEntry, "utf8");
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to write tentative log entry: ${err}`
    );
  }
}

function makeTentativeTaskLine(task: string, startTime: number): string {
  return `- ${TRACKING_PREFIX} ${startTime} ${task}`;
}

export async function restoreTrackingFromLog() {
  const logFilePath = getLogFilePath();

  try {
    const logContent = await fs.promises.readFile(logFilePath, "utf8");
    const lines = logContent.split("\n");
    const lastTentativeLine = lines
      .reverse()
      .find((line) => line.startsWith(`- ${TRACKING_PREFIX}`));

    if (lastTentativeLine) {
      const [, , timestampStr, ...taskParts] = lastTentativeLine.split(" ");
      const taskName = taskParts.join(" ");
      const timestamp = Number(timestampStr);

      if (!isNaN(timestamp)) {
        // Restore state
        startTime = timestamp;
        task = taskName;
        timerInterval = setInterval(updateStatusBar, 50);
        updateStatusBar();
        vscode.window.showInformationMessage(`Resumed tracking: ${taskName}`);
      } else {
        vscode.window.showErrorMessage(
          "Failed to restore tracking: invalid timestamp"
        );
      }
    }
  } catch (err) {
    // It's fine if the log file doesn't exist yet
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      vscode.window.showErrorMessage(`Failed to read log file: ${err}`);
    }
  }
}

export function canTrack(): boolean {
  return !!vscode.workspace.workspaceFolders;
}
