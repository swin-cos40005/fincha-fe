'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  createElement,
  type ReactElement,
} from 'react';
import { NodeView } from '../base-node/node-view';
import type { ColumnFilterNodeModel } from './node-model';
import type { DataTableType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { TableIcon } from '@/components/icons';
import { DataTable } from '@/components/ui/data-table';

export class ColumnFilterNodeView extends NodeView<ColumnFilterNodeModel> {
  private outputData: DataTableType | null = null;
  private forceUpdateCallback: (() => void) | null = null;

  createViewPanel(): ReactElement {
    return createElement(ColumnFilterViewPanelWrapper, {
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

interface ColumnFilterViewPanelWrapperProps {
  nodeView: ColumnFilterNodeView;
  nodeModel: ColumnFilterNodeModel;
}

function ColumnFilterViewPanelWrapper(
  props: ColumnFilterViewPanelWrapperProps,
) {
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
    <ColumnFilterResultView dataTable={outputData} />
  ) : (
    <EmptyState />
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="text-gray-400 mb-4">
          <TableIcon size={48} />
        </div>
        <p className="text-gray-500 text-center">
          No data available. Connect input data and select columns to keep or
          exclude.
        </p>
      </CardContent>
    </Card>
  );
}

function ColumnFilterResultView({ dataTable }: { dataTable: DataTableType }) {
  const currentPage = 0;
  const rowsPerPage = 10;

  const totalRows = dataTable.size;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const columns = dataTable.spec.columns;

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon size={20} />
            <span>Column Filter Results</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {columns.length} column{columns.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="secondary">
              {totalRows} row{totalRows !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          rows={rows}
          rowsPerPage={rowsPerPage}
          showPagination={totalPages > 1}
        />
      </CardContent>
    </Card>
  );
}