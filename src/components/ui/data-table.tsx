
import React, { useState } from "react";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger 
} from "@/components/ui/context-menu";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Button } from "./button";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  cell?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyField,
  onRowClick,
  emptyMessage = "No data available",
  isLoading = false,
  className,
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;
      
      // Handle different types of values
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        // For numbers, booleans, etc.
        if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1;
        
        return sortDirection === "asc"
          ? (aValue < bValue ? -1 : 1)
          : (bValue < aValue ? -1 : 1);
      }
    });
  }, [data, sortField, sortDirection]);

  if (isLoading) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-full max-w-lg"></div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="w-full p-8 text-center text-gray-500">{emptyMessage}</div>
    );
  }

  const renderCellContent = (column: Column<T>, row: T) => {
    const accessor = column.accessor;
    
    // If accessor is a function, call it with the row
    if (typeof accessor === "function") {
      return accessor(row);
    }
    
    // Otherwise, get the value from the row
    const value = row[accessor];
    
    // If there's a custom cell renderer, use it
    if (column.cell) {
      return column.cell(value, row);
    }
    
    // Special handling for certain types
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    
    // Check if it might be a status field
    if (
      typeof value === "string" &&
      (accessor.toString().toLowerCase().includes("status") ||
       accessor.toString().toLowerCase().includes("state"))
    ) {
      return <StatusBadge status={value} />;
    }
    
    // Default rendering
    return value !== null && value !== undefined ? String(value) : "";
  };

  return (
    <div className={cn("w-full overflow-auto", className)}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  typeof column.accessor === "string" ? "cursor-pointer" : "",
                  column.className
                )}
                onClick={() => {
                  if (typeof column.accessor === "string") {
                    handleSort(column.accessor as keyof T);
                  }
                }}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {sortField === column.accessor && (
                    <span>
                      {sortDirection === "asc" ? " ↑" : " ↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={String(row[keyField])}
              onClick={(e) => {
                // Only trigger row click if not clicking on a button or dropdown
                if (
                  e.target instanceof HTMLElement &&
                  !e.target.closest('button') &&
                  !e.target.closest('[role="menu"]') &&
                  onRowClick
                ) {
                  onRowClick(row);
                }
              }}
              className={onRowClick ? "cursor-pointer" : ""}
            >
              {columns.map((column, index) => (
                <td key={index} className={column.className}>
                  {renderCellContent(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
