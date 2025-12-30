import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  const [assignedTo, setAssignedTo] = useState('');
  const [taskFile, setTaskFile] = useState(null);

  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projFiles, setProjFiles] = useState([]); 

  const [replyTexts, setReplyTexts] = useState({});

  // Use Ref to track previous task count for notifications
  const prevTaskCount = useRef(0);

  const API_BASE = 'https://office-vault-app.onrender.com/api';

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) {
      navigate('/');
    } else {
      setCurrentUser(userInfo);
      fetchData(userInfo.token);
      
      // Request Notification Permission on Load
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }

      // 🔥 AUTO-REFRESH: Check for new tasks every 30 seconds
      const interval = setInterval(() => {
        fetchData(userInfo.token, true); // true = quiet mode (no loading spinner)
      }, 30000);

      return () => clearInterval(interval); // Cleanup on close
    }
  }, [navigate]);

  const fetchData = async (token, isAutoRefresh = false) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const reqTasks = axios.get(`${API_BASE}/tasks`, config);
      const reqProjects = axios.get(`${API_BASE}/projects`, config);
      
      let reqUsers = Promise.resolve({ data: [] });
      let reqPending = Promise.resolve({ data: [] });

      if (userInfo.role === 'admin') {
          reqUsers = axios.get(`${API_BASE}/users`, config); 
          reqPending = axios.get(`${API_BASE}/auth/pending`, config); 
      }

      const [resTasks, resProjects, resUsers, resPending] = await Promise.all([
        reqTasks, reqProjects, reqUsers, reqPending
      ]);

      // 🔔 NOTIFICATION LOGIC
      // If we have MORE tasks now than before, send a notification
      if (resTasks.data.length > prevTaskCount.current && prevTaskCount.current > 0) {
        // Send Phone/Desktop Notification
        new Notification("Highrise Vault", { 
           body: "📢 New Task Assigned!", 
           icon: "/logo192.png",
           vibrate: [200, 100, 200]
        });
        // Play a sound (optional, browsers block this sometimes)
        // const audio = new Audio('/notification.mp3'); audio.play().catch(e=>{});
        
        toast("New Task Received!", { icon: '🔔', duration: 5000 });
      }

      // Update the reference tracker
      prevTaskCount.current = resTasks.data.length;

      setTasks(resTasks.data);
      setProjects(resProjects.data);
      if (userInfo.role === 'admin') {
          setEmployees(resUsers.data);
          setPendingUsers(resPending.data);
      }
    } catch (error) {
      if (!isAutoRefresh) console.error('Error fetching data', error);
    }
  };

  // --- HANDLERS ---

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return toast.error('Task Title is required');
    if (!assignedTo) return toast.error('Please select an employee'); 

    const loadToast = toast.loading('Assigning Task...');

    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const formData = new FormData();
      formData.append('title', taskTitle);
      formData.append('description', taskDesc);
      formData.append('priority', priority);
      formData.append('assignedTo', assignedTo);
      if (taskFile) formData.append('file', taskFile);
      
      const { data } = await axios.post(`${API_BASE}/tasks`, formData, config);
      
      if (assignedTo === 'all') {
          toast.success('Task Assigned to Everyone! 📢', { id: loadToast });
      } else {
          setTasks([...tasks, data]);
          toast.success('Task Assigned Successfully!', { id: loadToast });
      }
      fetchData(currentUser.token); // Refresh immediately
      setTaskTitle(''); setTaskDesc(''); setTaskFile(null); setAssignedTo(''); 

    } catch (error) {
      console.error(error);
      toast.error('Failed to create task', { id: loadToast });
    }
  };

  const handleApproveUser = async (id) => {
    try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        await axios.put(`${API_BASE}/auth/approve/${id}`, {}, config);
        toast.success('User Approved!');
        fetchData(currentUser.token); 
    } catch (error) {
        toast.error('Error approving user');
    }
  };

  const handleRejectUser = async (id) => {
    if(!window.confirm("Reject and delete this user request?")) return;
    try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        await axios.delete(`${API_BASE}/auth/reject/${id}`, config);
        toast.success('User Rejected');
        fetchData(currentUser.token);
    } catch (error) {
        toast.error('Error rejecting user');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projTitle || projFiles.length === 0) return toast.error('Title and 1 File required');
    
    const loadToast = toast.loading('Uploading Project...');
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const formData = new FormData();
      formData.append('title', projTitle);
      formData.append('description', projDesc);
      for (let i = 0; i < projFiles.length; i++) {
        formData.append('files', projFiles[i]);
      }
      const { data } = await axios.post(`${API_BASE}/projects`, formData, config);
      setProjects([data, ...projects]); 
      setProjTitle(''); setProjDesc(''); setProjFiles([]); 
      document.getElementById('project-file-input').value = ""; 
      toast.success('Project Submitted!', { id: loadToast });
    } catch (error) {
      toast.error('Error submitting project', { id: loadToast });
    }
  };

  const handleAddFileToProject = async (projectId, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const loadToast = toast.loading('Adding File...');
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const { data } = await axios.put(`${API_BASE}/projects/${projectId}/add`, formData, config);
      setProjects(projects.map(p => p._id === projectId ? data : p));
      toast.success('File added!', { id: loadToast });
    } catch (error) {
      toast.error('Error adding file', { id: loadToast });
    }
  };

  const handleDeleteFile = async (projectId, filePath) => {
    if(!window.confirm("Delete this specific file?")) return;
    try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        const { data } = await axios.put(`${API_BASE}/projects/${projectId}/remove-file`, { filePath }, config);
        setProjects(projects.map(p => p._id === projectId ? data : p));
        toast.success('File deleted');
    } catch (error) {
        toast.error('Failed to delete file');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    toast.success(`Status updated to ${newStatus}`);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.put(`${API_BASE}/tasks/${taskId}`, { status: newStatus }, config);
    } catch (error) {
      fetchData(currentUser.token);
    }
  };

  const handleSendReply = async (taskId) => {
    const message = replyTexts[taskId];
    if (!message) return toast.error("Please type a message first");
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const { data } = await axios.put(`${API_BASE}/tasks/${taskId}`, { employeeReply: message }, config);
      setTasks(tasks.map(t => t._id === taskId ? data : t));
      setReplyTexts({ ...replyTexts, [taskId]: '' });
      toast.success("Reply Sent to Admin!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reply");
    }
  };

  const handleDeleteTask = async (id) => {
    if(!window.confirm("Delete this task?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.delete(`${API_BASE}/tasks/${id}`, config);
      setTasks(tasks.filter(t => t._id !== id)); 
      toast.success('Task Deleted');
    } catch (error) {
      toast.error('Error deleting task');
    }
  };

  const handleDeleteProject = async (id) => {
    if(!window.confirm("Delete this ENTIRE project?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.delete(`${API_BASE}/projects/${id}`, config);
      setProjects(projects.filter(p => p._id !== id)); 
      toast.success('Project Deleted');
    } catch (error) {
      toast.error('Error deleting project');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
    toast('Logged out successfully', { icon: '👋' });
  };

  const handleFileSelect = (e) => {
    setProjFiles(e.target.files); 
  };
  
  const getFileName = (path) => {
    if (!path) return 'File';
    // Handle Cloudinary Paths
    const serverFileName = path.split(/[/\\]/).pop(); 
    return serverFileName.length > 20 ? serverFileName.substring(0, 15) + '...' : serverFileName;
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#EFEBE9]">
      <nav className="p-4 text-white bg-[#3E2723] shadow-md">
        <div className="container flex justify-between items-center mx-auto">
          <h1 className="text-xl font-bold font-serif tracking-wide">Highrise Vault</h1>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#D7CCC8]">{isAdmin ? '👑 Admin: ' : '👤 Staff: '} {currentUser?.name}</span>
            <button onClick={handleLogout} className="px-3 py-1 text-sm bg-[#B71C1C] rounded hover:bg-[#C62828] transition-colors border border-[#D32F2F]">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container p-6 mx-auto">
        <div className="flex mb-6 border-b-2 border-[#D7CCC8]">
          <button className={`px-6 py-2 font-bold ${activeTab === 'tasks' ? 'text-[#3E2723] border-b-4 border-[#3E2723]' : 'text-[#8D6E63]'}`} onClick={() => setActiveTab('tasks')}>📋 Tasks</button>
          <button className={`px-6 py-2 font-bold ${activeTab === 'projects' ? 'text-[#BF360C] border-b-4 border-[#BF360C]' : 'text-[#8D6E63]'}`} onClick={() => setActiveTab('projects')}>🚀 Projects</button>
        </div>

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {isAdmin && (
              <div className="space-y-6 lg:col-span-1">
                <div className="p-6 bg-[#FFF8E7] rounded shadow-md border border-[#D7CCC8]">
                  <h3 className="mb-4 text-lg font-bold text-[#3E2723]">Assign New Task</h3>
                  <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
                    <input type="text" placeholder="Title" className="p-2 border border-[#A1887F] rounded bg-white" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                    <input type="text" placeholder="Description" className="p-2 border border-[#A1887F] rounded bg-white" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="p-2 border border-[#A1887F] rounded bg-white text-[#3E2723]">
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                    </select>
                    <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="p-2 border border-[#A1887F] rounded bg-[#EFEBE9] font-bold text-[#3E2723]">
                        <option value="">-- Select Employee --</option>
                        <option value="all">📢 ALL EMPLOYEES</option> 
                        {employees.map(e => (<option key={e._id} value={e._id}>{e.name}</option>))}
                    </select>
                    <input type="file" className="text-sm text-[#5D4037]" onChange={(e) => setTaskFile(e.target.files[0])} />
                    <button className="py-2 text-white bg-[#33691E] rounded hover:bg-[#558B2F] font-bold shadow-sm">Create Task</button>
                  </form>
                </div>

                <div className="p-6 mt-6 bg-[#FFF8E7] rounded shadow-md border-t-4 border-[#BF360C]">
                  <h3 className="mb-4 text-lg font-bold text-[#3E2723]">🔔 Pending Requests</h3>
                  {pendingUsers.length === 0 ? (
                      <p className="text-sm text-[#8D6E63]">No new signups.</p>
                  ) : (
                      <ul className="space-y-3">
                          {pendingUsers.map(user => (
                              <li key={user._id} className="flex justify-between items-center bg-[#EFEBE9] p-2 rounded border border-[#D7CCC8]">
                                  <div><p className="text-sm font-bold text-[#3E2723]">{user.name}</p><p className="text-xs text-[#5D4037]">{user.email}</p></div>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleApproveUser(user._id)} className="text-[#2E7D32] font-bold text-lg" title="Approve">✅</button>
                                      <button onClick={() => handleRejectUser(user._id)} className="text-[#C62828] font-bold text-lg" title="Reject">❌</button>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  )}
                </div>
              </div>
            )}
            
            <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
              <h2 className="mb-6 text-2xl font-bold text-[#3E2723] font-serif">Task Board</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map(task => (
                  <div key={task._id} className="relative p-4 bg-[#FFF8E7] border border-[#D7CCC8] rounded shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l ${task.status === 'Completed' ? 'bg-[#33691E]' : task.status === 'In Progress' ? 'bg-[#F57F17]' : 'bg-[#D32F2F]'}`}></div>
                    {isAdmin && (<button onClick={() => handleDeleteTask(task._id)} className="absolute top-2 right-2 text-[#A1887F] hover:text-[#D32F2F] font-bold" title="Delete Task">🗑️</button>)}
                    <div>
                      <h3 className="font-bold mr-6 text-[#3E2723]">{task.title}</h3>
                      <p className="text-sm text-[#5D4037]">{task.description}</p>
                      {task.file && <a href={task.file} target="_blank" rel="noreferrer" className="text-[#1565C0] text-sm block mt-1 hover:underline">📎 Attachment</a>}
                    </div>
                    <div className="mt-4">
                      <div className="text-xs mb-2"><span className="font-bold text-[#8D6E63]">ASSIGNED TO:</span> <span className="text-[#3E2723] font-bold">{task.assignedTo?.name}</span></div>
                      {isAdmin ? (
                          <div className={`w-full p-2 text-center rounded text-sm font-bold border ${task.status === 'Completed' ? 'bg-[#DCEDC8] text-[#33691E] border-[#C5E1A5]' : task.status === 'In Progress' ? 'bg-[#FFF9C4] text-[#F57F17] border-[#FFF59D]' : 'bg-[#FFCDD2] text-[#B71C1C] border-[#EF9A9A]'}`}>Status: {task.status || 'Pending'}</div>
                      ) : (
                        <select value={task.status||'Pending'} onChange={(e)=>handleStatusChange(task._id, e.target.value)} className="w-full text-sm border border-[#A1887F] rounded p-1 font-bold bg-white text-[#3E2723]"><option>Pending</option><option>In Progress</option><option>Completed</option></select>
                      )}
                      <div className="mt-3 border-t border-[#D7CCC8] pt-2">
                        {isAdmin && (<div className="bg-[#EFEBE9] p-2 rounded border border-[#D7CCC8]"><span className="text-xs font-bold text-[#5D4037] block">Message from Staff:</span><p className="text-sm text-[#3E2723] italic">{task.employeeReply || "No message."}</p></div>)}
                        {!isAdmin && (
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-[#5D4037]">Message to Admin:</label>
                                <textarea className="w-full p-2 border border-[#A1887F] rounded text-sm bg-white" rows="2" placeholder="Type update here..." value={replyTexts[task._id] || ''} onChange={(e) => setReplyTexts({ ...replyTexts, [task._id]: e.target.value })} />
                                <button onClick={() => handleSendReply(task._id)} className="self-end bg-[#5D4037] text-white text-xs px-3 py-1 rounded hover:bg-[#4E342E]">Send Msg</button>
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

        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="p-6 bg-[#FFF8E7] rounded shadow-md border-t-4 border-[#BF360C]">
                <h3 className="mb-4 text-lg font-bold text-[#3E2723]">🚀 Submit New Project</h3>
                <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-[#5D4037]">Project Name</label>
                  <input type="text" placeholder="e.g. Q1 Marketing Plan" className="p-2 border border-[#A1887F] rounded bg-white" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} />
                  <label className="text-xs font-bold text-[#5D4037]">Details</label>
                  <textarea rows="3" placeholder="Description..." className="p-2 border border-[#A1887F] rounded bg-white" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
                  <label className="text-xs font-bold text-[#5D4037]">Initial Files</label>
                  <input id="project-file-input" type="file" className="text-sm text-[#5D4037]" multiple onChange={handleFileSelect} />
                  <button className="py-2 mt-2 text-white bg-[#BF360C] rounded hover:bg-[#D84315] font-bold">Submit Project</button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h2 className="mb-6 text-2xl font-bold text-[#3E2723] font-serif">Project Submissions</h2>
              <div className="project-list-container">
                {projects.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#8D6E63', marginTop: '20px' }}>No projects uploaded yet.</p>
                ) : (
                    projects.map(proj => (
                    <div key={proj._id} className="p-4 mb-4 bg-[#FFF8E7] border border-[#D7CCC8] rounded shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-[#3E2723]">{proj.title}</h3>
                          {/* 🔥 EVERYONE can now delete the project if needed (or just admin) */}
                          {isAdmin && (<button className="text-[#A1887F] hover:text-[#D32F2F] font-bold" onClick={() => handleDeleteProject(proj._id)} title="Delete Project">❌</button>)}
                        </div>
                        <div className="mb-4"><p className="text-sm text-[#5D4037]">{proj.description || "No description provided."}</p></div>
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-wrap gap-2">
                            {proj.files && proj.files.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 border border-[#A1887F] rounded-full px-3 py-1 bg-[#EFEBE9] text-sm">
                                    <a href={file} target="_blank" rel="noreferrer" className="no-underline text-[#3E2723] font-bold hover:text-[#BF360C]" title={getFileName(file)}>📄 {getFileName(file)}</a>
                                    
                                    {/* 🔥 🔥 TRASH BIN FOR EVERYONE: REMOVED isAdmin CHECK HERE */}
                                    <button onClick={() => handleDeleteFile(proj._id, file)} className="text-[#C62828] font-bold hover:text-[#D32F2F] border-l border-[#D7CCC8] pl-2" title="Delete this file">✖</button>
                                
                                </div>
                            ))}
                            <label htmlFor={`upload-${proj._id}`} className="cursor-pointer border-dashed border-2 border-[#A1887F] bg-white text-[#5D4037] px-3 py-1 rounded-full text-sm font-bold hover:bg-[#EFEBE9]">➕ Add File</label>
                            <input id={`upload-${proj._id}`} type="file" multiple style={{ display: 'none' }} onChange={(e) => handleAddFileToProject(proj._id, e)} />
                          </div>
                          <div className="w-full border-t border-[#D7CCC8] pt-2 text-xs text-[#8D6E63]">
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