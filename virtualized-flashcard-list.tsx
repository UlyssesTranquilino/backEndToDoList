"use client";

import { memo, useMemo, useCallback, useState, useEffect, useRef } from "react";
import { FixedSizeList as List } from "react-window";
import { debounce, throttle } from "./performance-utils";

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
}

interface VirtualizedFlashcardListProps {
  flashcards: FlashcardData[];
  itemHeight: number;
  height: number;
  onCardSelect: (card: FlashcardData, index: number) => void;
  selectedIndex?: number;
  searchQuery?: string;
}

// Memoized individual flashcard item
const FlashcardListItem = memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: any; 
}) => {
  const { flashcards, onCardSelect, selectedIndex, searchQuery } = data;
  const card = flashcards[index];
  
  const isSelected = selectedIndex === index;
  
  // Highlight search matches
  const highlightText = useCallback((text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-black">{part}</mark>
      ) : (
        part
      )
    );
  }, []);

  const handleClick = useCallback(() => {
    onCardSelect(card, index);
  }, [card, index, onCardSelect]);

  return (
    <div 
      style={style}
      className={`px-4 py-2 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-800 ${
        isSelected ? 'bg-blue-900/30 border-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {highlightText(card.question, searchQuery || '')}
          </h4>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-300 truncate">
            {highlightText(card.answer, searchQuery || '')}
          </p>
        </div>
        <div className="text-xs text-gray-500 shrink-0">
          {index + 1}
        </div>
      </div>
    </div>
  );
});

FlashcardListItem.displayName = 'FlashcardListItem';

// Main virtualized list component
const VirtualizedFlashcardList = memo<VirtualizedFlashcardListProps>(({
  flashcards,
  itemHeight = 80,
  height = 400,
  onCardSelect,
  selectedIndex,
  searchQuery = ''
}) => {
  const listRef = useRef<List>(null);
  const [filteredCards, setFilteredCards] = useState(flashcards);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query: string, cards: FlashcardData[]) => {
      if (!query.trim()) {
        setFilteredCards(cards);
        return;
      }

      const lowercaseQuery = query.toLowerCase();
      const filtered = cards.filter(card => 
        card.question.toLowerCase().includes(lowercaseQuery) ||
        card.answer.toLowerCase().includes(lowercaseQuery)
      );
      
      setFilteredCards(filtered);
    }, 300),
    []
  );

  // Effect to handle search
  useEffect(() => {
    debouncedSearch(searchQuery, flashcards);
  }, [searchQuery, flashcards, debouncedSearch]);

  // Scroll to selected item
  useEffect(() => {
    if (selectedIndex !== undefined && listRef.current) {
      const adjustedIndex = Math.min(selectedIndex, filteredCards.length - 1);
      listRef.current.scrollToItem(adjustedIndex, 'smart');
    }
  }, [selectedIndex, filteredCards.length]);

  // Item data for react-window
  const itemData = useMemo(() => ({
    flashcards: filteredCards,
    onCardSelect,
    selectedIndex,
    searchQuery
  }), [filteredCards, onCardSelect, selectedIndex, searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!filteredCards.length) return;

    const currentIndex = selectedIndex ?? 0;
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(currentIndex + 1, filteredCards.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = filteredCards.length - 1;
        break;
      case 'PageDown':
        event.preventDefault();
        newIndex = Math.min(currentIndex + 10, filteredCards.length - 1);
        break;
      case 'PageUp':
        event.preventDefault();
        newIndex = Math.max(currentIndex - 10, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCards[currentIndex]) {
          onCardSelect(filteredCards[currentIndex], currentIndex);
        }
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex && filteredCards[newIndex]) {
      onCardSelect(filteredCards[newIndex], newIndex);
    }
  }, [filteredCards, selectedIndex, onCardSelect]);

  if (filteredCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        {searchQuery ? 'No flashcards match your search' : 'No flashcards available'}
      </div>
    );
  }

  return (
    <div 
      className="border border-gray-700 rounded-lg overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <List
        ref={listRef}
        height={height}
        itemCount={filteredCards.length}
        itemSize={itemHeight}
        itemData={itemData}
        className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {FlashcardListItem}
      </List>
    </div>
  );
});

VirtualizedFlashcardList.displayName = 'VirtualizedFlashcardList';

export default VirtualizedFlashcardList;