import React from 'react';
import { QuizResult } from '../types';
import { LogoIcon, TrashIcon } from './icons';

interface HistoryScreenProps {
  history: QuizResult[];
  onReview: (quiz: QuizResult) => void;
  onBack: () => void;
  onClearHistory: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onReview, onBack, onClearHistory }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 stagger-children">
      <div className="flex justify-between items-center mb-6" style={{ animationDelay: '100ms' }}>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-green-600">Quiz History</h1>
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg shadow-md transition-all duration-200 active:scale-95">
          Back to Start
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg" style={{ animationDelay: '200ms' }}>
          <LogoIcon className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No quizzes completed yet.</h2>
          <p className="text-gray-500">Your past quiz results will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((quiz, index) => (
            <div 
              key={quiz.id} 
              className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex-grow">
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{quiz.difficulty} {quiz.questionType} Quiz - {new Date(quiz.date).toLocaleString()}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Score: <span className="font-semibold">{quiz.score}/{quiz.totalQuestions} ({quiz.percentage}%)</span>
                </p>
              </div>
              <button 
                onClick={() => onReview(quiz)}
                className="w-full md:w-auto px-6 py-2 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
              >
                Review
              </button>
            </div>
          ))}
          <div className="text-center mt-8 pt-4 border-t border-gray-200 dark:border-gray-700" style={{ animationDelay: `${300 + history.length * 100}ms` }}>
             <button 
                onClick={onClearHistory} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-semibold rounded-lg shadow-md transition-all duration-200 active:scale-95"
              >
               <TrashIcon className="h-5 w-5" />
               Clear All App Data
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
