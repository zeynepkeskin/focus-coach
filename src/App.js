import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 min in seconds
  const [isRunning, setIsRunning] = useState(false);

  const [newDuration, setNewDuration] = useState(25); // minutes

  const deleteTask = (id) => {
  setTasks(tasks.filter(task => task.id !== id));

  // If the deleted task is currently active → reset timer
  if (id === activeTaskId) {
    setActiveTaskId(null);
    setIsRunning(false);
    setTimeLeft(1500);
  }
};

  const startTimer = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
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
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Load from localStorage on startup
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

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
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    );

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
          <li key={task.id}>
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
            </span>
            <button
              onClick={() => {
                setActiveTaskId(task.id);
                setTimeLeft(task.duration);
                setIsRunning(true);
              }}
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
        <h2>Timer</h2>

        <h3>{formatTime(timeLeft)}</h3>

        <button onClick={startTimer} disabled={isRunning}>
          Start
        </button>
        <button onClick={stopTimer} disabled={!isRunning}>
          Stop
        </button>
        <button onClick={resetTimer}>Reset</button>
      </div>
    </div>
  );
}

export default App;
