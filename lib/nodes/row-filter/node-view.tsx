'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  createElement,
  type ReactElement,
} from 'react';
import { NodeView } from '../base-node/node-view';
import type { FilterNodeModel } from './node-model';
import type { DataTableType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilterIcon } from '@/components/icons';
import { DataTable } from '@/components/ui/data-table';

export class FilterNodeView extends NodeView<FilterNodeModel> {
  private outputData: DataTableType | null = null;
  private forceUpdateCallback: (() => void) | null = null;

  createViewPanel(): ReactElement {
    return createElement(FilterViewPanelWrapper, {
      nodeView: this,
      nodeModel: this.nodeModel,
    });
  }

  onModelChanged(): void {
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  public setOutputData(data: DataTableType | null): void {
    this.outputData = data;
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  public setLoadedData(data: DataTableType | DataTableType[] | null): void {
    // Handle both single DataTableType and array of DataTableType
    if (Array.isArray(data)) {
      this.outputData = data[0] || null;
    } else {
      this.outputData = data;
    }
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  public setUpdateCallback(callback: () => void): void {
    this.forceUpdateCallback = callback;
  }

  public getOutputData(): DataTableType | null {
    return this.outputData;
  }
}

interface FilterViewPanelWrapperProps {
  nodeView: FilterNodeView;
  nodeModel: FilterNodeModel;
}

function FilterViewPanelWrapper(props: FilterViewPanelWrapperProps) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const updateCallback = () => forceUpdate({});
    props.nodeView.setUpdateCallback(updateCallback);

    return () => {
      props.nodeView.setUpdateCallback(() => {});
    };
  }, [props.nodeView]);

  const outputData = props.nodeView.getOutputData();

  return outputData ? (
    <FilterResultView dataTable={outputData} />
  ) : (
    <EmptyState />
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="text-gray-400 mb-4">
          <FilterIcon size={48} />
        </div>
        <p className="text-gray-500 text-center">
          No data available. Connect input data and configure filter conditions.
        </p>
      </CardContent>
    </Card>
  );
}

function FilterResultView({ dataTable }: { dataTable: DataTableType }) {
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;

  // Calculate pagination
  const totalRows = dataTable.size;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  // Convert DataTableType rows to the format expected by DataTable component
  const convertRowsForDataTable = (dataTable: DataTableType) => {
    if (!dataTable?.spec?.columns) {
      return [];
    }

    const convertedRows: any[] = [];
    dataTable.forEach((row) => {
      const convertedRow: { [key: string]: any } = {};
      
      dataTable.spec.columns.forEach((column, index) => {
        const cell = row.cells[index];
        convertedRow[column.name] = cell?.getValue() || '';
      });
      
      convertedRows.push(convertedRow);
    });

    return convertedRows;
  };

  // Get rows for current page
  const rows = useMemo(() => {
    const startIndex = currentPage * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const pageRows: any[] = [];

    let rowIndex = 0;
    dataTable.forEach((row) => {
      if (rowIndex >= startIndex && rowIndex < endIndex) {
        // Convert the row to the format expected by DataTable
        const convertedRow: { [key: string]: any } = {};
        dataTable.spec.columns.forEach((column, index) => {
          const cell = row.cells[index];
          convertedRow[column.name] = cell?.getValue() || '';
        });
        pageRows.push(convertedRow);
      }
      rowIndex++;
    });

    return pageRows;
  }, [dataTable, currentPage, rowsPerPage, totalRows]);

  const columns = dataTable.spec.columns;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon size={20} />
            <span>Filtered Results</span>
          </div>
          <Badge variant="secondary">
            {totalRows} row{totalRows !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          rows={rows}
          rowsPerPage={rowsPerPage}
          showPagination={totalPages > 1}
        />
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {currentPage * rowsPerPage + 1} to{' '}
              {Math.min((currentPage + 1) * rowsPerPage, totalRows)} of{' '}
              {totalRows} rows
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                type="button"
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={currentPage === totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
