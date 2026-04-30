import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
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
  const selectedLabel = useMemo(() => options.find(option => option === value) ?? value, [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full border-b border-gray-200 py-3 pl-10 pr-10 text-left text-lg font-medium outline-none transition-colors focus:border-green-600 disabled:cursor-not-allowed disabled:opacity-40',
            className,
          )}
        >
          <span className={cn('block truncate', !value && 'text-gray-400')}>{value ? selectedLabel : placeholder}</span>
          <ChevronsUpDown className="absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-72">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('h-4 w-4', value === option ? 'opacity-100' : 'opacity-0')} />
                  <span className="line-clamp-2">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}