import React, { useState, useCallback, useEffect } from 'react';
import { Question, QuizResult, QuestionType } from './types';
import StartScreen from './components/StartScreen';
import ScoreScreen from './components/ScoreScreen';
import HistoryScreen from './components/HistoryScreen';
import { GoogleGenAI, Type } from "@google/genai";
import { KnowledgeTopic, emtKnowledgeBase } from './emt-knowledge-base';
import { BackIcon, CircleCheckIcon, LightbulbIcon, MoonIcon, SunIcon } from './components/icons';

type QuizState = 'not-started' | 'in-progress' | 'completed' | 'history' | 'reviewing';
type Theme = 'light' | 'dark';

interface QuizConfig {
  difficulty: 'Easy' | 'Hard';
  questionType: QuestionType;
  topics: string[];
}

const App: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>('not-started');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [score, setScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [quizToReview, setQuizToReview] = useState<QuizResult | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeTopic[]>(emtKnowledgeBase);
  const [theme, setTheme] = useState<Theme>('dark');
  

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('emtQuizTheme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }

    // Load data from local storage
    try {
      const savedHistory = localStorage.getItem('emtQuizHistory');
      if (savedHistory) {
        const parsedHistory: QuizResult[] = JSON.parse(savedHistory);
        // Migration for old history items that don't have questionType
        const migratedHistory = parsedHistory.map(item => ({
            ...item,
            questionType: item.questionType || (item.difficulty === 'Easy' ? 'Knowledge-Based' : 'Scenario-Based')
        }));
        setQuizHistory(migratedHistory);
      }
    } catch (error) {
      console.error("Failed to load quiz history:", error);
      setQuizHistory([]);
    }
     try {
      const savedCustomTopics = localStorage.getItem('emtCustomTopics');
      if (savedCustomTopics) {
        const customTopics: KnowledgeTopic[] = JSON.parse(savedCustomTopics);
        setKnowledgeBase(prevBase => [...prevBase, ...customTopics]);
      }
    } catch (error) {
      console.error("Failed to load custom topics:", error);
    }
  }, []);

  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      metaThemeColor?.setAttribute('content', '#111827'); // dark:bg-gray-900
    } else {
      document.documentElement.classList.remove('dark');
      metaThemeColor?.setAttribute('content', '#F3F4F6'); // bg-gray-100
    }
    localStorage.setItem('emtQuizTheme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleAddCustomTopic = (topic: KnowledgeTopic) => {
    if (knowledgeBase.some(kb => kb.topic.toLowerCase() === topic.topic.toLowerCase())) {
        alert(`A topic with the name "${topic.topic}" already exists. Please choose a different name.`);
        return;
    }
    const updatedKnowledgeBase = [...knowledgeBase, topic];
    setKnowledgeBase(updatedKnowledgeBase);
    
    const customTopics = updatedKnowledgeBase.filter(t => t.isCustom);
    localStorage.setItem('emtCustomTopics', JSON.stringify(customTopics));
  };
  
  const handleDeleteCustomTopic = (topicName: string) => {
      const updatedKnowledgeBase = knowledgeBase.filter(kb => kb.topic !== topicName);
      setKnowledgeBase(updatedKnowledgeBase);
      
      const customTopics = updatedKnowledgeBase.filter(t => t.isCustom);
      localStorage.setItem('emtCustomTopics', JSON.stringify(customTopics));
  };
  
  const generateQuizQuestions = useCallback(async (questionType: 'Knowledge-Based' | 'Scenario-Based', difficulty: 'Easy' | 'Hard', numQuestions: number, selectedTopics: string[], previousQuestions: Question[] = []): Promise<Question[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const schema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          description: "An array of quiz questions.",
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING, description: "The text of the question." },
              options: {
                type: Type.ARRAY,
                description: "An array of 4 possible answers.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: "The answer option text." },
                    isCorrect: { type: Type.BOOLEAN, description: "True if this is the correct answer, false otherwise." },
                  },
                  required: ['text', 'isCorrect'],
                },
              },
            },
            required: ['questionText', 'options'],
          },
        },
      },
      required: ['questions'],
    };

    const questionTypeInstruction = questionType === 'Knowledge-Based'
        ? 'The questions should be straightforward, knowledge-based questions, testing basic definitions, normal ranges, and direct facts from the text. Avoid complex scenarios.'
        : 'The questions should be complex, scenario-based problems that require critical thinking and application of knowledge to a situation. Avoid simple definition questions.';

    const difficultyInstruction = `The questions must be at a "${difficulty}" difficulty level. An easy question has obvious correct answers and distractors. A hard question requires deeper analysis, has subtle distractors, or combines multiple concepts.`;


    const availableTopics = knowledgeBase.filter(kbTopic => selectedTopics.includes(kbTopic.topic));
    
    if (availableTopics.length === 0) {
      throw new Error("No topics were provided for quiz generation.");
    }
    
    const knowledgeBaseForPrompt = availableTopics.map(item => `
      Topic: ${item.topic}
      ---
      ${item.content}
      ---
    `).join('\n\n');

    let exclusionInstruction = '';
    if (previousQuestions.length > 0) {
        const previousQuestionTexts = previousQuestions.map(q => `- "${q.questionText}"`).join('\n');
        exclusionInstruction = `
      6.  **Avoid Repetition:** The user has just answered a quiz. Generate a completely new set of questions that are substantially different from the following previous ones and cover different aspects of the topics:
          ${previousQuestionTexts}
        `;
    }

    const prompt = `
      You are an expert EMT quiz generator. Your task is to create a set of multiple-choice questions based on the provided EMT knowledge base.

      **Instructions:**
      1.  **Total Questions:** Generate exactly ${numQuestions} questions.
      2.  **Question Type:** The questions must be: **${questionType}**.
          - ${questionTypeInstruction}
      3.  **Difficulty Level:** The questions must be: **${difficulty}**.
          - ${difficultyInstruction}
      4.  **Topic Coverage:** This is crucial. Distribute the ${numQuestions} questions as evenly as possible across all the provided topics: [${selectedTopics.join(', ')}]. If the number of questions is greater than or equal to the number of selected topics, ensure every single selected topic is represented in the quiz.
      5.  **Question Format:** Each question must have exactly 4 answer options, and only one option can be correct.
      ${exclusionInstruction}
      
      **EMT Knowledge Base:**
      ${knowledgeBaseForPrompt}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const jsonResponseText = response.text.trim();
    const parsedJson = JSON.parse(jsonResponseText);
    
    if (!parsedJson.questions || !Array.isArray(parsedJson.questions)) {
        throw new Error("Invalid response format from AI.");
    }
    
    return parsedJson.questions.map((q: any, index: number) => ({
      ...q,
      id: Date.now() + index,
      difficulty: difficulty,
    }));
  }, [knowledgeBase]);

  const handleStartQuizFlow = useCallback(async (questionType: 'Knowledge-Based' | 'Scenario-Based', difficulty: 'Easy' | 'Hard', numQuestions: number, selectedTopics: string[], previousQuestions: Question[] = []) => {
      if (!selectedTopics || selectedTopics.length === 0) {
        throw new Error("Please select at least one topic to start the quiz.");
      }
      const generatedQuestions = await generateQuizQuestions(questionType, difficulty, numQuestions, selectedTopics, previousQuestions);
      
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("AI failed to generate questions. Please try again.");
      }

      setQuestions(generatedQuestions);
      setUserAnswers(new Array(generatedQuestions.length).fill(null));
      setScore(0);
      setQuizState('in-progress');
  }, [generateQuizQuestions]);

  const handleStart = useCallback(async (questionType: QuestionType, difficulty: 'Easy' | 'Hard', numQuestions: number, selectedTopics: string[]) => {
    setIsLoading(true);
    setError(null);
    setCurrentQuizConfig({ difficulty, questionType, topics: selectedTopics });

    try {
      await handleStartQuizFlow(questionType, difficulty, numQuestions, selectedTopics);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to start. ${errorMessage}`);
      setQuizState('not-started');
    } finally {
      setIsLoading(false);
    }
  }, [handleStartQuizFlow]);
  
  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      const correctAnswer = question.options.find(opt => opt.isCorrect)?.text;
      if (userAnswers[index] === correctAnswer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);

    if (currentQuizConfig) {
      const newResult: QuizResult = {
        id: Date.now(),
        date: new Date().toISOString(),
        score: correctAnswers,
        totalQuestions: questions.length,
        percentage: questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0,
        questions,
        userAnswers,
        difficulty: currentQuizConfig.difficulty,
        questionType: currentQuizConfig.questionType,
        topics: currentQuizConfig.topics,
      };

      try {
        const updatedHistory = [newResult, ...quizHistory];
        setQuizHistory(updatedHistory);
        localStorage.setItem('emtQuizHistory', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Failed to save quiz history:", error);
      }
    }
    
    setQuizState('completed');
  };
  
  const handleRegenerateQuiz = useCallback(async () => {
    if (currentQuizConfig && questions.length > 0) {
      await handleStartQuizFlow(currentQuizConfig.questionType, currentQuizConfig.difficulty, questions.length, currentQuizConfig.topics, questions);
    } else {
      handleRestartQuiz();
    }
  }, [currentQuizConfig, questions, handleStartQuizFlow]);

  const handleRestartQuiz = () => {
    setQuizState('not-started');
    setQuestions([]);
    setUserAnswers([]);
    setScore(0);
    setError(null);
    setCurrentQuizConfig(null);
  };

  const handleViewHistory = () => setQuizState('history');
  
  const handleReviewQuiz = (quiz: QuizResult) => {
    setQuizToReview(quiz);
    setQuizState('reviewing');
  };

  const handleBackToHistory = () => {
    setQuizToReview(null);
    setQuizState('history');
  };
  
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all quiz history and custom topics? This action cannot be undone.")) {
      try {
        localStorage.removeItem('emtQuizHistory');
        setQuizHistory([]);
        localStorage.removeItem('emtCustomTopics');
        setKnowledgeBase(emtKnowledgeBase);
      } catch (error) {
        console.error("Failed to clear app data:", error);
        setError("Could not clear history and topics. Please try again.");
      }
    }
  };
  
  const renderQuizContent = () => {
    switch(quizState) {
      case 'in-progress':
        const answeredCount = userAnswers.filter(a => a !== null).length;
        const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
        
        return (
          <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {currentQuizConfig?.difficulty} {currentQuizConfig?.questionType} Quiz
            </h2>
             <p className="text-center text-gray-600 dark:text-gray-400 mb-6">{`Answered ${answeredCount} of ${questions.length}`}</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
              <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">Question Navigator</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {questions.map((_, qIndex) => {
                  const isAnswered = userAnswers[qIndex] !== null;
                  return (
                    <button
                      key={`nav-${qIndex}`}
                      onClick={() => document.getElementById(`question-${qIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      className={`flex items-center justify-center h-10 w-10 rounded-full font-bold text-sm transition-all duration-200 active:scale-90 ${
                        isAnswered 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                      }`}
                      aria-label={`Go to question ${qIndex + 1}${isAnswered ? ', answered' : ''}`}
                    >
                      {isAnswered ? <CircleCheckIcon className="h-6 w-6" /> : qIndex + 1}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-6 stagger-children">
              {questions.map((question, qIndex) => (
                <div id={`question-${qIndex}`} key={question.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 scroll-mt-24" style={{ animationDelay: `${qIndex * 100}ms` }}>
                  <p className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {qIndex + 1}. {question.questionText}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {question.options.map(option => (
                      <button
                        key={option.text}
                        onClick={() => handleAnswerSelect(qIndex, option.text)}
                        className={`p-4 rounded-lg text-left transition-all duration-200 border-2 active:scale-95 ${
                          userAnswers[qIndex] === option.text
                            ? 'bg-blue-600 border-blue-400 ring-2 ring-blue-400 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border-transparent text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button
                onClick={handleSubmitQuiz}
                disabled={userAnswers.includes(null)}
                className="px-10 py-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
              >
                Submit Answers
              </button>
               {userAnswers.includes(null) && (
                <p className="text-gray-500 mt-3 text-sm">Please answer all questions to submit.</p>
               )}
            </div>
          </div>
        );
      case 'completed':
        return <ScoreScreen 
                  score={score} 
                  questions={questions} 
                  userAnswers={userAnswers} 
                  onNewQuiz={handleRestartQuiz}
                  onRegenerate={handleRegenerateQuiz}
                  topics={currentQuizConfig?.topics || []}
                  knowledgeBase={knowledgeBase}
                  title={`${currentQuizConfig?.difficulty} ${currentQuizConfig?.questionType} Quiz Completed!`}
                />;
      case 'reviewing':
        if (!quizToReview) return null;
        return <ScoreScreen 
          score={quizToReview.score}
          questions={quizToReview.questions}
          userAnswers={quizToReview.userAnswers}
          onBackToHistory={handleBackToHistory}
          topics={quizToReview.topics}
          knowledgeBase={knowledgeBase}
          title={`${quizToReview.difficulty} ${quizToReview.questionType} Quiz Review`}
        />;
      case 'history':
        return <HistoryScreen 
          history={quizHistory}
          onReview={handleReviewQuiz}
          onBack={handleRestartQuiz}
          onClearHistory={handleClearHistory}
        />;
      case 'not-started':
      default:
        return <StartScreen 
          onStart={handleStart} 
          isLoading={isLoading} 
          error={error} 
          knowledgeBase={knowledgeBase}
          onViewHistory={handleViewHistory}
          onAddTopic={handleAddCustomTopic}
          onDeleteTopic={handleDeleteCustomTopic}
        />;
    }
  };

  return (
    <div className="app-background min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/50 selection:text-white transition-colors duration-300">
      <main className="w-full flex-grow flex items-center justify-center">
        <div key={quizState} className="animate-page-enter">
          {renderQuizContent()}
        </div>
      </main>
      <footer className="w-full text-center py-4 text-gray-500 dark:text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-4">
          <p>Powered by Rajesh N - EMT</p>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </button>
          <p>AI by Gemini</p>
        </div>
      </footer>
    </div>
  );
};

export default App;