import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskList, setTaskList] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/tasks');
      setTaskList(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async () => {
    if (!taskTitle) return alert("Please enter a task!");
    try {
      await axios.post('http://localhost:5000/tasks', { 
        title: taskTitle, 
        description: "Sample description" 
      });
      setTaskTitle("");
      fetchTasks();
    } catch (err) { alert("Error adding task"); }
  };

  const toggleComplete = async (id) => {
    try {
      await axios.put(`http://localhost:5000/tasks/${id}`);
      fetchTasks();
    } catch (err) { alert("Error updating status"); }
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(`http://localhost:5000/tasks/${id}`, { title: editTitle });
      setIsEditing(null);
      fetchTasks();
    } catch (err) { alert("Error updating title"); }
  };

  const deleteTask = async (id) => {
    if (window.confirm("Delete this task permanently?")) {
      try {
        await axios.delete(`http://localhost:5000/tasks/${id}`);
        fetchTasks();
      } catch (err) { alert("Error deleting task"); }
    }
  };

  return (  
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.header}>📋 MERN Task Manager</h1>
        
        {/* Input Section */}
        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="What's the next goal?"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            style={styles.input}
          />
          <button onClick={addTask} style={styles.addButton}>Add Task</button>
        </div>

        <h2 style={styles.subHeader}>Your Tasks</h2>
        <ul style={styles.list}>
          {taskList.map((task) => (
            <li key={task._id} style={styles.listItem}>
              {isEditing === task._id ? (
                <div style={styles.editWrapper}>
                  <input 
                    style={styles.editInput}
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                  />
                  <button onClick={() => saveEdit(task._id)} style={styles.saveBtn}>Save</button>
                  <button onClick={() => setIsEditing(null)} style={styles.cancelBtn}>Cancel</button>
                </div>
              ) : (
                <>
                  <div style={styles.textWrapper} onClick={() => toggleComplete(task._id)}>
                    <span style={{
                      ...styles.taskText,
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? '#95a5a6' : '#2c3e50'
                    }}>
                      {task.title}
                    </span>
                    {task.completed ? <span style={styles.badgeDone}>Done</span> : <span style={styles.badgePending}>Pending</span>}
                  </div>
                  
                  <div style={styles.btnGroup}>
                    <button 
                      onClick={() => { setIsEditing(task._id); setEditTitle(task.title); }} 
                      style={styles.editBtn}
                    >Edit</button>
                    <button 
                      onClick={() => deleteTask(task._id)} 
                      style={styles.deleteBtn}
                    >Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        {taskList.length === 0 && <p style={styles.emptyMsg}>No tasks yet. Start by adding one!</p>}
      </div>
    </div>
  );
}

// Inline Styles Object
const styles = {
  container: { backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '50px 20px', display: 'flex', justifyContent: 'center' },
  card: { backgroundColor: '#fff', width: '100%', maxWidth: '600px', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  header: { textAlign: 'center', color: '#34495e', marginBottom: '30px', fontSize: '28px' },
  subHeader: { color: '#7f8c8d', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
  inputGroup: { display: 'flex', gap: '10px', marginBottom: '30px' },
  input: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '16px' },
  addButton: { padding: '12px 24px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  list: { listStyle: 'none', padding: 0 },
  listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', backgroundColor: '#fff', borderBottom: '1px solid #f1f1f1', transition: '0.3s' },
  textWrapper: { cursor: 'pointer', flex: 1 },
  taskText: { fontSize: '18px', marginRight: '10px' },
  badgeDone: { backgroundColor: '#2ecc71', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '10px' },
  badgePending: { backgroundColor: '#f1c40f', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '10px' },
  btnGroup: { display: 'flex', gap: '8px' },
  editBtn: { padding: '6px 12px', backgroundColor: '#ecf0f1', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  editWrapper: { display: 'flex', gap: '10px', width: '100%' },
  editInput: { flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #3498db' },
  saveBtn: { backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  emptyMsg: { textAlign: 'center', color: '#bdc3c7', marginTop: '20px' }
};

export default App;