"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterSortOption = {
  value: string;
  label: string;
};

type PlatformFilterSortMenuProps = {
  filterValue: string;
  sortValue: string;
  filterOptions: readonly FilterSortOption[];
  sortOptions: readonly FilterSortOption[];
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
  defaultFilterValue?: string;
  defaultSortValue?: string;
};

function getSelectedLabel(
  options: readonly FilterSortOption[],
  value: string,
  fallback: string,
) {
  return options.find((option) => option.value === value)?.label ?? fallback;
}

export function getFilterSortLabel({
  filterValue,
  sortValue,
  filterOptions,
  sortOptions,
}: Omit<PlatformFilterSortMenuProps, "onFilterChange" | "onSortChange" | "defaultFilterValue" | "defaultSortValue">) {
  const sortLabel = getSelectedLabel(sortOptions, sortValue, "Sort");
  const filterLabel = getSelectedLabel(filterOptions, filterValue, "Filter");

  return `${sortLabel} · ${filterLabel}`;
}

export function PlatformFilterSortMenu({
  filterValue,
  sortValue,
  filterOptions,
  sortOptions,
  onFilterChange,
  onSortChange,
  defaultFilterValue = "all",
  defaultSortValue = "newest",
}: PlatformFilterSortMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="min-w-28 justify-between">
            <span>
              {getFilterSortLabel({
                filterValue,
                sortValue,
                filterOptions,
                sortOptions,
              })}
            </span>
            <CaretDown className="size-3.5 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={sortValue}
            onValueChange={(value) => {
              onSortChange(value);
              setOpen(false);
            }}
          >
            {sortOptions.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filter by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={filterValue}
            onValueChange={(value) => {
              onFilterChange(value);
              setOpen(false);
            }}
          >
            {filterOptions.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
