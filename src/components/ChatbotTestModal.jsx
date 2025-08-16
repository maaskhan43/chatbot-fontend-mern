import React, { useState, useEffect, useRef } from 'react';
import { clientsAPI } from '../api/clients';
import './ChatbotTestModal.css';

const API_BASE_URL =process.env.VITE_BACKEND_URL;

const ChatbotTestModal = ({ isOpen, onClose }) => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [sessionId, setSessionId] = useState('');
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

  useEffect(() => {
    if (isOpen && !sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      console.log(`[SESSION] Generated new session ID: ${newSessionId}`);
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInputMessage('');
      setSessionId('');
      setIsLoading(false);
    }
  }, [isOpen]);

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
      const response = await clientsAPI.semanticSearch(textToSend, selectedClient, sessionId);
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

  const handleSuggestedQuestionClick = async (suggestion) => {
    if (isLoading) return;
    
    // Handle both old string format and new object format
    const questionText = typeof suggestion === 'string' ? suggestion : suggestion.question;
    const originalQuestion = typeof suggestion === 'object' ? suggestion.originalQuestion : suggestion;
    const userLanguage = typeof suggestion === 'object' ? suggestion.userLanguage : 'en';
    
    setInputMessage(questionText);
    setIsLoading(true);

    try {
      // If we have original question and user language, use the suggestion click handler
      if (originalQuestion && userLanguage !== 'en') {
        const response = await fetch(`${API_BASE_URL}/chat/suggestion-click`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalQuestion: originalQuestion,
            userLanguage: userLanguage,
            clientId: selectedClient,
            sessionId: sessionId,
          }),
        });

        const data = await response.json();
        
        setMessages(prev => [...prev, 
          { sender: 'user', text: questionText },
          { 
            sender: 'bot', 
            text: data.answer,
            score: data.score,
            confidence: data.confidence,
            type: data.type
          }
        ]);
      } else {
        // Fallback to regular semantic search
        const response = await fetch(`${API_BASE_URL}/chat/semantic-search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: questionText,
            clientId: selectedClient,
            sessionId: sessionId,
          }),
        });

        const data = await response.json();
        
        setMessages(prev => [...prev, 
          { sender: 'user', text: questionText },
          { 
            sender: 'bot', 
            text: data.answer,
            suggestedQuestions: data.suggestedQuestions || null,
            score: data.score,
            confidence: data.confidence,
            type: data.type
          }
        ]);
      }
    } catch (error) {
      console.error('Error sending suggested question:', error);
      setMessages(prev => [...prev, 
        { sender: 'user', text: questionText },
        { sender: 'bot', text: 'Sorry, there was an error processing your question.' }
      ]);
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
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
                          {message.suggestedQuestions.map((suggestion, qIndex) => (
                            <button
                              key={suggestion.id || qIndex}
                              className="suggested-question-btn"
                              onClick={() => handleSuggestedQuestionClick(suggestion)}
                              disabled={isLoading}
                              title={typeof suggestion === 'object' ? `Relevance: ${suggestion.relevanceReason} (Score: ${suggestion.score})` : ''}
                            >
                              {typeof suggestion === 'string' ? suggestion : suggestion.question}
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
