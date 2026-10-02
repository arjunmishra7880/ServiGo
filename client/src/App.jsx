import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBookings from './pages/MyBookings';
import ProviderDetail from './pages/ProviderDetail';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import ChatPanel from './components/ChatPanel';
import SupportChatBot from './components/SupportChatBot';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/providers/:id" element={<ProviderDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatPanel />
      <SupportChatBot />
    </Router>
  );
}

export default App;
