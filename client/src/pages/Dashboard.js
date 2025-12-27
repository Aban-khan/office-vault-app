import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');

  // DATA
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]); 

  // FORMS
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState(''); // Default is now empty
  const [taskFile, setTaskFile] = useState(null);

  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projFiles, setProjFiles] = useState([]); 

  const [replyTexts, setReplyTexts] = useState({});

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) {
      navigate('/');
    } else {
      setCurrentUser(userInfo);
      // FIXED: Removed setAssignedTo(userInfo._id) so it doesn't default to Admin
      fetchData(userInfo.token);
    }
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const reqTasks = axios.get('/tasks', config);
      const reqProjects = axios.get('/projects', config);
      
      let reqUsers = Promise.resolve({ data: [] });
      let reqPending = Promise.resolve({ data: [] });

      if (userInfo.role === 'admin') {
          reqUsers = axios.get('/users', config); 
          reqPending = axios.get('/auth/pending', config); 
      }

      const [resTasks, resProjects, resUsers, resPending] = await Promise.all([
        reqTasks, reqProjects, reqUsers, reqPending
      ]);

      setTasks(resTasks.data);
      setProjects(resProjects.data);
      if (userInfo.role === 'admin') {
          setEmployees(resUsers.data);
          setPendingUsers(resPending.data);
      }
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  // --- HANDLERS ---

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return alert('Title required');
    
    // FIXED: Force user to select an employee
    if (!assignedTo) return alert('Please select an employee'); 

    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const formData = new FormData();
      formData.append('title', taskTitle);
      formData.append('description', taskDesc);
      formData.append('priority', priority);
      formData.append('assignedTo', assignedTo);
      if (taskFile) formData.append('file', taskFile);
      
      const { data } = await axios.post('/tasks', formData, config);
      setTasks([...tasks, data]);
      
      // Reset Form
      setTaskTitle(''); 
      setTaskDesc(''); 
      setTaskFile(null); 
      setAssignedTo(''); // Reset dropdown to empty
      
      alert('Task Assigned!');
    } catch (error) {
      alert('Error creating task');
    }
  };

  const handleApproveUser = async (id) => {
    try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        await axios.put(`/auth/approve/${id}`, {}, config);
        alert('User Approved!');
        fetchData(currentUser.token); 
    } catch (error) {
        alert('Error approving user');
    }
  };

  const handleRejectUser = async (id) => {
    if(!window.confirm("Reject and delete this user request?")) return;
    try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        await axios.delete(`/auth/reject/${id}`, config);
        fetchData(currentUser.token);
    } catch (error) {
        alert('Error rejecting user');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projTitle || projFiles.length === 0) return alert('Title and at least one File are required');
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const formData = new FormData();
      formData.append('title', projTitle);
      formData.append('description', projDesc);
      for (let i = 0; i < projFiles.length; i++) {
        formData.append('files', projFiles[i]);
      }
      const { data } = await axios.post('/projects', formData, config);
      setProjects([data, ...projects]); 
      setProjTitle(''); setProjDesc(''); setProjFiles([]); 
      document.getElementById('project-file-input').value = ""; 
      alert('Project Submitted!');
    } catch (error) {
      alert('Error submitting project');
    }
  };

  const handleAddFileToProject = async (projectId, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const { data } = await axios.put(`/projects/${projectId}/add`, formData, config);
      setProjects(projects.map(p => p._id === projectId ? data : p));
      alert('File added successfully!');
    } catch (error) {
      alert('Error adding file');
    }
  };

  const handleDeleteFile = async (projectId, filePath) => {
    if(!window.confirm("Delete this specific file?")) return;
    try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        const { data } = await axios.put(`/projects/${projectId}/remove-file`, { filePath }, config);
        setProjects(projects.map(p => p._id === projectId ? data : p));
    } catch (error) {
        alert('Failed to delete file');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.put(`/tasks/${taskId}`, { status: newStatus }, config);
    } catch (error) {
      fetchData(currentUser.token);
    }
  };

  const handleSendReply = async (taskId) => {
    const message = replyTexts[taskId];
    if (!message) return alert("Please type a message first");
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const { data } = await axios.put(`/tasks/${taskId}`, { employeeReply: message }, config);
      setTasks(tasks.map(t => t._id === taskId ? data : t));
      setReplyTexts({ ...replyTexts, [taskId]: '' });
      alert("Reply Sent to Admin!");
    } catch (error) {
      console.error(error);
      alert("Failed to send reply");
    }
  };

  const handleDeleteTask = async (id) => {
    if(!window.confirm("Delete this task?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.delete(`/tasks/${id}`, config);
      setTasks(tasks.filter(t => t._id !== id)); 
    } catch (error) {
      alert('Error deleting task');
    }
  };

  const handleDeleteProject = async (id) => {
    if(!window.confirm("Delete this ENTIRE project?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.delete(`/projects/${id}`, config);
      setProjects(projects.filter(p => p._id !== id)); 
    } catch (error) {
      alert('Error deleting project');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  const handleFileSelect = (e) => {
    setProjFiles(e.target.files); 
  };
  
  const getFileName = (path) => {
    if (!path) return 'File';
    const serverFileName = path.split(/[/\\]/).pop(); 
    const parts = serverFileName.split('-');
    if (parts.length > 1) return parts.slice(1).join('-'); 
    return serverFileName;
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="p-4 text-white bg-blue-600 shadow-md">
        <div className="container flex justify-between items-center mx-auto">
          <h1 className="text-xl font-bold">Office Vault</h1>
          <div className="flex items-center gap-4">
            <span className="font-semibold">{isAdmin ? '👑 Admin: ' : '👤 Staff: '} {currentUser?.name}</span>
            <button onClick={handleLogout} className="px-3 py-1 text-sm bg-red-500 rounded hover:bg-red-600">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container p-6 mx-auto">
        
        {/* TABS */}
        <div className="flex mb-6 border-b-2 border-gray-300">
          <button className={`px-6 py-2 font-bold ${activeTab === 'tasks' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500'}`} onClick={() => setActiveTab('tasks')}>📋 Tasks</button>
          <button className={`px-6 py-2 font-bold ${activeTab === 'projects' ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-500'}`} onClick={() => setActiveTab('projects')}>🚀 Projects</button>
        </div>

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {isAdmin && (
              <div className="space-y-6 lg:col-span-1">
                <div className="p-6 bg-white rounded shadow-md">
                  <h3 className="mb-4 text-lg font-bold text-gray-700">Assign New Task</h3>
                  <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
                    <input type="text" placeholder="Title" className="p-2 border rounded" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                    <input type="text" placeholder="Description" className="p-2 border rounded" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
                    
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="p-2 border rounded">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                    
                    {/* FIXED: Dropdown now has a default empty option */}
                    <select 
                        value={assignedTo} 
                        onChange={(e) => setAssignedTo(e.target.value)} 
                        className="p-2 border rounded bg-gray-50"
                    >
                        <option value="">-- Select Employee --</option>
                        {employees.map(e => (
                            <option key={e._id} value={e._id}>{e.name}</option>
                        ))}
                    </select>

                    <input type="file" className="text-sm" onChange={(e) => setTaskFile(e.target.files[0])} />
                    <button className="py-2 text-white bg-green-600 rounded">Create Task</button>
                  </form>
                </div>

                {/* PENDING APPROVALS */}
                <div className="p-6 mt-6 bg-white rounded shadow-md border-t-4 border-orange-500">
                  <h3 className="mb-4 text-lg font-bold text-gray-700">🔔 Pending Requests</h3>
                  {pendingUsers.length === 0 ? (
                      <p className="text-sm text-gray-500">No new signups.</p>
                  ) : (
                      <ul className="space-y-3">
                          {pendingUsers.map(user => (
                              <li key={user._id} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                                  <div>
                                      <p className="text-sm font-bold">{user.name}</p>
                                      <p className="text-xs text-gray-500">{user.email}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleApproveUser(user._id)} className="text-green-600 font-bold text-lg" title="Approve">✅</button>
                                      <button onClick={() => handleRejectUser(user._id)} className="text-red-600 font-bold text-lg" title="Reject">❌</button>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  )}
                </div>
              </div>
            )}
            
            <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
              <h2 className="mb-6 text-2xl font-bold text-gray-800">Task Board</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map(task => (
                  <div key={task._id} className="relative p-4 bg-white border rounded shadow flex flex-col justify-between">
                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l ${task.status === 'Completed' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    
                    {isAdmin && (
                      <button onClick={() => handleDeleteTask(task._id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600 font-bold" title="Delete Task">🗑️</button>
                    )}

                    <div>
                      <h3 className="font-bold mr-6">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      {task.file && <a href={`https://office-vault-app.onrender.com/api/${task.file.replace('\\','/')}`} target="_blank" rel="noreferrer" className="text-blue-600 text-sm block mt-1">📎 Attachment</a>}
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-xs mb-2">
                        <span className="font-bold text-gray-400">ASSIGNED TO:</span> <span className="text-blue-600">{task.assignedTo?.name}</span>
                      </div>
                      
                      {/* STATUS */}
                      {isAdmin ? (
                          <div className={`w-full p-2 text-center rounded text-sm font-bold border ${task.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200'}`}>Status: {task.status || 'Pending'}</div>
                      ) : (
                        <select value={task.status||'Pending'} onChange={(e)=>handleStatusChange(task._id, e.target.value)} className="w-full text-sm border rounded p-1 font-bold bg-white"><option>Pending</option><option>In Progress</option><option>Completed</option></select>
                      )}

                      {/* REPLY BOX */}
                      <div className="mt-3 border-t pt-2">
                        {isAdmin && (
                            <div className="bg-gray-50 p-2 rounded border">
                                <span className="text-xs font-bold text-gray-500 block">Message from Staff:</span>
                                <p className="text-sm text-gray-800 italic">{task.employeeReply || "No message."}</p>
                            </div>
                        )}
                        {!isAdmin && (
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500">Message to Admin:</label>
                                {task.employeeReply && <div className="text-xs text-gray-400 italic">Sent: "{task.employeeReply}"</div>}
                                <textarea className="w-full p-2 border rounded text-sm" rows="2" placeholder="Type update here..." value={replyTexts[task._id] || ''} onChange={(e) => setReplyTexts({ ...replyTexts, [task._id]: e.target.value })} />
                                <button onClick={() => handleSendReply(task._id)} className="self-end bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700">Send Msg</button>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="p-6 bg-white rounded shadow-md border-t-4 border-purple-600">
                <h3 className="mb-4 text-lg font-bold text-gray-700">🚀 Submit New Project</h3>
                <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-gray-500">Project Name</label>
                  <input type="text" placeholder="e.g. Q1 Marketing Plan" className="p-2 border rounded" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} />
                  <label className="text-xs font-bold text-gray-500">Details</label>
                  <textarea rows="3" placeholder="Description..." className="p-2 border rounded" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
                  <label className="text-xs font-bold text-gray-500">Initial Files</label>
                  <input id="project-file-input" type="file" className="text-sm" multiple onChange={handleFileSelect} />
                  <small className="text-gray-400 text-xs">You can select multiple files</small>
                  <button className="py-2 mt-2 text-white bg-purple-600 rounded hover:bg-purple-700">Submit Project</button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h2 className="mb-6 text-2xl font-bold text-gray-800">Project Submissions</h2>
              <div className="project-list-container">
                {projects.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#8d6e63', marginTop: '20px' }}>No projects uploaded yet.</p>
                ) : (
                    projects.map(proj => (
                    <div key={proj._id} className="project-card">
                        <div className="project-header">
                          <h3 className="project-title">{proj.title}</h3>
                          {isAdmin && (
                              <button className="delete-btn-icon" onClick={() => handleDeleteProject(proj._id)} title="Delete Project">❌</button>
                          )}
                        </div>
                        <div className="project-body"><p className="project-desc">{proj.description || "No description provided."}</p></div>
                        <div className="project-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
                            {proj.files && proj.files.map((file, index) => (
                                <div key={index} style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #795548', borderRadius: '50px', padding: '0 5px 0 12px', background: '#FFF8E7', fontSize: '0.85rem', gap: '8px' }}>
                                    <a href={`https://office-vault-app.onrender.com/api/${file.replace('\\','/')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#795548', fontWeight: 'bold' }} title={getFileName(file)}>📄 {getFileName(file)}</a>
                                    {isAdmin && (<button onClick={() => handleDeleteFile(proj._id, file)} style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', borderLeft: '1px solid #D7CCC8' }} title="Delete this file">✖</button>)}
                                </div>
                            ))}
                            {!proj.files && proj.file && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #795548', borderRadius: '50px', padding: '0 5px 0 12px', background: '#FFF8E7' }}>
                                    <a href={`https://office-vault-app.onrender.com/api/${proj.file.replace('\\','/')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#795548', fontWeight: 'bold', marginRight: '8px' }}>📄 {getFileName(proj.file)}</a>
                                </div>
                            )}
                            <label htmlFor={`upload-${proj._id}`} className="view-file-btn" style={{ cursor: 'pointer', borderStyle: 'dashed', backgroundColor: '#fff', color: '#795548' }}>➕ Add File</label>
                            <input id={`upload-${proj._id}`} type="file" multiple style={{ display: 'none' }} onChange={(e) => handleAddFileToProject(proj._id, e)} />
                          </div>
                          <div className="submitted-info" style={{ width: '100%', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                              <strong>Submitted by:</strong> {proj.createdBy?.name || "Unknown"} 
                              <span style={{float:'right'}}>{new Date(proj.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                    </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;