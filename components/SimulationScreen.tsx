import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, SpinnerIcon } from './icons';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface SimulationScreenProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onEndSimulation: () => void;
  isSending: boolean;
  difficulty: 'Easy' | 'Hard';
  topics: string[];
}

const SimulationScreen: React.FC<SimulationScreenProps> = ({ messages, onSendMessage, onEndSimulation, isSending, difficulty, topics }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (input.trim() && !isSending) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-500">
                Clinical Simulation
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {difficulty} | Topics: {topics.join(', ')}
            </p>
        </div>
        <button onClick={onEndSimulation} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 active:scale-95">
          End & Review
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex-shrink-0"></div>}
            <div className={`max-w-prose p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isSending && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex-shrink-0"></div>
            <div className="max-w-prose p-3 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center gap-3">
                <SpinnerIcon className="h-5 w-5 animate-spin text-teal-500" />
                <span className="text-gray-500 dark:text-gray-400 italic">Simulator is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your next action..."
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500"
            disabled={isSending}
            aria-label="Your next action"
          />
          <button onClick={handleSend} disabled={isSending || !input.trim()} className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors active:scale-95" aria-label="Send message">
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationScreen;
