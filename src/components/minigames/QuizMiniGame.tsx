
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface QuizMiniGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onGameEnd: (score: number) => void;
  duration: number;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

// Questions database organized by difficulty
const QUESTIONS = {
  easy: [
    {
      question: "What is the most common dice roll in craps?",
      options: ["7", "6", "2", "12"],
      correctAnswer: 0
    },
    {
      question: "In blackjack, what is the value of a King?",
      options: ["1", "5", "10", "11"],
      correctAnswer: 2
    },
    {
      question: "Which card game uses the term 'hit'?",
      options: ["Poker", "Blackjack", "Roulette", "Baccarat"],
      correctAnswer: 1
    },
    {
      question: "How many cards are dealt to each player in Texas Hold'em?",
      options: ["1", "2", "3", "5"],
      correctAnswer: 1
    },
    {
      question: "What does 'bust' mean in blackjack?",
      options: ["Win big", "Lose all money", "Go over 21", "Tie with dealer"],
      correctAnswer: 2
    }
  ],
  medium: [
    {
      question: "In poker, which hand beats a straight?",
      options: ["Flush", "Three of a kind", "Two pair", "Full house"],
      correctAnswer: 0
    },
    {
      question: "What's the minimum number needed for a win in keno?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 0
    },
    {
      question: "In roulette, what's the payout for betting on a single number?",
      options: ["17:1", "25:1", "35:1", "50:1"],
      correctAnswer: 2
    },
    {
      question: "What is a 'natural' in baccarat?",
      options: ["First card is an ace", "Hand totals 8 or 9", "All cards same suit", "Player wins three hands in a row"],
      correctAnswer: 1
    },
    {
      question: "In craps, what's a 'hardway' bet?",
      options: ["Betting on 2 or 12", "Betting on doubles", "Betting against the shooter", "Betting on 7"],
      correctAnswer: 1
    }
  ],
  hard: [
    {
      question: "In baccarat, what is the maximum value a hand can have?",
      options: ["9", "10", "11", "21"],
      correctAnswer: 0
    },
    {
      question: "Which casino game typically has the lowest house edge?",
      options: ["Slots", "Blackjack", "American Roulette", "Keno"],
      correctAnswer: 1
    },
    {
      question: "What is the 'Gambler's Fallacy'?",
      options: [
        "Believing gambling always leads to addiction",
        "Believing losses increase chance of future wins",
        "Believing in lucky charms",
        "The tendency to bet more after winning"
      ],
      correctAnswer: 1
    },
    {
      question: "In video poker, what is a 'royal flush'?",
      options: [
        "A-K-Q-J-10 of the same suit",
        "Five cards of the same suit",
        "Five cards in sequence",
        "Four aces and a king"
      ],
      correctAnswer: 0
    },
    {
      question: "What is the probability of rolling a 7 with two dice?",
      options: ["1/6", "1/8", "1/12", "1/36"],
      correctAnswer: 0
    }
  ]
};

const QuizMiniGame = ({ difficulty, onGameEnd, duration }: QuizMiniGameProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  
  // Set up questions based on difficulty
  useEffect(() => {
    // Shuffle questions and limit to 10 or available amount
    const shuffledQuestions = [...QUESTIONS[difficulty]].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
  }, [difficulty]);
  
  // Timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      onGameEnd(score);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, onGameEnd, score]);
  
  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    const isCorrect = answerIndex === questions[currentQuestionIndex].correctAnswer;
    
    if (isCorrect) {
      // Calculate score based on difficulty and answer speed
      // More points for harder difficulty and quicker answers
      let pointValue = 10; // base points
      
      // Difficulty multiplier
      if (difficulty === 'medium') pointValue *= 1.5;
      if (difficulty === 'hard') pointValue *= 2;
      
      // Streak bonus
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Apply streak bonus (10% per question in streak)
      const streakMultiplier = 1 + (newStreak * 0.1);
      pointValue *= streakMultiplier;
      
      setScore(prev => prev + Math.floor(pointValue));
    } else {
      setStreak(0);
    }
    
    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setHasAnswered(false);
        setSelectedAnswer(null);
      } else {
        // End game if no more questions
        onGameEnd(score);
      }
    }, 1500);
  };
  
  // If no questions loaded yet
  if (questions.length === 0) {
    return <div className="flex items-center justify-center h-40">Loading...</div>;
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="bg-muted rounded-lg p-4">
      {/* Timer */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-xs">Time: {timeRemaining}s</span>
          <span className="text-xs">Score: {score}</span>
        </div>
        <Progress value={(timeRemaining / duration) * 100} />
      </div>
      
      {/* Question counter */}
      <div className="text-xs text-right mb-2">
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>
      
      {streak > 2 && (
        <div className="text-xs text-center mb-2 gold-text">
          {streak} Question Streak! ({Math.floor(streak * 10)}% Bonus)
        </div>
      )}
      
      {/* Question */}
      <div className="font-bold mb-4">{currentQuestion.question}</div>
      
      {/* Answer options */}
      <div className="grid grid-cols-1 gap-2">
        {currentQuestion.options.map((option, index) => (
          <Button
            key={index}
            variant={selectedAnswer === null ? "outline" : 
                   selectedAnswer === index ? 
                     (index === currentQuestion.correctAnswer ? "success" : "destructive") :
                     index === currentQuestion.correctAnswer && hasAnswered ? 
                       "success" : "outline"}
            className="justify-start"
            onClick={() => handleAnswer(index)}
            disabled={hasAnswered}
          >
            <div className="flex items-center w-full justify-between">
              <span>{option}</span>
              {hasAnswered && index === currentQuestion.correctAnswer && (
                <Check className="text-green-600" />
              )}
              {hasAnswered && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                <X className="text-red-600" />
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuizMiniGame;
