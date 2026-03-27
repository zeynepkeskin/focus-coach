import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 min in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [newDuration, setNewDuration] = useState(25); // minutes
const [showCompletedToday, setShowCompletedToday] = useState(false);
const [manualMinutes, setManualMinutes] = useState(25);
const formatMinutes = (seconds) => {
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
};

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));

    // If the deleted task is currently active → reset timer
    if (id === activeTaskId) {
      setActiveTaskId(null);
      setIsRunning(false);
      setTimeLeft(1500);
    }
  };

    // Load from localStorage on startup
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

 const getTodayCompletedTasks = () => {
  const today = new Date();

  return tasks.filter(task => {
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

 const finishSession = () => {
  setIsRunning(false);
  setSessionComplete(true);

  if (activeTaskId) {
    const timeSpent = (tasks.find(t => t.id === activeTaskId)?.duration || 1500) - timeLeft;

    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === activeTaskId) {
          return {
            ...task,
            completed: true,
            completedAt: new Date().toISOString(),

            // NEW:
            sessions: [
              ...(task.sessions || []),
              {
                date: new Date().toISOString(),
                duration: timeSpent
              }
            ]
          };
        }
        return task;
      })
    );
  }
  setTimeLeft(0);
};
const getTodayFocusTime = () => {
  const today = new Date();

  let total = 0;

  tasks.forEach(task => {
    if (!task.sessions) return;

    task.sessions.forEach(session => {
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishSession(); // ← reuse logic
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);


  const [newTask, setNewTask] = useState("");

  // Save to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Add task
  const addTask = () => {
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      title: newTask,
      duration: newDuration * 60, // store in seconds
      completed: false,
    };

    setTasks([...tasks, task]);
    setNewTask("");
  };

  // Toggle complete
  const toggleTask = (id) => {
  const updatedTasks = tasks.map(task => {
    if (task.id === id) {
      if (task.completed) {
        // unchecking → remove timestamp
        return { ...task, completed: false, completedAt: null };
      } else {
        // checking → add timestamp
        return { 
          ...task, 
          completed: true, 
          completedAt: new Date().toISOString() 
        };
      }
    }
    return task;
  });

  setTasks(updatedTasks);
};

  return (
    <div style={{ padding: "20px" }}>
      <h1>tbd</h1>

      {/* Input */}
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

      {/* Task List */}
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
            <button
              onClick={() => {
                if (isRunning) return; // block switching
                setSessionComplete(false);
                setActiveTaskId(task.id);
                setTimeLeft(task.duration || 1500);
                setIsRunning(true);
              }}
              disabled={isRunning && activeTaskId !== task.id}
            >
              Focus
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              style={{ marginLeft: "10px" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "20px" }}>
      <div>
  <input
    type="number"
    value={manualMinutes}
    onChange={(e) => setManualMinutes(Number(e.target.value))}
    style={{ width: "60px" }}
  />
  <button
    onClick={() => {
      setActiveTaskId(null); // not tied to a task
      setTimeLeft(manualMinutes * 60);
      setSessionComplete(false);
      setIsRunning(false);
    }}
  >
    Set Timer
  </button>
</div>
       <h2>
  Timer {activeTaskId ? "(Task Mode)" : "(Manual Mode)"}
</h2>

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
      {sessionComplete && (
        <div style={{ marginTop: "10px", color: "green", fontWeight: "bold" }}>
          Session Complete ✅
        </div>
      )}
     <div style={{ marginTop: "20px" }}>
     <h3>Focus Time Today: {formatMinutes(getTodayFocusTime())}</h3>
  <h3 
    onClick={() => setShowCompletedToday(prev => !prev)}
    style={{ cursor: "pointer" }}
  >
    Tasks Completed Today: {todayCompletedTasks.length}
  </h3>
  {showCompletedToday && (
  <ul>
    {todayCompletedTasks.map(task => (
      <li key={task.id}>
        {task.title}
      </li>
    ))}
  </ul>
)}
</div>
    </div>
  );
}

export default App;
