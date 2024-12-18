import { time } from "console";
import * as vscode from "vscode";

// STATE
let tracking = false;
let task: string | null = null;
let statusBar: vscode.StatusBarItem;
let timerInterval: NodeJS.Timeout | null = null;
let startTime: number | null = null;

// API
function isTracking(): boolean {
  return tracking;
}

function setTracking(taskName: string | null) {
  tracking = taskName !== null;
  task = taskName;
  updateStatusBar();
  if (tracking) {
    startTime = Date.now();
    timerInterval = setInterval(updateStatusBar, 50);
  } else {
    stopTimer();
    startTime = null;
  }
  console.log("Tracking: " + (taskName ?? "null"));
}

export function startTracking(taskName: string): void {
  if (isTracking()) {
    vscode.window.showInformationMessage("Already tracking a task");
    return;
  }
  setTracking(taskName);
}

export function stopTracking(): void {
  if (!isTracking()) {
    vscode.window.showInformationMessage("Not tracking a task");
    return;
  }
  setTracking(null);
}

function elapsedSeconds(): number | null {
  const now = Date.now();
  return isTracking() ? Math.floor((now - (startTime ?? now)) / 1000) : null;
}

export function updateStatusBar() {
  statusBar ??= vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  if (isTracking()) {
    const time = formatTime(elapsedSeconds());
    statusBar.text = `$(stop-circle) ${time} ${task}`;
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

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
