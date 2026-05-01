import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Tasks from './views/Tasks';
import Clients from './views/Clients';
import Projects from './views/Projects';
import Finances from './views/Finances';
import CalendarView from './views/CalendarView';
import TeamChat from './views/TeamChat';
import Team from './views/Team';
import Login from './views/Login';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#E4E3E0]">
      <div className="font-mono text-xs animate-pulse">SYSTEM_LOADING...</div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="clients" element={<Clients />} />
            <Route path="projects" element={<Projects />} />
            <Route path="finances" element={<Finances />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="chat" element={<TeamChat />} />
            <Route path="team" element={<Team />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
