import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const [newDuration, setNewDuration] = useState(25);
  const [manualMinutes, setManualMinutes] = useState(25);

  const [showCompletedToday, setShowCompletedToday] = useState(false);
  const [mode, setMode] = useState("task");

  /* =========================
     TASK MANAGEMENT
  ========================= */

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));

    if (id === activeTaskId) {
      setActiveTaskId(null);
      setIsRunning(false);
      setTimeLeft(1500);
    }
  };

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

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

  const stopTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setSessionComplete(false);

    if (activeTaskId) {
      // Reset to the selected task's duration
      const task = tasks.find((t) => t.id === activeTaskId);
      setTimeLeft(task?.duration || 1500);
    } else {
      // Manual mode
      setTimeLeft(manualMinutes * 60);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  /* =========================
     TIMER EFFECT
  ========================= */

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  /* =========================
     SESSION COMPLETION
  ========================= */

  const finishSession = (completedNaturally = false) => {
    if (!isRunning) return;

    setIsRunning(false);
    setSessionComplete(true);

    if (activeTaskId) {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === activeTaskId) {
            return {
              ...task,
              completed: true,
              completedAt: new Date().toISOString(),
            };
          }
          return task;
        }),
      );
    }

    setTimeLeft(0);
  };

  /* =========================
     TASK INPUT
  ========================= */

  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

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

  const toggleTask = (id) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        if (task.completed) {
          return { ...task, completed: false, completedAt: null };
        } else {
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
    <div className="app-container">
      <h1>TaskFlow</h1>

      {/* TASK INPUT */}
      <div className="task-input card">
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
          className="duration-input"
        />

        <button className="primary-btn" onClick={addTask}>Add Task</button>
      </div>

      {/* TASK LIST */}
      <ul className="task-list card">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`task-item ${task.id === activeTaskId ? "active" : ""}`}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />

            <span className={task.completed ? "completed" : ""}>
              {task.title}
              {task.id === activeTaskId && (
                <span className="focusing-label">(Focusing)</span>
              )}
            </span>

            <button
              onClick={() => {
                if (isRunning) return;
                setSessionComplete(false);
                setActiveTaskId(task.id);
                setTimeLeft(task.duration || 1500);
                setIsRunning(true);
              }}
              disabled={isRunning && activeTaskId !== task.id}
              className="secondary-btn"
            >
              Focus
            </button>

            <button onClick={() => deleteTask(task.id)} className="danger-btn">
              Delete
            </button>
          </li>
        ))}
      </ul>

      {/* TIMER */}
      <h2>{mode === "task" ? "Task Timer" : "Manual Timer"}</h2>

      <div className="mode-buttons">
        <button
          onClick={() => !isRunning && setMode("task")}
          disabled={mode === "task"}
        >
          Task Mode
        </button>

        <button
          onClick={() => !isRunning && setMode("manual")}
          disabled={mode === "manual"}
        >
          Manual Mode
        </button>
      </div>

      {mode === "manual" && (
        <div className="manual-timer">
          <input
            type="number"
            value={manualMinutes}
            onChange={(e) => setManualMinutes(Number(e.target.value))}
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

      <h1 className="timer-display card">{formatTime(timeLeft)}</h1>

      <div className="timer-buttons">
        <button className="primary-btn" onClick={startTimer} disabled={isRunning}>
          Start
        </button>
        <button className="danger-btn" onClick={stopTimer} disabled={!isRunning}>
          Stop
        </button>
        <button className="secondary-btn" onClick={resetTimer}>Reset</button>
        <button  className="primary-btn" onClick={finishSession} disabled={!isRunning || timeLeft === 0}>
          Finish Early
        </button>
      </div>

      {sessionComplete && (
        <div className="session-complete">Session Complete ✅</div>
      )}

      {/* TASK STATS */}
      <div className="stats card">
        <h3
          onClick={() => setShowCompletedToday((prev) => !prev)}
          className="clickable"
        >
          Tasks Completed Today: {todayCompletedTasks.length}
        </h3>

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
