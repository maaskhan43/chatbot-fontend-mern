import { useAuth } from '../hooks/useAuth.jsx';
import { useState } from 'react';
import ChatbotTestModal from './ChatbotTestModal.jsx';
import './Dashboard.css';

const Dashboard = () => {
  const { admin, logout } = useAuth();
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Gemini Chatbot Admin</h1>
          <div className="admin-info">
            <span>Welcome, {admin?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>🎉 Welcome to Admin Dashboard!</h2>
            <p>You have successfully logged in to the Gemini Chatbot admin panel.</p>
            
            <div className="admin-details">
              <h3>Admin Details:</h3>
              <ul>
                <li><strong>Email:</strong> {admin?.email}</li>
                <li><strong>Role:</strong> {admin?.role}</li>
                <li><strong>Last Login:</strong> {admin?.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'First time'}</li>
              </ul>
            </div>

            <div className="next-steps">
              <h3>🚀 Available Features:</h3>
              <div className="feature-grid">
                <div className="feature-card active" onClick={() => window.location.href = '/clients'}>
                  <h4>👥 Client Management</h4>
                  <p>Add and manage chatbot clients</p>
                  <span className="status active">✅ Available</span>
                  <button className="feature-btn">Go to Clients</button>
                </div>
                
                <div className="feature-card active" onClick={() => window.location.href = '/clients'}>
                  <h4>🕷️ Web Scraping</h4>
                  <p>Configure scraping jobs for client websites</p>
                  <span className="status active">✅ Available</span>
                  <button className="feature-btn">Start Scraping</button>
                </div>
                
                <div className="feature-card active" onClick={() => setIsTestModalOpen(true)}>
                  <h4>🤖 Chatbot Testing</h4>
                  <p>Test chatbots with integrated interface</p>
                  <span className="status active">✅ Available</span>
                  <button className="feature-btn">Test Chatbot</button>
                </div>
                
                <div className="feature-card">
                  <h4>📊 Analytics</h4>
                  <p>View chatbot usage and performance</p>
                  <span className="status coming-soon">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chatbot Testing Modal */}
      <ChatbotTestModal 
        isOpen={isTestModalOpen} 
        onClose={() => setIsTestModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
