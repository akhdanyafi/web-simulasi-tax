import { useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from './ui/utils';

type SearchableSelectProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
};

export default function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  searchPlaceholder = 'Cari...',
  emptyText = 'Data tidak ditemukan.',
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => options.filter(opt => opt.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setOpen(true);
    if (value) setQuery('');
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full" onBlur={handleBlur}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        value={open ? query : value}
        onChange={e => setQuery(e.target.value)}
        onFocus={handleFocus}
        placeholder={open ? searchPlaceholder : (value ? value : placeholder)}
        className={cn(
          'w-full border-b border-gray-200 bg-transparent py-3 pl-10 pr-10 text-left text-lg font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-green-600 disabled:cursor-not-allowed disabled:opacity-40',
          !value && !open && 'text-gray-400',
          className,
        )}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && !open && (
          <button type="button" onClick={handleClear} className="p-0.5 text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronsUpDown className="h-4 w-4 text-gray-400" />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">{emptyText}</div>
          ) : (
            filtered.map(option => (
              <button
                key={option}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(option)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-green-50 focus:bg-green-50 focus:outline-none"
              >
                <Check className={cn('h-4 w-4 shrink-0 text-green-600', value === option ? 'opacity-100' : 'opacity-0')} />
                <span className="line-clamp-2">{option}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}