import "./App.css";
import { useState, useEffect } from "react";

function App() {
  /* =========================
     STATE (CORE APP STATE)
  ========================= */

  const [activeTaskId, setActiveTaskId] = useState(null); // currently focused task
  const [timeLeft, setTimeLeft] = useState(1500); // timer (seconds)
  const [isRunning, setIsRunning] = useState(false); // timer running state
  const [sessionComplete, setSessionComplete] = useState(false); // session finished flag

  const [newDuration, setNewDuration] = useState(25); // task duration (minutes)
  const [manualMinutes, setManualMinutes] = useState(25); // manual timer input

  const [showCompletedToday, setShowCompletedToday] = useState(false); // toggle UI section

  const [mode, setMode] = useState("task"); // "task" or "manual"

  /* =========================
     FORMAT HELPERS
  ========================= */

  // Convert seconds → "X min"
  const formatMinutes = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  /* =========================
     TASK MANAGEMENT
  ========================= */

  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));

    // If deleting active task → reset timer
    if (id === activeTaskId) {
      setActiveTaskId(null);
      setIsRunning(false);
      setTimeLeft(1500);
    }
  };

  // Load tasks from localStorage on startup
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

  // Get tasks completed today
  const getTodayCompletedTasks = () => {
    const today = new Date();

    return tasks.filter((task) => {
      if (!task.completed || !task.completedAt) return false;

      const completedDate = new Date(task.completedAt);

      return (
        completedDate.getFullYear() === today.getFullYear() &&
        completedDate.getMonth() === today.getMonth() &&
        completedDate.getDate() === today.getDate()
      );
    });
  };

  const todayCompletedTasks = getTodayCompletedTasks();

  /* =========================
     TIMER CONTROLS
  ========================= */

  const startTimer = () => {
    if (timeLeft > 0) {
      setSessionComplete(false);
      setIsRunning(true);
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSessionComplete(false);
    setTimeLeft(1500);
  };

  // Format seconds → mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  /* =========================
     TIMER EFFECT (COUNTDOWN)
  ========================= */

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishSession(true); // ← pass flag
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  /* =========================
     SESSION / TIMER COMPLETION
  ========================= */

  const finishSession = (completedNaturally = false) => {
    setIsRunning(false);
    setSessionComplete(true);

    if (activeTaskId) {
      const taskDuration =
        tasks.find((t) => t.id === activeTaskId)?.duration || 1500;

      const timeSpent = completedNaturally
        ? taskDuration // full time
        : taskDuration - timeLeft; // partial

      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === activeTaskId) {
            return {
              ...task,
              completed: true,
              completedAt: new Date().toISOString(),
              sessions: [
                ...(task.sessions || []),
                {
                  date: new Date().toISOString(),
                  duration: timeSpent,
                },
              ],
            };
          }
          return task;
        }),
      );
    }

    setTimeLeft(0);
  };

  /* =========================
     ANALYTICS / STATS
  ========================= */

  // Calculate total focus time today
  const getTodayFocusTime = () => {
    const today = new Date();
    let total = 0;

    tasks.forEach((task) => {
      if (!task.sessions) return;

      task.sessions.forEach((session) => {
        const d = new Date(session.date);

        if (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        ) {
          total += session.duration;
        }
      });
    });

    return total;
  };

  /* =========================
     TASK INPUT STATE
  ========================= */

  const [newTask, setNewTask] = useState("");

  /* =========================
     PERSISTENCE
  ========================= */

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  /* =========================
     TASK ACTIONS
  ========================= */

  // Add new task
  const addTask = () => {
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      title: newTask,
      duration: newDuration * 60,
      completed: false,
    };

    setTasks([...tasks, task]);
    setNewTask("");
  };

  // Toggle task completion
  const toggleTask = (id) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        if (task.completed) {
          // unchecking → remove timestamp
          return { ...task, completed: false, completedAt: null };
        } else {
          // checking → add timestamp
          return {
            ...task,
            completed: true,
            completedAt: new Date().toISOString(),
          };
        }
      }
      return task;
    });

    setTasks(updatedTasks);
  };

  /* =========================
     UI
  ========================= */

  return (
    <div style={{ padding: "20px" }}>
      <h1>tbd</h1>

      {/* TASK INPUT */}
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter") addTask();
        }}
        type="text"
        placeholder="Enter a task"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
      />

      <input
        type="number"
        value={newDuration}
        onChange={(e) => setNewDuration(Number(e.target.value))}
        placeholder="Minutes"
        style={{ width: "60px", marginLeft: "10px" }}
      />

      <button onClick={addTask}>Add Task</button>

      {/* TASK LIST */}
      <ul>
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{
              backgroundColor:
                task.id === activeTaskId ? "#d1e7ff" : "transparent",
              padding: "8px",
              borderRadius: "6px",
              marginBottom: "5px",
            }}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />

            <span
              style={{
                textDecoration: task.completed ? "line-through" : "none",
                marginLeft: "8px",
              }}
            >
              {task.title}

              {/* Active task indicator */}
              {task.id === activeTaskId && (
                <span
                  style={{
                    marginLeft: "10px",
                    fontSize: "12px",
                    color: "blue",
                  }}
                >
                  (Focusing)
                </span>
              )}
            </span>

            {/* Start focus session */}
            <button
              onClick={() => {
                if (isRunning) return; // prevent switching mid-session
                setSessionComplete(false);
                setActiveTaskId(task.id);
                setTimeLeft(task.duration || 1500);
                setIsRunning(true);
              }}
              disabled={isRunning && activeTaskId !== task.id}
            >
              Focus
            </button>

            {/* Delete task */}
            <button
              onClick={() => deleteTask(task.id)}
              style={{ marginLeft: "10px" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {/* TIMER CONTROLS */}
      <h2>{mode === "task" ? "Task Timer" : "Manual Timer"}</h2>
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => {
            if (isRunning) return; // prevent switching mid-session
            setMode("task");
          }}
          disabled={mode === "task"}
        >
          Task Mode
        </button>

        <button
          onClick={() => {
            if (isRunning) return; // prevent switching mid-session
            setMode("manual");
          }}
          disabled={mode === "manual"}
          style={{ marginLeft: "10px" }}
        >
          Manual Mode
        </button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <div>
          {/* Manual timer input */}

          {mode === "manual" && (
            <div style={{ marginTop: "10px" }}>
              <input
                type="number"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(Number(e.target.value))}
                style={{ width: "60px" }}
              />
              <button
                onClick={() => {
                  setActiveTaskId(null);
                  setTimeLeft(manualMinutes * 60);
                  setSessionComplete(false);
                  setIsRunning(false);
                }}
              >
                Set Timer
              </button>
            </div>
          )}
        </div>
        <h3>{formatTime(timeLeft)}</h3>

        <button onClick={startTimer} disabled={isRunning}>
          Start
        </button>

        <button onClick={stopTimer} disabled={!isRunning}>
          Stop
        </button>

        <button onClick={resetTimer}>Reset</button>

        <button
          onClick={finishSession}
          disabled={!isRunning}
          style={{ marginLeft: "10px" }}
        >
          Finish Early
        </button>
      </div>

      {/* SESSION COMPLETE MESSAGE */}
      {sessionComplete && (
        <div style={{ marginTop: "10px", color: "green", fontWeight: "bold" }}>
          Session Complete ✅
        </div>
      )}

      {/* STATS */}
      <div style={{ marginTop: "20px" }}>
        <h3>Focus Time Today: {formatMinutes(getTodayFocusTime())}</h3>

        <h3
          onClick={() => setShowCompletedToday((prev) => !prev)}
          style={{ cursor: "pointer" }}
        >
          Tasks Completed Today: {todayCompletedTasks.length}
        </h3>

        {/* Toggle completed tasks list */}
        {showCompletedToday && (
          <ul>
            {todayCompletedTasks.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
