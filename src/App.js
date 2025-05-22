import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Temporary debugging code - remove after confirming environment variables work
console.log("ENV check:", 
  process.env.REACT_APP_OPENAI_API_KEY ? 
  "API key exists (starts with: " + process.env.REACT_APP_OPENAI_API_KEY.substring(0, 5) + "...)" : 
  "API key is missing");

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if API key exists on component mount
  useEffect(() => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.error("API key is missing or invalid. Check your .env file setup.");
      setApiKeyError(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (input.trim() === '') return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // For debugging - remove in production
  console.log("Using API key:", process.env.REACT_APP_OPENAI_API_KEY ? "API key exists" : "API key is missing");
  
  try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error("API key is missing. Make sure your .env file is set up correctly.");
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [...messages, userMessage],
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error && errorJson.error.message) {
            errorMessage += `: ${errorJson.error.message}`;
          }
        } catch (e) {
          // If we can't parse the error as JSON, just use the status
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      const assistantMessage = data.choices[0].message;
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>OpenAI Chat</h1>
      </header>
      
      {apiKeyError ? (
        <div className="api-key-error">
          <h2>API Key Error</h2>
          <p>Your OpenAI API key is missing or invalid.</p>
          <div className="error-instructions">
            <h3>To fix this issue:</h3>
            <ol>
              <li>Create a <code>.env</code> file in the root of your project</li>
              <li>Add your API key: <code>REACT_APP_OPENAI_API_KEY=sk-your_api_key_here</code></li>
              <li>Restart the development server</li>
            </ol>
            <p><strong>Note:</strong> If you've already done this, make sure there are no spaces in your .env file and that you've restarted the server.</p>
          </div>
        </div>
      ) : (
      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>Welcome to OpenAI Chat!</h2>
              <p>Send a message to start chatting with the AI assistant.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-content">{message.content}</div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant-message">
              <div className="message-content loading">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || input.trim() === ''}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
          )}
    </div>
  );
}

export default App;

