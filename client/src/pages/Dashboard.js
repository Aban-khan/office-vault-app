import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
// 🔥 UI IMPORTS
import { motion, AnimatePresence } from 'framer-motion'; 
import { FaTasks, FaProjectDiagram, FaUserTie, FaSignOutAlt, FaPlus, FaTrash, FaCheck, FaTimes, FaFileAlt, FaPaperPlane } from 'react-icons/fa'; 
import BuildingLoader from '../components/BuildingLoader'; 

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); 
  
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('userInfo')));
  const [activeTab, setActiveTab] = useState('tasks');

  // FORMS - TASKS
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(''); 
  const [taskFile, setTaskFile] = useState(null);

  // FORMS - PROJECTS
  const [projTitle, setProjTitle] = useState('');
  const [projLocation, setProjLocation] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projFiles, setProjFiles] = useState([]); 
  const [replyTexts, setReplyTexts] = useState({});

  const API_BASE = 'https://office-vault-app.onrender.com/api';
  const socketRef = useRef(null);

  // --- 1. REACT QUERY FETCHING (Updated with isLoading) ---
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/tasks`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      return data;
    },
    enabled: !!currentUser,
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      return data;
    },
    enabled: !!currentUser,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      return data;
    },
    enabled: !!currentUser && currentUser?.role === 'admin',
  });

  const { data: pendingUsers = [] } = useQuery({
    queryKey: ['pendingUsers'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/auth/pending`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      return data;
    },
    enabled: !!currentUser && currentUser?.role === 'admin',
  });


  // --- 2. SOCKET SETUP ---
  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    if (Notification.permission !== 'granted') Notification.requestPermission();

    socketRef.current = io('https://office-vault-app.onrender.com');

    socketRef.current.on('new-task', (newTask) => {
      if (currentUser.role === 'admin' || newTask.assignedTo._id === currentUser._id) {
          queryClient.setQueryData(['tasks'], (oldTasks = []) => [newTask, ...oldTasks]);
          toast.success("🚀 New Task Assigned!", { icon: '🔔' });
          new Notification("Highrise Vault", { body: `New Task: ${newTask.title}`, icon: "/logo192.png" });
      }
    });

    socketRef.current.on('bulk-task-created', () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] }); 
        toast("📢 Bulk Tasks Assigned!");
    });

    socketRef.current.on('task-deleted', (deletedId) => {
        queryClient.setQueryData(['tasks'], (oldTasks = []) => oldTasks.filter(t => t._id !== deletedId));
    });
    
    socketRef.current.on('task-updated', (updatedTask) => {
         queryClient.setQueryData(['tasks'], (oldTasks = []) => oldTasks.map(t => t._id === updatedTask._id ? updatedTask : t));
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [navigate, currentUser, queryClient]);


  // --- HANDLERS ---
  const getErrorMsg = (error) => error.response?.data?.message || error.message || "Something went wrong";

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !assignedTo) return toast.error('Fields required'); 
    const loadToast = toast.loading('Assigning Task...');
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const formData = new FormData();
      formData.append('title', taskTitle);
      formData.append('description', taskDesc);
      formData.append('priority', priority);
      formData.append('assignedTo', assignedTo);
      formData.append('projectId', selectedProjectId); 
      if (taskFile) formData.append('file', taskFile);
      
      await axios.post(`${API_BASE}/tasks`, formData, config);
      toast.success('Task Assigned!', { id: loadToast });
      setTaskTitle(''); setTaskDesc(''); setTaskFile(null); setAssignedTo(''); setSelectedProjectId('');
    } catch (error) { toast.error(getErrorMsg(error), { id: loadToast }); }
  };

  const handleApproveUser = async (id) => {
    try {
        await axios.put(`${API_BASE}/auth/approve/${id}`, {}, { headers: { Authorization: `Bearer ${currentUser.token}` } });
        toast.success('User Approved!');
        queryClient.invalidateQueries({ queryKey: ['pendingUsers'] }); 
        queryClient.invalidateQueries({ queryKey: ['employees'] });    
    } catch (error) { toast.error(getErrorMsg(error)); }
  };

  const handleRejectUser = async (id) => {
    if(!window.confirm("Reject user?")) return;
    try {
        await axios.delete(`${API_BASE}/auth/reject/${id}`, { headers: { Authorization: `Bearer ${currentUser.token}` } });
        toast.success('User Rejected');
        queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
    } catch (error) { toast.error(getErrorMsg(error)); }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projTitle || !projLocation || projFiles.length === 0) return toast.error('Data required');
    const loadToast = toast.loading('Uploading...');
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const formData = new FormData();
      formData.append('title', projTitle);
      formData.append('description', projDesc);
      formData.append('location', projLocation); 
      for (let i = 0; i < projFiles.length; i++) { formData.append('files', projFiles[i]); }
      
      await axios.post(`${API_BASE}/projects`, formData, config);
      queryClient.invalidateQueries({ queryKey: ['projects'] }); 
      setProjTitle(''); setProjDesc(''); setProjLocation(''); setProjFiles([]); 
      document.getElementById('project-file-input').value = ""; 
      toast.success('Project Submitted!', { id: loadToast });
    } catch (error) { toast.error(getErrorMsg(error), { id: loadToast }); }
  };

  const handleAddFileToProject = async (projectId, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const loadToast = toast.loading('Adding File...');
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) { formData.append('files', files[i]); }
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.put(`${API_BASE}/projects/${projectId}/add`, formData, config);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('File added!', { id: loadToast });
    } catch (error) { toast.error(getErrorMsg(error), { id: loadToast }); }
  };

  const handleDeleteFile = async (projectId, filePath) => {
    if(!window.confirm("Delete file?")) return;
    try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        await axios.put(`${API_BASE}/projects/${projectId}/remove-file`, { filePath }, config);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        toast.success('File deleted');
    } catch (error) { toast.error(getErrorMsg(error)); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    queryClient.setQueryData(['tasks'], (old) => old.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.put(`${API_BASE}/tasks/${taskId}`, { status: newStatus }, config);
    } catch (error) { 
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        toast.error(getErrorMsg(error)); 
    }
  };

  const handleSendReply = async (taskId) => {
    const message = replyTexts[taskId];
    if (!message) return toast.error("Type a message");
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.put(`${API_BASE}/tasks/${taskId}`, { employeeReply: message }, config);
      setReplyTexts({ ...replyTexts, [taskId]: '' });
      toast.success("Reply Sent!");
    } catch (error) { toast.error(getErrorMsg(error)); }
  };

  const handleDeleteTask = async (id) => {
    if(!window.confirm("Delete task?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.delete(`${API_BASE}/tasks/${id}`, config);
      toast.success('Task Deleted');
    } catch (error) { toast.error(getErrorMsg(error)); }
  };

  const handleDeleteProject = async (id) => {
    if(!window.confirm("Delete project?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.delete(`${API_BASE}/projects/${id}`, config);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project Deleted');
    } catch (error) { toast.error(getErrorMsg(error)); }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
    toast('Logged out', { icon: '👋' });
  };

  const handleFileSelect = (e) => { setProjFiles(e.target.files); };
  
  const getFileName = (path) => {
    if (!path) return 'File';
    let serverFileName = path.split(/[/\\]/).pop(); 
    try { serverFileName = decodeURIComponent(serverFileName); } catch (e) {}
    return serverFileName.length > 25 ? serverFileName.substring(0, 20) + '...' : serverFileName;
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-gray-800 font-sans">
      {/* --- NAVBAR --- */}
      <nav className="p-4 bg-white shadow-sm border-b border-gray-200">
        <div className="container flex justify-between items-center mx-auto">
          <h1 className="text-xl font-bold tracking-tight text-indigo-900 flex items-center gap-2">
            <span className="text-2xl">🏢</span> Highrise Vault
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {isAdmin ? <FaUserTie className="text-indigo-600"/> : <FaUserTie className="text-emerald-600"/>}
              <span className="font-semibold">{currentUser?.name}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors border border-red-200">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container p-6 mx-auto max-w-7xl">
        {/* --- TABS --- */}
        <div className="flex gap-4 mb-8">
          <button 
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-sm ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`} 
            onClick={() => setActiveTab('tasks')}
          >
            <FaTasks /> Tasks
          </button>
          <button 
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-sm ${activeTab === 'projects' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`} 
            onClick={() => setActiveTab('projects')}
          >
            <FaProjectDiagram /> Projects
          </button>
        </div>

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            
            {/* SIDEBAR (Forms & Requests) */}
            {isAdmin && (
              <div className="lg:col-span-4 space-y-6">
                {/* Create Task Form */}
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <h3 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2"><FaPlus className="text-indigo-500"/> Assign New Task</h3>
                  <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Project Link</label>
                        <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all text-sm">
                            <option value="">-- No Specific Project --</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Details</label>
                        <input type="text" placeholder="Task Title" className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none text-sm" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                        <input type="text" placeholder="Short description..." className="w-full mt-2 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none text-sm" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="p-2.5 border border-gray-300 rounded-lg bg-white text-sm">
                            <option value="Low">Low Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="High">High Priority</option>
                        </select>
                        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="p-2.5 border border-gray-300 rounded-lg bg-indigo-50 font-semibold text-indigo-700 text-sm">
                            <option value="">Select Employee</option>
                            <option value="all">📢 ALL STAFF</option> 
                            {employees.map(e => (<option key={e._id} value={e._id}>{e.name}</option>))}
                        </select>
                    </div>
                    
                    <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" onChange={(e) => setTaskFile(e.target.files[0])} />
                    
                    <button className="w-full py-2.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition-all active:scale-95">
                      Assign Task
                    </button>
                  </form>
                </div>

                {/* Pending Users */}
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <h3 className="mb-4 text-lg font-bold text-gray-800">🔔 Pending Approvals</h3>
                  {pendingUsers.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No new signups.</p>
                  ) : (
                      <ul className="space-y-3">
                          {pendingUsers.map(user => (
                              <li key={user._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <div><p className="text-sm font-bold text-gray-800">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleApproveUser(user._id)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"><FaCheck/></button>
                                      <button onClick={() => handleRejectUser(user._id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><FaTimes/></button>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  )}
                </div>
              </div>
            )}
            
            {/* TASK BOARD (Main Area) */}
            <div className={isAdmin ? "lg:col-span-8" : "lg:col-span-12"}>
              <h2 className="mb-6 text-2xl font-bold text-gray-800">Active Tasks</h2>
              
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {/* 🔥 CUSTOM BUILDING LOADER */}
                {loadingTasks && (
                   <div className="col-span-full">
                      <BuildingLoader />
                   </div>
                )}

                {/* 🔥 TASKS LIST */}
                <AnimatePresence>
                {tasks.map(task => (
                  <motion.div 
                    key={task._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
                  >
                    {/* Priority Indicator Line */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${task.status === 'Completed' ? 'bg-green-500' : task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                    
                    {isAdmin && (<button onClick={() => handleDeleteTask(task._id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><FaTrash /></button>)}
                    
                    <div>
                      {task.project && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 mb-2 uppercase tracking-wide">
                              <FaProjectDiagram /> {task.project.title}
                          </div>
                      )}
                      <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                      
                      {task.file && (
                        <a href={task.file} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">
                          <FaFileAlt /> View Attachment
                        </a>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                {task.assignedTo?.name?.[0] || "?"}
                            </div>
                            <span>{task.assignedTo?.name}</span>
                        </div>
                      </div>

                      {isAdmin ? (
                          <div className={`w-full py-1.5 text-center rounded text-xs font-bold border ${task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : task.status === 'In Progress' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {task.status || 'Pending'}
                          </div>
                      ) : (
                        <select 
                            value={task.status||'Pending'} 
                            onChange={(e)=>handleStatusChange(task._id, e.target.value)} 
                            className={`w-full py-1.5 px-2 rounded text-xs font-bold border cursor-pointer outline-none ${task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-300'}`}
                        >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                        </select>
                      )}

                      {/* Chat / Reply Section */}
                      <div className="mt-3">
                        {isAdmin ? (
                             task.employeeReply && (
                                <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 border border-gray-200">
                                    <span className="font-bold text-gray-800">Reply:</span> {task.employeeReply}
                                </div>
                             )
                        ) : (
                            <div className="relative">
                                <input 
                                    className="w-full pl-2 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-300 outline-none" 
                                    placeholder="Reply to admin..." 
                                    value={replyTexts[task._id] || ''} 
                                    onChange={(e) => setReplyTexts({ ...replyTexts, [task._id]: e.target.value })} 
                                />
                                <button onClick={() => handleSendReply(task._id)} className="absolute right-1 top-1 text-indigo-600 p-1 hover:text-indigo-800"><FaPaperPlane size={12}/></button>
                            </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>

                {!loadingTasks && tasks.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400">
                        <p>No active tasks found.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PROJECTS TAB --- */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 sticky top-4">
                <h3 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2"><FaPlus className="text-emerald-500"/> New Project</h3>
                <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
                  <input type="text" placeholder="Project Name" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none text-sm" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} />
                  <input type="text" placeholder="Location / Site" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none text-sm" value={projLocation} onChange={(e) => setProjLocation(e.target.value)} />
                  <textarea rows="3" placeholder="Description..." className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none text-sm" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
                  <input id="project-file-input" type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" multiple onChange={handleFileSelect} />
                  <button className="w-full py-2.5 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-bold shadow-md shadow-emerald-200 transition-all active:scale-95">Submit Project</button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-800">Project Archive</h2>
              <div className="space-y-4">
                
                {/* 🔥 CUSTOM BUILDING LOADER */}
                {loadingProjects && <BuildingLoader />}
                
                <AnimatePresence>
                {projects.map(proj => (
                    <motion.div 
                        key={proj._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-xl text-gray-800">{proj.title}</h3>
                            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">📍 {proj.location}</p>
                          </div>
                          {isAdmin && (<button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => handleDeleteProject(proj._id)}><FaTrash /></button>)}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{proj.description || "No description provided."}</p>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap gap-2">
                            {proj.files && proj.files.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-sm hover:bg-gray-100 transition-colors">
                                    <a href={file} target="_blank" rel="noreferrer" className="flex items-center gap-2 no-underline text-gray-700 font-medium" title={getFileName(file)}>
                                        <FaFileAlt className="text-gray-400"/> {getFileName(file)}
                                    </a>
                                    <button onClick={() => handleDeleteFile(proj._id, file)} className="text-gray-400 hover:text-red-500 pl-2 border-l border-gray-300" title="Delete file"><FaTimes/></button>
                                </div>
                            ))}
                            <label htmlFor={`upload-${proj._id}`} className="cursor-pointer border border-dashed border-gray-300 bg-white text-gray-500 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1"><FaPlus size={10}/> Add File</label>
                            <input id={`upload-${proj._id}`} type="file" multiple style={{ display: 'none' }} onChange={(e) => handleAddFileToProject(proj._id, e)} />
                          </div>
                          <div className="w-full border-t border-gray-100 pt-3 flex justify-between items-center text-xs text-gray-400">
                              <span>Submitted by: <span className="text-gray-600 font-semibold">{proj.createdBy?.name || "Unknown"}</span></span>
                              <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
                
                {!loadingProjects && projects.length === 0 && (
                    <p className="text-center text-gray-400 py-10">No projects yet.</p>
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