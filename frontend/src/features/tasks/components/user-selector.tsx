'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User as UserType } from '@/types';
import { cn } from '@/lib/utils';

interface UserSelectorProps {
  users: UserType[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function UserSelector({
  users,
  value,
  onValueChange,
  placeholder = "Select user...",
  disabled = false,
  className,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedUser = users.find(user => user.id === value);

  // Filter users: Only include active users (isActive !== false)
  // Inactive users are excluded as they cannot log in or receive assignments
  // Then apply search filter
  const filteredUsers = users
    .filter(user => user.isActive !== false) // Exclude inactive users
    .filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profile?.firstName && user.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.profile?.lastName && user.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const getUserDisplayName = (user: UserType) => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user.email;
  };

  const getUserInitials = (user: UserType) => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getUserInitials(selectedUser)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{getUserDisplayName(selectedUser)}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[300px] p-0 z-[99999]" 
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={{ pointerEvents: 'auto' }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search users..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            disabled={false}
          />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {/* 
                Unassigned option - ALWAYS enabled for task assignment.
                Override disabled styles to ensure it's always clickable.
              */}
              <CommandItem
                value="__unassigned__"
                className="data-[disabled]:pointer-events-auto data-[disabled]:opacity-100 cursor-pointer"
                onSelect={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0"
                  )}
                />
                <User className="mr-2 h-4 w-4" />
                <span>Unassigned</span>
              </CommandItem>

              {/* 
                User options - ALWAYS enabled for task assignment flow.
                Override disabled styles to ensure all users are always clickable,
                regardless of their status or any other properties.
              */}
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  className="data-[disabled]:pointer-events-auto data-[disabled]:opacity-100 cursor-pointer"
                  onSelect={() => {
                    onValueChange(user.id);
                    setOpen(false);
                  }}
                  onMouseDown={(e) => {
                    // Prevent event bubbling to modal
                    e.stopPropagation();
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="mr-2 h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{getUserDisplayName(user)}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


