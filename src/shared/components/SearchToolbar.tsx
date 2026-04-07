import type { ReactNode } from "react";
import { Input } from "../../app/components/ui/input";

interface SearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  actions?: ReactNode;
}

export function SearchToolbar({
  search,
  onSearchChange,
  placeholder = "Search records",
  actions,
}: SearchToolbarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={placeholder}
        className="max-w-xl"
      />
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
