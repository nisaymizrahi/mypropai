import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const normalizeSortValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return String(value).toLowerCase();
};

const compareValues = (left, right) => {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const WorkspaceDataTable = ({
  title,
  description,
  columns,
  rows,
  rowKey,
  defaultSort,
  searchValue = "",
  onSearchValueChange,
  searchPlaceholder = "Search",
  toolbarContent,
  emptyTitle = "No rows yet",
  emptyDescription = "There is nothing to show here right now.",
  emptyActions,
}) => {
  const sortableColumns = useMemo(
    () => columns.filter((column) => typeof column.sortValue === "function"),
    [columns]
  );
  const searchInputId = useMemo(
    () =>
      `workspace-table-search-${String(title || "results")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}`,
    [title]
  );

  const [sortState, setSortState] = useState(() => ({
    columnId: defaultSort?.columnId || sortableColumns[0]?.id || null,
    direction: defaultSort?.direction || "asc",
  }));

  useEffect(() => {
    const activeColumnExists = sortableColumns.some(
      (column) => column.id === sortState.columnId
    );

    if (!activeColumnExists) {
      setSortState({
        columnId: defaultSort?.columnId || sortableColumns[0]?.id || null,
        direction: defaultSort?.direction || "asc",
      });
    }
  }, [defaultSort?.columnId, defaultSort?.direction, sortState.columnId, sortableColumns]);

  const sortedRows = useMemo(() => {
    const activeColumn = columns.find((column) => column.id === sortState.columnId);

    if (!activeColumn || typeof activeColumn.sortValue !== "function") {
      return rows;
    }

    const nextRows = [...rows].sort((leftRow, rightRow) => {
      const leftValue = normalizeSortValue(activeColumn.sortValue(leftRow));
      const rightValue = normalizeSortValue(activeColumn.sortValue(rightRow));
      const comparison = compareValues(leftValue, rightValue);

      return sortState.direction === "desc" ? comparison * -1 : comparison;
    });

    return nextRows;
  }, [columns, rows, sortState.columnId, sortState.direction]);

  const handleSort = (column) => {
    if (typeof column.sortValue !== "function") {
      return;
    }

    setSortState((current) => {
      if (current.columnId === column.id) {
        return {
          columnId: column.id,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        columnId: column.id,
        direction: "asc",
      };
    });
  };

  return (
    <div className="section-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-ink-900 sm:text-2xl">{title}</h3>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{description}</p>
          ) : null}
        </div>

        {onSearchValueChange ? (
          <div className="w-full xl:max-w-sm">
            <label className="sr-only" htmlFor={searchInputId}>
              Search rows
            </label>
            <div className="flex items-center gap-3 rounded-[18px] border border-ink-100 bg-white px-4 py-3 shadow-soft">
              <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0 text-ink-400" />
              <input
                id={searchInputId}
                type="search"
                value={searchValue}
                onChange={(event) => onSearchValueChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full border-none bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
              />
            </div>
          </div>
        ) : null}
      </div>

      {toolbarContent ? <div className="mt-5">{toolbarContent}</div> : null}

      {sortedRows.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-[20px] border border-ink-100 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[rgba(251,248,242,0.96)] backdrop-blur">
                <tr className="border-b border-ink-100">
                  {columns.map((column) => {
                    const isSortable = typeof column.sortValue === "function";
                    const isActiveSort = sortState.columnId === column.id;

                    return (
                      <th
                        key={column.id}
                        scope="col"
                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400 ${
                          column.headerClassName || ""
                        } ${column.align === "right" ? "text-right" : "text-left"}`}
                      >
                        {isSortable ? (
                          <button
                            type="button"
                            onClick={() => handleSort(column)}
                            className={`inline-flex items-center gap-1.5 ${
                              column.align === "right" ? "ml-auto" : ""
                            }`}
                          >
                            <span>{column.label}</span>
                            {isActiveSort ? (
                              sortState.direction === "asc" ? (
                                <ArrowUpIcon className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowDownIcon className="h-3.5 w-3.5" />
                              )
                            ) : (
                              <ArrowsUpDownIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {sortedRows.map((row, rowIndex) => (
                  <tr
                    key={rowKey ? rowKey(row, rowIndex) : row._id || row.id || rowIndex}
                    className="transition hover:bg-sand-50/65"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={`px-4 py-4 align-top text-ink-700 ${
                          column.cellClassName || ""
                        } ${column.align === "right" ? "text-right" : "text-left"}`}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[20px] border border-dashed border-ink-200 bg-sand-50 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-ink-900">{emptyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-ink-500">{emptyDescription}</p>
          {emptyActions ? <div className="mt-5 flex flex-wrap justify-center gap-3">{emptyActions}</div> : null}
        </div>
      )}
    </div>
  );
};

export default WorkspaceDataTable;
