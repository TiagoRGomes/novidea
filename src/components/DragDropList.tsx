import { useState, useCallback } from "react";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";

interface DragDropListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  onReorder: (newItems: T[]) => void;
  getItemKey: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
  handleClassName?: string;
  disabled?: boolean;
}

export function DragDropList<T>({
  items,
  renderItem,
  onReorder,
  getItemKey,
  className = "",
  itemClassName = "",
  handleClassName = "",
  disabled = false,
}: DragDropListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (disabled || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  }, [disabled, draggedIndex, dragOverIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    if (disabled || draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    e.preventDefault();
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, removed);
    onReorder(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [disabled, draggedIndex, items, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onReorder(newItems);
  }, [items, onReorder]);

  const moveDown = useCallback((index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onReorder(newItems);
  }, [items, onReorder]);

  return (
    <div className={`space-y-2 ${className}`} role="list" aria-label="Lista reordenável">
      {items.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;

        return (
          <div
            key={getItemKey(item, index)}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              relative group rounded-2xl border transition-all duration-200
              ${isDragging ? "opacity-50 rotate-1 shadow-xl" : ""}
              ${isDragOver ? "border-[var(--brand-accent-bg)] bg-[var(--brand-accent-bg)]/5 ring-2 ring-[var(--brand-accent-bg)]/20" : "border-[var(--brand-line)]/10 bg-[var(--brand-surface)]"}
              ${itemClassName}
            `}
            role="listitem"
            aria-grabbed={isDragging}
            aria-posinset={index + 1}
            aria-setsize={items.length}
          >
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg bg-[var(--brand-paper)] text-[var(--brand-muted)] cursor-grab active:cursor-grabbing hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)] transition-colors"
              style={{ touchAction: "none" }}
              aria-label={`Mover ${getItemKey(item, index)}`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical size={16} />
            </div>

            <div className="pl-12 pr-4 py-3">
              {renderItem(item, index, isDragging)}
            </div>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); moveUp(index); }}
                disabled={index === 0 || disabled}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--brand-muted)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Mover para cima"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); moveDown(index); }}
                disabled={index === items.length - 1 || disabled}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--brand-muted)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Mover para baixo"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}