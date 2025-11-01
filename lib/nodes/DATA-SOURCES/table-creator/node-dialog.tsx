'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactElement,
} from 'react';
import { NodeDialog } from '@/lib/nodes/core';
import type { SettingsObject, DataTableSpec, DataValue } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, AlertTriangle, Info } from 'lucide-react';
import type { TableCreatorNodeModel } from './node-model';

interface TableDialogState {
  headers: string[];
  cells: Record<string, { type: string; value: DataValue }[]>;
  gridSize: { rows: number; cols: number };
}

export class TableCreatorNodeDialog extends NodeDialog {
  private model: TableCreatorNodeModel;
  private state: TableDialogState = {
    headers: [],
    cells: {},
    gridSize: { rows: 0, cols: 0 }
  };

  constructor(model: TableCreatorNodeModel) {
    super();
    this.model = model;
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    // Load current state from model
    const headers = settings.getString('headers', '[]');
    const cells = settings.getString('cells', '{}');
    const gridSize = settings.getString('gridSize', '{"rows":0,"cols":0}');

    try {
      this.state = {
        headers: JSON.parse(headers),
        cells: JSON.parse(cells),
        gridSize: JSON.parse(gridSize)
      };
    } catch {
      this.state = {
        headers: [],
        cells: {},
        gridSize: { rows: 0, cols: 0 }
      };
    }

    // Load model settings
    this.model.loadSettings(settings);
  }

  saveSettings(_settings: SettingsObject): void {
    // Save current state to model
    this.model.setHeaders(this.state.headers);
    this.model.setAllCells(this.state.cells);
    this.model.setGridSize(this.state.gridSize.rows, this.state.gridSize.cols);
  }

  createDialogPanel(settings: SettingsObject, specs: DataTableSpec[]): ReactElement {
    // Convert cells object to Map format expected by TableCreatorDialogPanel
    const cellEntries: [string, any][] = [];
    Object.entries(this.state.cells).forEach(([rowKey, cells]) => {
      const rowIndex = Number.parseInt(rowKey.replace('row-', ''));
      cells.forEach((cell, colIndex) => {
        cellEntries.push([`${rowIndex},${colIndex}`, cell.value]);
      });
    });

    return (
      <TableCreatorDialogPanel
        settings={settings}
        specs={specs}
        initialHeaders={this.state.headers}
        initialCells={new Map(cellEntries)}
        initialGridSize={this.state.gridSize}
        onDataChange={(headers, cells, gridSize) => {
          this.setState({
            headers,
            cells: Object.fromEntries(Array.from(cells.entries()).map(([key, value]) => {
              const [row, col] = key.split(',').map(Number);
              const rowKey = `row-${row}`;
              if (!this.state.cells[rowKey]) {
                this.state.cells[rowKey] = Array(gridSize.cols).fill({ type: 'string', value: '' });
              }
              this.state.cells[rowKey][col] = { type: 'string', value };
              return [rowKey, this.state.cells[rowKey]];
            })),
            gridSize
          });
        }}
      />
    );
  }

  private updateGridSize(dimension: 'rows' | 'cols', value: number): void {
    if (value < 1) return;
    this.setState({
      gridSize: {
        ...this.state.gridSize,
        [dimension]: value
      }
    });
  }

  private updateHeader(index: number, value: string): void {
    const headers = [...this.state.headers];
    headers[index] = value;
    this.setState({ headers });
  }

  private updateCell(row: number, col: number, value: DataValue): void {
    const cells = { ...this.state.cells };
    const rowKey = `row-${row}`;
    if (!cells[rowKey]) {
      cells[rowKey] = Array(this.state.gridSize.cols).fill({ type: 'string', value: '' });
    }
    cells[rowKey][col] = { type: 'string', value };
    this.setState({ cells });
  }

  private getCellValue(row: number, col: number): DataValue {
    const rowKey = `row-${row}`;
    return this.state.cells[rowKey]?.[col]?.value ?? '';
  }

  private setState(newState: Partial<TableDialogState>): void {
    this.state = {
      ...this.state,
      ...newState
    };
  }
}

// Validation Errors Component
interface ValidationErrorsProps {
  errors: string[];
}

function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-destructive font-medium mb-3">
          <AlertTriangle className="size-4" />
          Validation Errors
        </div>
        <ul className="list-disc list-inside text-destructive text-sm space-y-1">
          {errors.map((error, index) => (
            <li key={`error-${index}-${error.slice(0, 20)}`}>{error}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Table Stats Component
interface TableStatsProps {
  headers: string[];
  cells: Map<string, any>;
  gridSize: { rows: number; cols: number };
}

function TableStats({ headers, cells, gridSize }: TableStatsProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="size-4 text-primary" />
          <span className="font-medium">Table Information</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {headers.length}
            </div>
            <div className="text-xs text-muted-foreground">Columns</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {gridSize.rows}
            </div>
            <div className="text-xs text-muted-foreground">Rows</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{cells.size}</div>
            <div className="text-xs text-muted-foreground">Data Cells</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {gridSize.cols}
            </div>
            <div className="text-xs text-muted-foreground">Grid Columns</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
          <div className="flex items-center gap-2">
            <div className="size-2 bg-primary rounded-full" />
            Table automatically expands 5 rows/columns beyond your furthest data
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 bg-blue-500 rounded-full" />
            Use arrow keys, Enter, or Tab to navigate between cells
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 bg-destructive rounded-full" />
            Red cells indicate data beyond defined columns
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 bg-muted rounded-full" />
            Configure column types and nullability in the header row
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Table Header Component
interface TableHeaderProps {
  headers: string[];
  gridSize: { rows: number; cols: number };
  cellWidth: number;
  headerHeight: number;
  onHeadersChange: (headers: string[]) => void;
}

function TableHeader({
  headers,
  gridSize,
  cellWidth,
  headerHeight,
  onHeadersChange,
}: TableHeaderProps) {
  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    onHeadersChange(newHeaders);
  };

  const addHeader = () => {
    const newHeaders = [...headers, ''];
    onHeadersChange(newHeaders);
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    onHeadersChange(newHeaders);
  };

  const addHeadersUpTo = (colIndex: number) => {
    const newHeaders = [...headers];
    while (newHeaders.length <= colIndex) {
      newHeaders.push('');
    }
    onHeadersChange(newHeaders);
  };

  return (
    <div
      className="bg-background border-b-2 border-border shadow-sm"
      style={{ height: headerHeight, width: '100%' }}
    >
      {Array.from(
        { length: Math.max(gridSize.cols, headers.length) },
        (_, colIndex) => (
          <div
            key={`header-col-${colIndex}-${headers[colIndex] || 'empty'}`}
            className={`absolute border-r border-border p-2 ${colIndex < headers.length ? 'bg-background' : 'bg-muted'}`}
            style={{
              left: colIndex * cellWidth,
              width: cellWidth,
              height: headerHeight,
              top: 0,
            }}
          >
            {colIndex < headers.length ? (
              <div className="flex gap-1 items-center h-full">
                <Input
                  placeholder={`Column ${colIndex + 1}`}
                  value={headers[colIndex] || ''}
                  onChange={(e) => updateHeader(colIndex, e.target.value)}
                  className="h-8 text-sm font-medium bg-background border-input flex-1"
                />
                {headers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeHeader(colIndex)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center justify-center size-full text-xs text-muted-foreground cursor-pointer hover:bg-accent transition-colors border-0 bg-transparent"
                onClick={() => addHeadersUpTo(colIndex)}
              >
                <div className="text-center">
                  <div className="font-medium">Column {colIndex + 1}</div>
                  <div className="text-xs">Click to add header</div>
                </div>
              </button>
            )}
          </div>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        className="absolute bg-primary text-primary-foreground hover:bg-primary/90 z-10"
        style={{
          left: Math.max(gridSize.cols, headers.length) * cellWidth + 10,
          top: 10,
        }}
        onClick={addHeader}
      >
        <Plus className="size-4 mr-1" />
        Add Column
      </Button>
    </div>
  );
}

// Table Body Component
interface TableBodyProps {
  headers: string[];
  cells: Map<string, any>;
  gridSize: { rows: number; cols: number };
  selectedCell: { row: number; col: number } | null;
  cellWidth: number;
  cellHeight: number;
  onCellChange: (row: number, col: number, value: string) => void;
  onCellSelect: (cell: { row: number; col: number }) => void;
  onKeyDown: (e: React.KeyboardEvent, row: number, col: number) => void;
}

function TableBody({
  headers,
  cells,
  gridSize,
  selectedCell,
  cellWidth,
  cellHeight,
  onCellChange,
  onCellSelect,
  onKeyDown,
}: TableBodyProps) {
  return (
    <>
      {Array.from({ length: gridSize.rows }, (_, rowIndex) => (
        <div
          key={`grid-row-${rowIndex}-${gridSize.cols}`}
          className="relative"
          style={{ height: cellHeight }}
        >
          {Array.from(
            { length: Math.max(gridSize.cols, headers.length) },
            (_, colIndex) => {
              const cellKey = `${rowIndex},${colIndex}`;
              const cellValue = cells.get(cellKey) || '';
              const isSelected =
                selectedCell?.row === rowIndex &&
                selectedCell?.col === colIndex;
              const hasError = colIndex >= headers.length && cellValue !== '';
              const isEvenRow = rowIndex % 2 === 0;

              return (
                <Input
                  key={cellKey}
                  data-cell={`${rowIndex},${colIndex}`}
                  value={cellValue}
                  onChange={(e) =>
                    onCellChange(rowIndex, colIndex, e.target.value)
                  }
                  onClick={() => onCellSelect({ row: rowIndex, col: colIndex })}
                  onFocus={() => onCellSelect({ row: rowIndex, col: colIndex })}
                  onKeyDown={(e) => onKeyDown(e, rowIndex, colIndex)}
                  className={`absolute border border-border transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-1 z-10 shadow-md'
                      : ''
                  } ${
                    hasError
                      ? 'bg-destructive/10 border-destructive text-destructive-foreground'
                      : isEvenRow
                        ? 'bg-background'
                        : 'bg-muted/30'
                  } hover:bg-accent/50 focus:bg-background`}
                  style={{
                    left: colIndex * cellWidth,
                    top: 0,
                    width: cellWidth,
                    height: cellHeight,
                    borderRadius: 0,
                  }}
                  placeholder=""
                />
              );
            },
          )}
        </div>
      ))}
    </>
  );
}

// Table Grid Component
interface TableGridProps {
  headers: string[];
  cells: Map<string, any>;
  gridSize: { rows: number; cols: number };
  onHeadersChange: (headers: string[]) => void;
  onCellsChange: (cells: Map<string, any>) => void;
}

function TableGrid({
  headers,
  cells,
  gridSize,
  onHeadersChange,
  onCellsChange,
}: TableGridProps) {
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 400,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  const CELL_WIDTH = 140;
  const CELL_HEIGHT = 36;
  const HEADER_HEIGHT = 40;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: Math.min(400, window.innerHeight * 0.5),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Synchronize scrolling between top scrollbar and main content
  useEffect(() => {
    const mainScroll = mainScrollRef.current;
    const topScroll = topScrollRef.current;

    if (!mainScroll || !topScroll) return;

    const syncMainToTop = () => {
      if (topScroll.scrollLeft !== mainScroll.scrollLeft) {
        topScroll.scrollLeft = mainScroll.scrollLeft;
      }
    };

    const syncTopToMain = () => {
      if (mainScroll.scrollLeft !== topScroll.scrollLeft) {
        mainScroll.scrollLeft = topScroll.scrollLeft;
      }
    };

    mainScroll.addEventListener('scroll', syncMainToTop);
    topScroll.addEventListener('scroll', syncTopToMain);

    return () => {
      mainScroll.removeEventListener('scroll', syncMainToTop);
      topScroll.removeEventListener('scroll', syncTopToMain);
    };
  }, []);

  const updateCell = (row: number, col: number, value: string) => {
    const newCells = new Map(cells);
    if (value === '') {
      newCells.delete(`${row},${col}`);
    } else {
      newCells.set(`${row},${col}`, value);
    }
    onCellsChange(newCells);
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (!selectedCell) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) {
          setSelectedCell({ row: row - 1, col });
          setTimeout(() => {
            const input = document.querySelector(
              `input[data-cell="${row - 1},${col}"]`,
            ) as HTMLInputElement;
            input?.focus();
          }, 0);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < gridSize.rows - 1) {
          setSelectedCell({ row: row + 1, col });
          setTimeout(() => {
            const input = document.querySelector(
              `input[data-cell="${row + 1},${col}"]`,
            ) as HTMLInputElement;
            input?.focus();
          }, 0);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) {
          setSelectedCell({ row, col: col - 1 });
          setTimeout(() => {
            const input = document.querySelector(
              `input[data-cell="${row},${col - 1}"]`,
            ) as HTMLInputElement;
            input?.focus();
          }, 0);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (col < Math.max(gridSize.cols, headers.length) - 1) {
          setSelectedCell({ row, col: col + 1 });
          setTimeout(() => {
            const input = document.querySelector(
              `input[data-cell="${row},${col + 1}"]`,
            ) as HTMLInputElement;
            input?.focus();
          }, 0);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (row < gridSize.rows - 1) {
          setSelectedCell({ row: row + 1, col });
          setTimeout(() => {
            const input = document.querySelector(
              `input[data-cell="${row + 1},${col}"]`,
            ) as HTMLInputElement;
            input?.focus();
          }, 0);
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (col < Math.max(gridSize.cols, headers.length) - 1) {
          setSelectedCell({ row, col: col + 1 });
          setTimeout(() => {
            const input = document.querySelector(
              `input[data-cell="${row},${col + 1}"]`,
            ) as HTMLInputElement;
            input?.focus();
          }, 0);
        } else if (row < gridSize.rows - 1) {
          setSelectedCell({ row: row + 1, col: 0 });
          setTimeout(() => {
            const input = document.querySelector(
              `input[data-cell="${row + 1},0"]`,
            ) as HTMLInputElement;
            input?.focus();
          }, 0);
        }
        break;
    }
  };

  const totalWidth = Math.max(gridSize.cols * CELL_WIDTH, containerSize.width);

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative">
        {/* Top Scrollbar - Sticky at the very top */}
        <div className="sticky top-0 z-30 bg-background border-b border-border shadow-sm">
          <div className="relative">
            <div
              ref={topScrollRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
              style={{
                width: containerSize.width,
                height: '16px',
                scrollbarWidth: 'thin',
              }}
            >
              <div style={{ width: totalWidth, height: '1px' }} />
            </div>
          </div>
        </div>

        {/* Main Table Container - No horizontal scrollbar */}
        <div
          ref={mainScrollRef}
          className="border border-border rounded-lg bg-background overflow-auto"
          style={{
            width: containerSize.width,
            height: containerSize.height,
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
            overflowX: 'auto',
            overflowY: 'auto',
          }}
        >
          {/* Hide webkit scrollbar */}
          <style jsx>{`
            div::-webkit-scrollbar:horizontal {
              display: none;
            }
          `}</style>

          <div
            style={{
              width: totalWidth,
              height: HEADER_HEIGHT + gridSize.rows * CELL_HEIGHT,
              position: 'relative',
              minWidth: '100%',
            }}
          >
            {/* Header Row - Sticky */}
            <div className="sticky top-0 z-20">
              <TableHeader
                headers={headers}
                gridSize={gridSize}
                cellWidth={CELL_WIDTH}
                headerHeight={HEADER_HEIGHT}
                onHeadersChange={onHeadersChange}
              />
            </div>

            {/* Data Rows */}
            <div style={{ paddingTop: HEADER_HEIGHT }}>
              <TableBody
                headers={headers}
                cells={cells}
                gridSize={gridSize}
                selectedCell={selectedCell}
                cellWidth={CELL_WIDTH}
                cellHeight={CELL_HEIGHT}
                onCellChange={updateCell}
                onCellSelect={setSelectedCell}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dialog Panel Component
interface TableCreatorDialogPanelProps {
  settings: SettingsObject;
  specs: DataTableSpec[];
  initialHeaders: string[];
  initialCells: Map<string, any>;
  initialGridSize: { rows: number; cols: number };
  onDataChange: (
    headers: string[],
    cells: Map<string, any>,
    gridSize: { rows: number; cols: number },
  ) => void;
}

function TableCreatorDialogPanel(props: TableCreatorDialogPanelProps) {
  const initialHeaders =
    props.initialHeaders.length > 0 ? props.initialHeaders : [''];

  const [headers, setHeaders] = useState<string[]>(initialHeaders);
  const [cells, setCells] = useState<Map<string, any>>(
    new Map(props.initialCells),
  );
  const [gridSize, setGridSize] = useState(props.initialGridSize);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Auto-expand grid based on furthest data
  const updateGridSizeBasedOnData = useCallback(() => {
    let furthestRow = -1;
    for (const [_key, value] of cells) {
      if (value !== undefined && value !== null && value !== '') {
        const [row] = _key.split(',').map(Number);
        if (!Number.isNaN(row)) {
          furthestRow = Math.max(furthestRow, row);
        }
      }
    }

    let furthestHeaderCol = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].trim() !== '') {
        furthestHeaderCol = i;
      }
    }

    const newGridSize = { ...gridSize };
    let shouldUpdate = false;

    const minRows = Math.max(20, furthestRow + 6);
    if (newGridSize.rows < minRows) {
      newGridSize.rows = Math.min(minRows, 1000);
      shouldUpdate = true;
    }

    const minCols = Math.max(5, furthestHeaderCol + 6);
    if (newGridSize.cols < minCols) {
      newGridSize.cols = Math.min(minCols, 50);
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      setGridSize(newGridSize);
    }
  }, [cells, headers, gridSize]);

  useEffect(() => {
    updateGridSizeBasedOnData();
  }, [updateGridSizeBasedOnData]);

  const validateData = useCallback(() => {
    const errors: string[] = [];

    if (headers.length === 0) {
      errors.push('At least one column header must be defined');
      setValidationErrors(errors);
      return false;
    }

    const nonEmptyHeaderNames = headers.filter((name) => name?.trim());
    const uniqueNames = new Set(nonEmptyHeaderNames);
    if (
      uniqueNames.size !== nonEmptyHeaderNames.length &&
      nonEmptyHeaderNames.length > 0
    ) {
      errors.push('Column names must be unique');
    }

    const maxDataRow =
      Math.max(
        ...Array.from(cells.keys())
          .map((key) => Number.parseInt(key.split(',')[0]))
          .filter((row) => !Number.isNaN(row)),
        -1,
      ) + 1;

    for (let row = 0; row < maxDataRow; row++) {
      let maxCol = -1;
      for (let col = 0; col < gridSize.cols; col++) {
        const cellValue = cells.get(`${row},${col}`);
        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
          maxCol = col;
        }
      }

      if (maxCol >= headers.length) {
        errors.push(
          `Row ${row + 1} has data in column ${maxCol + 1} but only ${headers.length} columns are defined`,
        );
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [headers, cells, gridSize]);

  useEffect(() => {
    validateData();
    props.onDataChange(headers, cells, gridSize);
  }, [headers, cells, gridSize, validateData, props.onDataChange]);

  useEffect(() => {
    if (props.initialHeaders.length === 0 && headers.length > 0) {
      props.onDataChange(headers, cells, gridSize);
    }
  }, []);

  return (
    <div className="space-y-6 p-6 max-w-full">
      {/* Validation Errors */}
      <ValidationErrors errors={validationErrors} />

      {/* Grid Container */}
      <Card>
        <CardContent className="p-4">
          <TableGrid
            headers={headers}
            cells={cells}
            gridSize={gridSize}
            onHeadersChange={setHeaders}
            onCellsChange={setCells}
          />
        </CardContent>
      </Card>

      {/* Statistics and Info */}
      <TableStats headers={headers} cells={cells} gridSize={gridSize} />
    </div>
  );
}
