import React, { useState, useRef } from 'react';
import { SpinnerIcon, LogoIcon, HistoryIcon, SearchIcon, UploadIcon, TrashIcon } from './icons';
import { KnowledgeTopic } from '../emt-knowledge-base';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { QuestionType } from '../types';


// Configure the worker for pdfjs-dist
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

interface StartScreenProps {
  onStart: (questionType: QuestionType, difficulty: 'Easy' | 'Hard', numQuestions: number, selectedTopics: string[]) => void;
  isLoading: boolean;
  error: string | null;
  knowledgeBase: KnowledgeTopic[];
  onViewHistory: () => void;
  onAddTopic: (topic: KnowledgeTopic) => void;
  onDeleteTopic: (topicName: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, isLoading, error, knowledgeBase, onViewHistory, onAddTopic, onDeleteTopic }) => {
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Hard' | null>(null);


  const questionCounts = [5, 10, 15, 20];

  const filteredKnowledgeBase = knowledgeBase.filter(kb =>
    kb.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const areAllFilteredSelected = filteredKnowledgeBase.length > 0 && filteredKnowledgeBase.every(kb => selectedTopics.includes(kb.topic));

  const handleSelectAllToggle = () => {
    const filteredTopics = filteredKnowledgeBase.map(kb => kb.topic);
    if (areAllFilteredSelected) {
      // Deselect all filtered topics
      setSelectedTopics(prev => prev.filter(t => !filteredTopics.includes(t)));
    } else {
      // Select all filtered topics, preserving other selections that might be outside the current filter
      setSelectedTopics(prev => [...new Set([...prev, ...filteredTopics])]);
    }
  };

  const handleStart = () => {
    if (isLoading || selectedTopics.length === 0 || numQuestions === 0 || !questionType || !difficulty) return;
    onStart(questionType, difficulty, numQuestions, selectedTopics);
  }
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input value to allow re-uploading the same file
    if (event.target) {
        event.target.value = '';
    }

    setIsProcessingFile(true);

    try {
        let topicName: string;
        let content: string;

        if (file.type === 'text/plain') {
            topicName = file.name.replace(/\.txt$/i, '');
            content = await file.text();
        } else if (file.type === 'application/pdf') {
            topicName = file.name.replace(/\.pdf$/i, '');
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                fullText += pageText + '\n\n';
            }
            content = fullText.trim();
        } else {
            alert('Please upload a .txt or .pdf file.');
            setIsProcessingFile(false);
            return;
        }

        if (!content.trim()) {
            alert('The file appears to be empty or could not be read.');
            setIsProcessingFile(false);
            return;
        }
        
        const newTopic: KnowledgeTopic = {
            topic: topicName,
            content: content,
            isCustom: true,
        };
        onAddTopic(newTopic);
        // Automatically select the new topic
        setSelectedTopics(prev => [...new Set([...prev, newTopic.topic])]);

    } catch (error) {
        console.error('Error processing file:', error);
        alert('An error occurred while processing the file. Please try again.');
    } finally {
        setIsProcessingFile(false);
    }
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = (e: React.MouseEvent, topicName: string) => {
      e.stopPropagation(); // Prevent row click from toggling selection
      if (window.confirm(`Are you sure you want to delete the custom topic "${topicName}"?`)) {
          onDeleteTopic(topicName);
          setSelectedTopics(prev => prev.filter(t => t !== topicName));
      }
  };
  
  const isStartDisabled = selectedTopics.length === 0 || !questionType || !difficulty || isLoading;

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full transition-all duration-500 stagger-children">
      <LogoIcon className="w-32 h-32 mb-4 text-cyan-400" style={{ animationDelay: '100ms' }} />
      <h1 className="text-4xl md:text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500" style={{ animationDelay: '200ms' }}>
        EMT Quiz App
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md" style={{ animationDelay: '300ms' }}>
        Sharpen your skills with AI-generated questions based on official EMT training materials.
      </p>

      {isLoading ? (
        <div className="h-48 flex flex-col items-center justify-center">
          <SpinnerIcon className="h-12 w-12 text-cyan-400 animate-spin" />
          <p className="mt-4 text-gray-700 dark:text-gray-300">Generating your quiz with Gemini...</p>
        </div>
      ) : (
        <>
          <div className="mb-6 w-full" style={{ animationDelay: '400ms' }}>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">1. Select Number of Questions</h2>
            <div className="flex justify-center flex-wrap gap-3">
              {questionCounts.map(count => (
                 <button
                    key={count}
                    onClick={() => setNumQuestions(count)}
                    className={`px-5 py-2 font-bold rounded-lg shadow-md transition-all duration-200 border-2 active:scale-95 ${
                      numQuestions === count
                        ? 'bg-cyan-500 border-cyan-400 ring-2 ring-cyan-400 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border-transparent text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {count}
                  </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6 w-full" style={{ animationDelay: '500ms' }}>
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">2. Select Topics</h2>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt,.pdf"
                    className="hidden"
                    aria-hidden="true"
                />
                 <button
                    onClick={triggerFileSelect}
                    disabled={isProcessingFile}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-gray-200 hover:bg-gray-300 text-cyan-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-cyan-300 rounded-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isProcessingFile ? (
                        <SpinnerIcon className="h-4 w-4 animate-spin" />
                    ) : (
                        <UploadIcon className="h-4 w-4" />
                    )}
                    {isProcessingFile ? 'Processing...' : 'Add Custom'}
                </button>
            </div>
            
            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-5 w-5 text-gray-500" />
              </span>
              <input
                type="text"
                placeholder="Search topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 focus:ring-cyan-500 focus:border-cyan-500"
                aria-label="Search for topics"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
                  <tr>
                    <th className="px-4 py-2 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={areAllFilteredSelected}
                        onChange={handleSelectAllToggle}
                        className="w-4 h-4 text-cyan-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500 rounded focus:ring-cyan-500"
                        aria-label="Select all visible topics"
                        disabled={filteredKnowledgeBase.length === 0}
                      />
                    </th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300">Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKnowledgeBase.length > 0 ? (
                    filteredKnowledgeBase.map(kb => {
                      const isSelected = selectedTopics.includes(kb.topic);
                      return (
                        <tr 
                          key={kb.topic}
                          onClick={() => handleTopicToggle(kb.topic)}
                          className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-cyan-900/50' : ''}`}
                          aria-selected={isSelected}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTopicToggle(kb.topic)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-cyan-600 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-500 rounded focus:ring-cyan-500"
                              aria-label={`Select topic ${kb.topic}`}
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-800 dark:text-gray-300">
                             <div className="flex items-center justify-between gap-2">
                               <div className="flex items-center gap-2">
                                  {kb.topic}
                                  {kb.isCustom && <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">Custom</span>}
                               </div>
                                {kb.isCustom && (
                                    <button onClick={(e) => handleDelete(e, kb.topic)} className="text-gray-500 hover:text-red-400 p-1 rounded-full relative z-10" aria-label={`Delete custom topic ${kb.topic}`}>
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="text-center py-4 text-gray-500">
                        No topics found for "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6 w-full" style={{ animationDelay: '600ms' }}>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">3. Select Question Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setQuestionType('Knowledge-Based')}
                className={`w-full px-5 py-3 font-bold rounded-lg shadow-md transition-all duration-200 border-2 active:scale-95 ${
                  questionType === 'Knowledge-Based'
                    ? 'bg-blue-600 border-blue-400 ring-2 ring-blue-400 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border-transparent text-gray-700 dark:text-gray-200'
                }`}
              >
                Knowledge-Based
              </button>
              <button
                onClick={() => setQuestionType('Scenario-Based')}
                className={`w-full px-5 py-3 font-bold rounded-lg shadow-md transition-all duration-200 border-2 active:scale-95 ${
                  questionType === 'Scenario-Based'
                    ? 'bg-blue-600 border-blue-400 ring-2 ring-blue-400 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border-transparent text-gray-700 dark:text-gray-200'
                }`}
              >
                Scenario-Based
              </button>
            </div>
          </div>

          <div className="mb-8 w-full" style={{ animationDelay: '700ms' }}>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">4. Select Difficulty</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setDifficulty('Easy')}
                className={`w-full px-5 py-3 font-bold rounded-lg shadow-md transition-all duration-200 border-2 active:scale-95 ${
                  difficulty === 'Easy'
                    ? 'bg-green-600 border-green-400 ring-2 ring-green-400 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border-transparent text-gray-700 dark:text-gray-200'
                }`}
              >
                Easy
              </button>
              <button
                onClick={() => setDifficulty('Hard')}
                className={`w-full px-5 py-3 font-bold rounded-lg shadow-md transition-all duration-200 border-2 active:scale-95 ${
                  difficulty === 'Hard'
                    ? 'bg-red-600 border-red-400 ring-2 ring-red-400 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border-transparent text-gray-700 dark:text-gray-200'
                }`}
              >
                Hard
              </button>
            </div>
          </div>
          
          <div className="w-full" style={{ animationDelay: '800ms' }}>
             {selectedTopics.length === 0 && (
                <div className="flex items-center justify-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-300 text-sm rounded-md p-3 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Please select at least one topic to start the quiz.</span>
                </div>
             )}
            <button
              onClick={handleStart}
              disabled={isStartDisabled}
              className="w-full px-6 py-4 bg-cyan-600 text-white font-bold rounded-lg shadow-lg hover:bg-cyan-700 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              aria-label="Start the quiz with selected options"
            >
              Start Quiz
            </button>
          </div>
          
          <div className="w-full mt-8 pt-6 border-t border-gray-200 dark:border-gray-700" style={{ animationDelay: '900ms' }}>
            <button
              onClick={onViewHistory}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-cyan-600 dark:text-cyan-300 font-semibold rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
            >
              <HistoryIcon className="h-5 w-5 mr-3" />
              View Quiz History
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="mt-6 text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50 px-4 py-2 rounded-md">{error}</p>
      )}
    </div>
  );
};

export default StartScreen;