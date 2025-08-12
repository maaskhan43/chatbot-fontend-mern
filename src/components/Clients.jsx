import { useState, useEffect } from 'react';
import { clientsAPI } from '../api/clients';
import './Clients.css';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [scrapingJobs, setScrapingJobs] = useState({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getClients();
      if (response.success) {
        setClients(response.clients);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScraping = async (clientId) => {
    try {
      setScrapingJobs(prev => ({ ...prev, [clientId]: { status: 'starting' } }));
      
      const response = await clientsAPI.startScraping(clientId);
      if (response.success) {
        setScrapingJobs(prev => ({ 
          ...prev, 
          [clientId]: { 
            status: 'running', 
            jobId: response.job_id,
            urlsFound: response.urls_found
          } 
        }));
        
        // Poll for status updates
        pollScrapingStatus(response.job_id, clientId);
      }
    } catch (error) {
      setError(error.message);
      setScrapingJobs(prev => ({ ...prev, [clientId]: { status: 'error', error: error.message } }));
    }
  };

  const handleExportCSV = async (clientId, clientName) => {
    try {
      setError(null);
      await clientsAPI.exportScrapedDataCSV(clientId);
      // Success message is handled by the API (auto-download)
    } catch (error) {
      setError(`Failed to export CSV for ${clientName}: ${error.message}`);
    }
  };

  const handleQAUpload = async (clientId, clientName, file) => {
    try {
      setError(null);
      console.log(`📤 Uploading Q&A file for ${clientName}:`, file.name);
      
      // TODO: Implement API call for Q&A upload
      await clientsAPI.uploadQAPairs(clientId, file);
      
      console.log(`✅ Successfully uploaded Q&A file for ${clientName}`);
      // Refresh client list to update Q&A count
      fetchClients();
    } catch (error) {
      setError(`Failed to upload Q&A file for ${clientName}: ${error.message}`);
    }
  };

  const handleFileSelect = (clientId, clientName, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'application/pdf', 
        'text/plain',
        'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/markdown',
        'text/x-markdown'
      ];
      
      const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const allowedExtensions = ['.md', '.markdown'];

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError(`Unsupported file type. Please upload CSV, PDF, TXT, JSON, XLSX, or Markdown files.`);
        return;
      }
      
      handleQAUpload(clientId, clientName, file);
    }
    // Reset file input
    event.target.value = '';
  };

  const pollScrapingStatus = async (jobId, clientId) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await clientsAPI.getScrapingStatus(jobId);
        
        setScrapingJobs(prev => ({ 
          ...prev, 
          [clientId]: { 
            ...prev[clientId],
            status: statusResponse.status,
            urlsProcessed: statusResponse.urls_processed,
            totalUrls: statusResponse.total_urls,
            error: statusResponse.error
          } 
        }));

        if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
          clearInterval(pollInterval);
          if (statusResponse.status === 'completed') {
            fetchClients(); // Refresh client list to update scraped counts
          }
        }
      } catch (error) {
        clearInterval(pollInterval);
        setScrapingJobs(prev => ({ ...prev, [clientId]: { status: 'error', error: error.message } }));
      }
    }, 2000);
  };

  const getScrapingStatusDisplay = (clientId) => {
    const job = scrapingJobs[clientId];
    if (!job) return null;

    switch (job.status) {
      case 'starting':
        return <span className="status starting">🔄 Starting...</span>;
      case 'running':
        return (
          <span className="status running">
            🕷️ Scraping... ({job.urlsProcessed || 0}/{job.totalUrls || job.urlsFound || '?'})
          </span>
        );
      case 'completed':
        return <span className="status completed">✅ Completed</span>;
      case 'failed':
        return <span className="status failed">❌ Failed: {job.error}</span>;
      case 'error':
        return <span className="status error">⚠️ Error: {job.error}</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="clients-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clients-container">
      <div className="clients-header">
        <h2>Client Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + Add Client
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showAddForm && (
        <AddClientForm 
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchClients();
          }}
        />
      )}

      <div className="clients-grid">
        {clients.length === 0 ? (
          <div className="empty-state">
            <h3>No clients yet</h3>
            <p>Add your first client to start scraping websites</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              Add Your First Client
            </button>
          </div>
        ) : (
          clients.map(client => (
            <div key={client._id} className="client-card">
              <div className="client-header">
                <h3>{client.name}</h3>
                <span className={`status-badge ${client.status}`}>
                  {client.status}
                </span>
              </div>
              
              <div className="client-details">
                <p><strong>Website:</strong> <a href={client.website} target="_blank" rel="noopener noreferrer">{client.website}</a></p>
                {client.description && <p><strong>Description:</strong> {client.description}</p>}
                {client.industry && <p><strong>Industry:</strong> {client.industry}</p>}
                <p><strong>Pages Scraped:</strong> {client.totalPagesScrapped || 0}</p>
                {client.lastScrapedAt && (
                  <p><strong>Last Scraped:</strong> {new Date(client.lastScrapedAt).toLocaleString()}</p>
                )}
              </div>

              <div className="scraping-status">
                {getScrapingStatusDisplay(client._id)}
              </div>

              <div className="client-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleStartScraping(client._id)}
                  disabled={scrapingJobs[client._id]?.status === 'running' || scrapingJobs[client._id]?.status === 'starting'}
                >
                  🕷️ Start Scraping
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => handleExportCSV(client._id, client.name)}
                  disabled={!client.totalPagesScrapped || client.totalPagesScrapped === 0}
                  title={!client.totalPagesScrapped || client.totalPagesScrapped === 0 ? 'No scraped data to export' : 'Export scraped data as CSV'}
                >
                  📊 Export CSV
                </button>
                <div className="upload-qa-wrapper">
                  <input
                    type="file"
                    id={`qa-upload-${client._id}`}
                    accept=".csv,.pdf,.txt,.json,.xlsx,.xls,.md,.markdown"
                    onChange={(e) => handleFileSelect(client._id, client.name, e)}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="btn btn-info"
                    onClick={() => document.getElementById(`qa-upload-${client._id}`).click()}
                    title="Upload Q&A pairs (CSV, PDF, TXT, JSON, XLSX, Markdown)"
                  >
                    📤 Upload Q&A
                  </button>
                </div>
                <button className="btn btn-outline">📄 View Data</button>
                <button className="btn btn-outline">⚙️ Settings</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Add Client Form Component
const AddClientForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
    industry: '',
    contactEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.website) {
      setError('Name and website are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await clientsAPI.createClient(formData);
      if (response.success) {
        onSuccess();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Add New Client</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="client-form">
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Client Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Acme Corporation"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website URL *</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the client..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry</label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="e.g., Technology, Healthcare"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactEmail">Contact Email</label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="contact@client.com"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Clients;
