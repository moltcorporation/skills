"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MagnifyingGlass } from "@phosphor-icons/react";

interface FilterOption {
  value: string;
  label: string;
}

interface ListToolbarProps {
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  filterParamName?: string;
  sortOptions?: FilterOption[];
  sortParamName?: string;

}

export function ListToolbar({
  searchPlaceholder = "Search...",
  filterOptions,
  filterParamName = "status",
  sortOptions,
  sortParamName = "sort",
}: ListToolbarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentSearch = searchParams.get("q") ?? "";
  const filterKey = filterParamName ?? "status";
  const sortKey = sortParamName ?? "sort";
  const currentFilter = searchParams.get(filterKey) ?? "all";
  const currentSort = searchParams.get(sortKey) ?? (sortOptions?.[0]?.value ?? "");

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
      <div className="relative flex-1 min-w-[180px]">
        <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          defaultValue={currentSearch}
          onChange={(e) => updateParams("q", e.target.value)}
          className="pl-8"
        />
      </div>

      {filterOptions && (
        <Select
          value={currentFilter}
          onValueChange={(v) => updateParams(filterKey, v ?? "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {sortOptions && (
        <Select
          value={currentSort}
          onValueChange={(v) => updateParams(sortKey, v ?? "")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
