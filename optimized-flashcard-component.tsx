"use client";

import { memo, useCallback, useMemo, useState, useRef, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useFlashcard } from "@/app/context/FlashcardContext";
import { useWpm } from "@/app/context/WpmContext";
import { motion, AnimatePresence } from "framer-motion";
import { flushSync } from "react-dom";

// Lazy load heavy components
const Dialog = lazy(() => import("@/components/ui/dialog").then(m => ({ default: m.Dialog })));
const DialogContent = lazy(() => import("@/components/ui/dialog").then(m => ({ default: m.DialogContent })));
const Carousel = lazy(() => import("@/components/ui/carousel").then(m => ({ default: m.Carousel })));
const CarouselContent = lazy(() => import("@/components/ui/carousel").then(m => ({ default: m.CarouselContent })));
const CarouselItem = lazy(() => import("@/components/ui/carousel").then(m => ({ default: m.CarouselItem })));

// Lazy load utilities and APIs
const flashcardAPI = lazy(() => import("../../../../utils/flashcard/flashcard"));
const DropdownMenu = lazy(() => import("@/components/ui/dropdown-menu").then(m => ({ default: m.DropdownMenu })));

// Optimized icon imports - only import what we need
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeClosed,
  Keyboard,
  Shuffle,
  RotateCcw,
  Rewind,
  Check,
  X,
  CircleX,
  EllipsisVertical,
  Pencil,
  Trash2
} from "lucide-react";

// Utility functions moved outside component to prevent recreations
const loadSettings = () => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("flashcardSettings");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const saveSettings = (settings: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("flashcardSettings", JSON.stringify(settings));
  }
};

// Memoized text highlighting component
const HighlightedText = memo(({ 
  text, 
  userInput, 
  isIdle 
}: { 
  text: string; 
  userInput: string; 
  isIdle: boolean; 
}) => {
  const highlightedText = useMemo(() => {
    if (!text) return null;

    const words = text.split(" ");
    let charIndex = 0;

    return words.map((word, wordIndex) => {
      const wordSpans = word.split("").map((char, charIndexInWord) => {
        const globalCharIndex = charIndex + charIndexInWord;
        const userChar = userInput[globalCharIndex];
        const isTyped = globalCharIndex < userInput.length;
        const isCorrect = userChar === char;
        const isCursor = globalCharIndex === userInput.length;

        const className = isTyped
          ? isCorrect
            ? "text-white"
            : "text-red-600/75 bg-red-900/30"
          : "text-gray-500";

        return (
          <span key={`${wordIndex}-${charIndexInWord}`} className="relative">
            {isCursor && (
              <span
                className={`absolute left-0 top-1 lg:top-[9px] w-0.5 h-6 bg-blue-400 ${
                  isIdle ? "animate-pulse" : ""
                }`}
              />
            )}
            <span className={className}>{char}</span>
          </span>
        );
      });

      charIndex += word.length;
      const spaceIndex = charIndex;
      const hasSpace = wordIndex < words.length - 1;

      if (hasSpace) {
        const userSpaceChar = userInput[spaceIndex];
        const isSpaceTyped = spaceIndex < userInput.length;
        const isSpaceCorrect = userSpaceChar === " ";
        const isSpaceCursor = spaceIndex === userInput.length;

        charIndex += 1;

        const spaceElement = (
          <span key={`space-${wordIndex}`} className="relative">
            {isSpaceCursor && (
              <span
                className={`absolute left-0 top-1 lg:top-[9px] w-0.5 h-6 bg-blue-400 ${
                  isIdle ? "animate-pulse" : ""
                }`}
              />
            )}
            <span
              className={
                isSpaceTyped
                  ? isSpaceCorrect
                    ? "text-white"
                    : "text-red-600/75 bg-red-900/30"
                  : "text-gray-500"
              }
            >
              {"\u00A0"}
            </span>
          </span>
        );

        return (
          <span key={wordIndex} className="inline-block whitespace-nowrap">
            {wordSpans}
            {spaceElement}
          </span>
        );
      }

      return (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {wordSpans}
        </span>
      );
    });
  }, [text, userInput, isIdle]);

  return (
    <div className="flex flex-wrap justify-center text-center mx-auto">
      {highlightedText}
    </div>
  );
});

HighlightedText.displayName = "HighlightedText";

// Memoized flashcard item component
const FlashcardItem = memo(({ 
  item, 
  index, 
  currentPhase,
  currentTerm,
  userInput,
  isIdle,
  isTypingMode,
  blurAnswer,
  questionCompleted,
  cardCompleted,
  correct,
  userAnswer,
  onPhaseChange,
  onBlurToggle,
  onFlipCard,
  onAnswerSubmit,
  onUserAnswerChange,
  isFullScreen
}: any) => {
  const textContainerRef = useRef<HTMLDivElement>(null);
  
  const currentText = currentPhase === "question" ? currentTerm?.question : currentTerm?.answer;

  return (
    <div
      className={`max-w-[1100px] rounded-2xl bg-gray-900/70 relative overflow-hidden ${
        isFullScreen ? "h-100" : "h-100 md:h-110"
      }`}
    >
      <div
        className="flex flex-col items-center justify-center h-full p-2 md:p-4"
        onClick={onFlipCard}
        style={{ perspective: "1000px" }}
        tabIndex={0}
      >
        <motion.div
          className="w-full h-full relative"
          animate={{
            rotateY: currentPhase === "question" ? 0 : 180,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* Question Side */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 backface-hidden"
            style={{
              backfaceVisibility: "hidden",
              display: currentPhase === "question" ? "flex" : "none",
            }}
          >
            <div className="absolute top-6 right-0 w-full items-center flex justify-between px-3">
              <div className="flex items-center gap-3">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhaseChange("question");
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm cursor-pointer ${
                    currentPhase === "question"
                      ? "bg-blue-600/20 text-blue-400"
                      : questionCompleted
                      ? "bg-green-600/20 text-green-400"
                      : "bg-gray-600/20 text-gray-400"
                  }`}
                >
                  {questionCompleted && <CheckCircle className="w-4 h-4" />}
                  <span className="text-xs">Question</span>
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhaseChange("answer");
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm cursor-pointer ${
                    currentPhase === "answer"
                      ? "bg-blue-600/20 text-blue-400"
                      : cardCompleted
                      ? "bg-green-600/20 text-green-400"
                      : "bg-gray-600/20 text-gray-400"
                  }`}
                >
                  {cardCompleted && <CheckCircle className="w-4 h-4" />}
                  <span className="text-xs">Answer</span>
                </div>
              </div>
              
              {isTypingMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlurToggle();
                  }}
                  className={`flex items-center gap-2 text-[0.9rem] transition px-3 lg:px-2 ${
                    blurAnswer ? "text-blue-400" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {!blurAnswer ? <Eye className="scale-78" /> : <EyeClosed className="scale-78" />}
                </button>
              )}
            </div>

            <h2 className="text-sm md:text-base text-center text-gray-400 mb-4 mt-10">
              {isTypingMode ? "Type the question:" : "Question:"}
            </h2>

            <div
              ref={textContainerRef}
              className="text-center flex items-center justify-center w-full max-w-[600px]"
            >
              <motion.div
                key={`${index}-question`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl text-center font-mono leading-relaxed mb-8 sm:px-4 cursor-text whitespace-pre transition-all duration-300"
              >
                {isTypingMode ? (
                  <HighlightedText 
                    text={currentText} 
                    userInput={userInput} 
                    isIdle={isIdle}
                  />
                ) : (
                  <p className="whitespace-pre-line">{currentTerm?.question}</p>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Answer Side */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 backface-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              display: currentPhase === "answer" ? "flex" : "none",
            }}
          >
            {/* Similar structure for answer side... */}
            <h2 className="text-sm md:text-base text-gray-400 mb-4 mt-10">
              {isTypingMode
                ? blurAnswer
                  ? "Type your answer and press Enter:"
                  : "Type the answer:"
                : "Answer:"}
            </h2>

            <div className="text-center flex items-center justify-center w-full max-w-[600px]">
              {blurAnswer && isTypingMode ? (
                <input
                  value={userAnswer}
                  type="text"
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="Type your answer here..."
                  onKeyDown={onAnswerSubmit}
                  onChange={onUserAnswerChange}
                  autoFocus
                />
              ) : (
                <motion.div
                  key={`${index}-answer`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl md:text-2xl text-center font-mono leading-relaxed mb-8 sm:px-4 cursor-text whitespace-pre transition-all duration-300"
                >
                  {isTypingMode ? (
                    <HighlightedText 
                      text={currentText} 
                      userInput={userInput} 
                      isIdle={isIdle}
                    />
                  ) : (
                    <p className="whitespace-pre-line">{currentTerm?.answer}</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Status indicators */}
            {cardCompleted && correct && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-green-400 text-center mt-6"
              >
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">Card completed!</span>
              </motion.div>
            )}

            {cardCompleted && !correct && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mt-6"
              >
                <CircleX className="text-red-400 w-8 h-8 mx-auto mb-2" />
                <span className="text-red-400 text-sm">Wrong Answer!</span>
                <div className="mt-1">Correct Answer: {currentTerm?.answer}</div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
});

FlashcardItem.displayName = "FlashcardItem";

// Main optimized component
const OptimizedFlashcardPageClient = memo(({ slug }: { slug: string }) => {
  // ... rest of component logic with performance optimizations
  // (This would include the full component logic with the optimizations applied)
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* Component JSX */}
    </Suspense>
  );
});

OptimizedFlashcardPageClient.displayName = "OptimizedFlashcardPageClient";

export default OptimizedFlashcardPageClient;