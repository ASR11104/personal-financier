import { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/format';

interface TagOption {
  id: string;
  name: string;
  color?: string;
}

interface MultiSelectProps {
  label?: string;
  options: TagOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ label, options, value, onChange, placeholder = 'Select options', className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen]);

    const selectedOptions = options.filter((opt) => value.includes(opt.id));

    const filteredOptions = options.filter((option) =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = (optionId: string) => {
      if (value.includes(optionId)) {
        onChange(value.filter((id) => id !== optionId));
      } else {
        onChange([...value, optionId]);
      }
    };

    const handleRemove = (optionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((id) => id !== optionId));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div
          className={cn(
            'min-h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 cursor-pointer',
            'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent',
            'flex flex-wrap gap-1 items-center'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${option.color || '#6b7280'}40`,
                  border: `1px solid ${option.color || '#6b7280'}`,
                  color: '#1f2937',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mr-1"
                  style={{ backgroundColor: option.color || '#6b7280' }}
                />
                {option.name}
                <button
                  type="button"
                  className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={(e) => handleRemove(option.id, e)}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        'w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
                        isSelected && 'bg-blue-50'
                      )}
                      onClick={() => handleToggle(option.id)}
                    >
                      <div className="flex items-center">
                        <span
                          className={cn(
                            'w-4 h-4 rounded border mr-2 flex items-center justify-center',
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full mr-2"
                          style={{ backgroundColor: option.color || '#6b7280' }}
                        />
                        <span className="text-gray-900">{option.name}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No tags found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';
