
import { useState, useEffect } from "react";
import { Filter, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilterOption {
  label: string;
  value: string | number;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  maxHeight?: string;
}

export function FilterDropdown({
  label,
  options,
  selectedValues,
  onChange,
  maxHeight = "300px",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<(string | number)[]>([]);
  
  // Filter out options with empty values
  const validOptions = options.filter(option => 
    option.value !== undefined && 
    option.value !== null && 
    option.value !== ""
  );
  
  useEffect(() => {
    setLocalSelected(selectedValues);
  }, [selectedValues]);

  const handleSelectAll = () => {
    if (localSelected.length === validOptions.length) {
      setLocalSelected([]);
    } else {
      setLocalSelected(validOptions.map(option => option.value));
    }
  };

  const handleToggleOption = (value: string | number) => {
    if (localSelected.includes(value)) {
      setLocalSelected(localSelected.filter(v => v !== value));
    } else {
      setLocalSelected([...localSelected, value]);
    }
  };

  const handleApply = () => {
    onChange(localSelected);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalSelected([]);
  };

  const isAllSelected = localSelected.length === validOptions.length && validOptions.length > 0;
  const isFiltered = selectedValues.length > 0;

  if (validOptions.length === 0) {
    return null; // Don't render the dropdown if there are no valid options
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${isFiltered ? 'bg-primary/10' : ''}`}
        >
          <Filter className="h-4 w-4" />
          <span>{label}</span>
          {isFiltered && (
            <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs">
              {selectedValues.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-3 flex justify-between items-center">
          <h4 className="font-medium text-sm">Filter by {label}</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={handleSelectAll}
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </Button>
        </div>
        <Separator />
        <ScrollArea className="p-3" style={{ maxHeight }}>
          <div className="space-y-2">
            {validOptions.map((option) => (
              <div key={String(option.value)} className="flex items-center space-x-2">
                <Checkbox
                  id={`${label}-${option.value}`}
                  checked={localSelected.includes(option.value)}
                  onCheckedChange={() => handleToggleOption(option.value)}
                />
                <label
                  htmlFor={`${label}-${option.value}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-3 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            disabled={localSelected.length === 0}
          >
            Clear
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
