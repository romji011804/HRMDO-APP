import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../../app/components/ui/button";
import { Input } from "../../../app/components/ui/input";
import {
  getMatchingOjtRecentInputs,
  getOjtRecentInputs,
  removeOjtRecentInput,
  type OjtInputFieldKey,
} from "../recentInputHistory";

interface OjtInputAutocompleteProps {
  field: OjtInputFieldKey;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  id?: string;
}

export function OjtInputAutocomplete({
  field,
  value,
  placeholder,
  onChange,
  id,
}: OjtInputAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const suggestions = useMemo(() => {
    const source = value.trim() ? getMatchingOjtRecentInputs(field, value) : getOjtRecentInputs(field);
    return source;
  }, [field, value, historyVersion]);

  const isDropdownOpen = isFocused && suggestions.length > 0;

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsFocused(false);
  };

  const handleDelete = (suggestion: string) => {
    removeOjtRecentInput(field, suggestion);
    setHistoryVersion((current) => current + 1);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onFocus={() => setIsFocused(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setIsFocused(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsFocused(false);
            (event.target as HTMLInputElement).blur();
          }
        }}
        autoComplete="off"
      />

      {isDropdownOpen && (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
                className="flex-1 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                {suggestion}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleDelete(suggestion)}
                className="mr-2 h-8 w-8 text-gray-400 hover:text-red-500"
                aria-label={`Delete ${suggestion}`}
                title="Remove suggestion"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
