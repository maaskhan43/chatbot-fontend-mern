import React, { useState, useEffect, useRef } from 'react';
import { clientsAPI } from '../api/clients';
import './ChatbotTestModal.css';

const ChatbotTestModal = ({ isOpen, onClose }) => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      setMessages([]);
      setSelectedClient('');
      setIsTesting(false);
      setInputMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getClients();
      if (response.success) {
        setClients(response.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const startTesting = () => {
    if (!selectedClient) {
      alert('Please select a client to test');
      return;
    }
    const client = clients.find(c => c._id === selectedClient);
    setIsTesting(true);
    setMessages([
      {
        sender: 'bot',
        text: `Hello! I'm the chatbot for ${client.name}. Ask me anything!`,
      }
    ]);
  };

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      sender: 'user',
      text: textToSend,
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await clientsAPI.semanticSearch(textToSend, selectedClient);
      const botMessage = { 
        sender: 'bot', 
        text: response.answer,
        suggestedQuestions: response.suggestedQuestions || null
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestionClick = (question) => {
    sendMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetTesting = () => {
    setIsTesting(false);
    setMessages([]);
    setInputMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chatbot-test-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🤖 Chatbot Testing</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {!isTesting ? (
            <div className="client-selection">
              <h4>Select a client to test:</h4>
              <select 
                value={selectedClient} 
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">Choose a client...</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <button 
                className="start-btn" 
                onClick={startTesting}
                disabled={!selectedClient}
              >
                Start Testing
              </button>
            </div>
          ) : (
            <div className="chat-interface">
              <div className="chat-header">
                 <button className="reset-btn" onClick={resetTesting}>
                  ← Back to Selection
                </button>
              </div>  
              <div className="messages-container">
                {messages.map((message, index) => (
                  <div key={index} className={`message ${message.sender}`}>
                    <div className="message-content">
                      {message.text}
                      {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                        <div className="suggested-questions">
                          <p className="suggestions-label">Try asking:</p>
                          {message.suggestedQuestions.map((question, qIndex) => (
                            <button
                              key={qIndex}
                              className="suggested-question-btn"
                              onClick={() => handleSuggestedQuestionClick(question)}
                              disabled={isLoading}
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message bot">
                    <div className="message-content">
                      <div className="typing-indicator"><span></span><span></span><span></span></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="message-input-container">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows="1"
                  disabled={isLoading}
                />
                <button 
                  className="send-btn" 
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  &#10148;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatbotTestModal;
