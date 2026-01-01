import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchLocations, type LocationResult } from "@/services/geocoding";

interface DestinationInputProps {
  value: string;
  onChange: (value: string, location?: LocationResult) => void;
  placeholder?: string;
  className?: string;
}

export function DestinationInput({
  value,
  onChange,
  placeholder = "Søg destination...",
  className,
}: DestinationInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchLocations(searchQuery);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange(newQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      handleSearch(newQuery);
    }, 300);
  };

  const handleSelect = (location: LocationResult) => {
    setQuery(location.displayName);
    onChange(location.displayName, location);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-14 pl-12 pr-12 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-card transition-all text-lg"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 py-2 rounded-xl border border-border bg-card shadow-lg max-h-64 overflow-auto animate-fade-in">
          {suggestions.map((location, index) => (
            <button
              key={location.id}
              onClick={() => handleSelect(location)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                index === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              )}
            >
              <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{location.name}</p>
                {location.country && (
                  <p className="text-sm text-muted-foreground truncate">
                    {location.country}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
