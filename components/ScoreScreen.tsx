import React, { useState } from 'react';
import { Question } from '../types';
import { CheckIcon, XIcon, RestartIcon, LightbulbIcon, SpinnerIcon, HomeIcon, BackIcon } from './icons';
import { GoogleGenAI } from '@google/genai';
import { KnowledgeTopic } from '../emt-knowledge-base';

interface ScoreScreenProps {
  score: number;
  questions: Question[];
  userAnswers: (string | null)[];
  topics: string[];
  knowledgeBase: KnowledgeTopic[];
  title?: string;
  onRegenerate?: () => void;
  onNewQuiz?: () => void;
  onBackToHistory?: () => void;
}

const ScoreScreen: React.FC<ScoreScreenProps> = ({ score, questions, userAnswers, topics, knowledgeBase, title, onRegenerate, onNewQuiz, onBackToHistory }) => {
  const [explanations, setExplanations] = useState<{ [key: number]: { loading: boolean; text: string | null; error: string | null } }>({});
  
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const handleGetExplanation = async (question: Question, userAnswer: string | null) => {
    const questionId = question.id;
    setExplanations(prev => ({ ...prev, [questionId]: { loading: true, text: null, error: null } }));

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const relevantKnowledge = knowledgeBase
            .filter(kb => topics.includes(kb.topic))
            .map(kb => `Topic: ${kb.topic}\nContent: ${kb.content}`)
            .join('\n\n---\n\n');

        const correctAnswer = question.options.find(opt => opt.isCorrect)?.text;

        const prompt = `
            You are an expert EMT instructor. Based on the provided EMT knowledge base, explain the answer to the following quiz question.
            
            **Knowledge Base Context:**
            ${relevantKnowledge}

            **Quiz Question:**
            "${question.questionText}"

            **Options:**
            ${question.options.map(o => `- ${o.text}`).join('\n')}

            **The Correct Answer is:**
            "${correctAnswer}"

            **The student answered:**
            "${userAnswer || 'Not answered'}"

            Please provide a clear and concise explanation for why the correct answer is right. If the student's answer was incorrect, also explain why their choice was wrong. Structure the explanation for easy learning.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const explanationText = response.text;
        setExplanations(prev => ({ ...prev, [questionId]: { loading: false, text: explanationText, error: null } }));

    } catch (err) {
        console.error("Failed to get explanation:", err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setExplanations(prev => ({ ...prev, [questionId]: { loading: false, text: null, error: `Failed to load explanation. Please try again.` } }));
    }
  };


  const getResultColor = (p: number) => {
    if (p >= 75) return 'text-green-500 dark:text-green-400';
    if (p >= 50) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const colorClass = getResultColor(percentage);

  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">{title || 'Quiz Completed!'}</h2>
        <div className="relative inline-flex items-center justify-center my-4">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-gray-200 dark:text-gray-700"/>
            <circle
              cx={size/2}
              cy={size/2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${colorClass.replace('text-green-500', 'stroke-green-500').replace('text-yellow-500', 'stroke-yellow-500').replace('text-red-500', 'stroke-red-500').replace('dark:text-green-400', 'dark:stroke-green-400').replace('dark:text-yellow-400', 'dark:stroke-yellow-400').replace('dark:text-red-400', 'dark:stroke-red-400')} transition-all duration-1000 ease-out`}
            />
          </svg>
          <span className={`absolute text-4xl font-bold ${colorClass}`}>{percentage}%</span>
        </div>
        <p className="text-3xl font-bold">You scored {score} out of {questions.length}</p>
      </div>

      <div className="space-y-4 mb-8 stagger-children">
        <h3 className="text-2xl font-semibold text-center mb-4" style={{ animationDelay: '100ms' }}>Review Your Answers</h3>
        {questions.map((question, index) => {
          const userAnswer = userAnswers[index];
          const correctAnswer = question.options.find(opt => opt.isCorrect)?.text;
          const isCorrect = userAnswer === correctAnswer;
          const explanationState = explanations[question.id];

          return (
            <div 
              key={question.id} 
              className="bg-white dark:bg-gray-800 p-5 rounded-lg border-l-4" 
              style={{ 
                borderColor: isCorrect ? '#22c55e' : '#ef4444',
                animationDelay: `${200 + index * 100}ms`
              }}
            >
              <p className="font-semibold text-lg mb-3">{index + 1}. {question.questionText}</p>
              
              {!isCorrect && (
                <div className="flex items-start p-3 rounded-md bg-red-50 dark:bg-red-900/40 mb-2">
                  <XIcon className="h-5 w-5 mr-3 mt-1 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-600 dark:text-red-400">Your Answer</p>
                    <p className="text-gray-800 dark:text-gray-300">{userAnswer || "Not answered"}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start p-3 rounded-md bg-green-50 dark:bg-green-900/40">
                <CheckIcon className="h-5 w-5 mr-3 mt-1 text-green-500 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-600 dark:text-green-400">Correct Answer</p>
                  <p className="text-gray-800 dark:text-gray-300">{correctAnswer}</p>
                </div>
              </div>

              {!isCorrect && (
                <div className="mt-4 text-right">
                  <button
                    onClick={() => handleGetExplanation(question, userAnswer)}
                    disabled={explanationState?.loading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-200 hover:bg-gray-300 text-teal-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-teal-300 rounded-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                    aria-label={`Get explanation for question ${index + 1}`}
                  >
                    {explanationState?.loading ? (
                      <SpinnerIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      <LightbulbIcon className="h-5 w-5" />
                    )}
                    Explain Answer
                  </button>
                </div>
              )}
              
              {explanationState && explanationState.text && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 animate-fadeIn">
                  <h4 className="font-semibold text-teal-500 dark:text-teal-400 mb-2 flex items-center gap-2">
                    <LightbulbIcon className="h-5 w-5" />
                    AI Explanation
                  </h4>
                  <p className="text-gray-800 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{explanationState.text}</p>
                </div>
              )}

              {explanationState && explanationState.error && (
                 <div className="mt-4 p-3 text-center bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md text-sm">
                  {explanationState.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-center">
        {onBackToHistory ? (
          <button
            onClick={onBackToHistory}
            className="inline-flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-bold rounded-lg shadow-lg hover:bg-teal-700 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
          >
            <BackIcon className="h-6 w-6 mr-3" />
            Back to History
          </button>
        ) : onRegenerate && onNewQuiz ? (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onRegenerate}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-teal-600 text-white font-bold rounded-lg shadow-lg hover:bg-teal-700 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
            >
              <RestartIcon className="h-6 w-6 mr-3" />
              Try Again
            </button>
            <button
              onClick={onNewQuiz}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white font-bold rounded-lg shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
            >
              <HomeIcon className="h-6 w-6 mr-3" />
              New Quiz
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ScoreScreen;
