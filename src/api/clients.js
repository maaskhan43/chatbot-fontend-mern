import apiClient from './client';

export const clientsAPI = {
  // Get all clients
  getClients: async () => {
    try {
      const response = await apiClient.get('/api/admin/clients');
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch clients',
        status: error.response?.status
      };
    }
  },

  // Get single client
  getClient: async (id) => {
    try {
      const response = await apiClient.get(`/api/admin/clients/${id}`);
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch client',
        status: error.response?.status
      };
    }
  },

  // Create new client
  createClient: async (clientData) => {
    try {
      const response = await apiClient.post('/api/admin/clients', clientData);
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to create client',
        status: error.response?.status
      };
    }
  },

  // Update client
  updateClient: async (id, clientData) => {
    try {
      const response = await apiClient.put(`/api/admin/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to update client',
        status: error.response?.status
      };
    }
  },

  // Delete client
  deleteClient: async (id) => {
    try {
      const response = await apiClient.delete(`/api/admin/clients/${id}`);
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to delete client',
        status: error.response?.status
      };
    }
  },

  // Start scraping job
  startScraping: async (id, urls = []) => {
    try {
      const response = await apiClient.post(`/api/admin/clients/${id}/scrape`, { urls });
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to start scraping',
        status: error.response?.status
      };
    }
  },

  // Get scraping status
  getScrapingStatus: async (jobId) => {
    try {
      const response = await apiClient.get(`/api/admin/clients/scraping/status/${jobId}`);
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to get scraping status',
        status: error.response?.status
      };
    }
  },

  // Get scraped data
  getScrapedData: async (id) => {
    try {
      const response = await apiClient.get(`/api/admin/clients/${id}/scraped-data`);
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to get scraped data',
        status: error.response?.status
      };
    }
  },

  // Export scraped data as CSV
  exportScrapedDataCSV: async (id) => {
    try {
      const response = await apiClient.get(`/api/admin/clients/${id}/export-csv`, {
        responseType: 'blob' // Important for file download
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'scraped_data.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'CSV export started' };
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to export CSV',
        status: error.response?.status
      };
    }
  },

  // Upload Q&A pairs from file
  uploadQAPairs: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('qaFile', file);
      formData.append('clientId', id);
      
      console.log(`📤 Uploading Q&A file: ${file.name} (${file.type}) for client ${id}`);
      
      const response = await apiClient.post(`/api/admin/clients/${id}/upload-qa`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for large files
      });
      
      console.log(`✅ Q&A upload successful:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Q&A upload failed:`, error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to upload Q&A file',
        status: error.response?.status
      };
    }
  },

  // Semantic search
  semanticSearch: async (query, clientId) => {
    try {
      const response = await apiClient.post('/api/chat/search', { query, clientId });
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to perform semantic search',
        status: error.response?.status
      };
    }
  }
};
