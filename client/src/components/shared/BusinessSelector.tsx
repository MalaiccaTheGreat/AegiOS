import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const BusinessSelector = () => {
  const { currentBusiness, businesses, setCurrentBusiness } = useBusiness();
  const [open, setOpen] = useState(false);

  if (!businesses.length) {
    return (
      <Button variant="outline" size="sm" className="ml-2">
        <Plus className="mr-2 h-4 w-4" />
        Add Business
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {currentBusiness ? (
            <span className="truncate">{currentBusiness.name}</span>
          ) : (
            'Select business...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search businesses..." />
          <CommandEmpty>No business found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {businesses.map((business) => (
              <CommandItem
                key={business.id}
                value={business.name}
                onSelect={() => {
                  setCurrentBusiness(business);
                  setOpen(false);
                }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div
                    className={cn(
                      'mr-2 h-2 w-2 rounded-full',
                      business.isActive ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  />
                  <span className="truncate">{business.name}</span>
                </div>
                <Check
                  className={cn(
                    'ml-2 h-4 w-4',
                    currentBusiness?.id === business.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                // Handle add new business
                setOpen(false);
              }}
              className="text-primary cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new business
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default BusinessSelector;
