'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createElement,
  type ReactElement,
} from 'react';
import { NodeDialog, type SettingsObject, type DataTableSpec } from '../../core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaperclipIcon, UploadIcon, FileSpreadsheet, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Attachment } from 'ai';

export class DataInputNodeDialog extends NodeDialog {
  private static CSV_URL_KEY = 'csv_url';
  private static CSV_SOURCE_TYPE_KEY = 'csv_source_type';
  private static CSV_FILE_NAME_KEY = 'csv_file_name';

  private csvUrl = '';
  private csvSourceType: 'url' | 'upload' | 'conversation' = 'url';
  private csvFileName = '';

  createDialogPanel(
    settings: SettingsObject,
    _specs: DataTableSpec[],
  ): ReactElement {
    this.loadSettings(settings, _specs);

    return createElement(DataInputDialogPanel, {
      settings,
      specs: _specs,
      initialUrl: this.csvUrl,
      initialSourceType: this.csvSourceType,
      initialFileName: this.csvFileName,
      onDataChange: (
        url: string,
        sourceType: 'url' | 'upload' | 'conversation',
        fileName: string,
      ) => {
        this.csvUrl = url;
        this.csvSourceType = sourceType;
        this.csvFileName = fileName;
        this.saveSettings(settings);
      },
    });
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    this.csvUrl = settings.getString
      ? settings.getString(DataInputNodeDialog.CSV_URL_KEY, '')
      : (settings as any)[DataInputNodeDialog.CSV_URL_KEY] || '';

    this.csvSourceType = settings.getString
      ? (settings.getString(DataInputNodeDialog.CSV_SOURCE_TYPE_KEY, 'url') as
          | 'url'
          | 'upload'
          | 'conversation')
      : (settings as any)[DataInputNodeDialog.CSV_SOURCE_TYPE_KEY] || 'url';

    this.csvFileName = settings.getString
      ? settings.getString(DataInputNodeDialog.CSV_FILE_NAME_KEY, '')
      : (settings as any)[DataInputNodeDialog.CSV_FILE_NAME_KEY] || '';
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(DataInputNodeDialog.CSV_URL_KEY, this.csvUrl);
      settings.set(DataInputNodeDialog.CSV_SOURCE_TYPE_KEY, this.csvSourceType);
      settings.set(DataInputNodeDialog.CSV_FILE_NAME_KEY, this.csvFileName);
    } else {
      (settings as any)[DataInputNodeDialog.CSV_URL_KEY] = this.csvUrl;
      (settings as any)[DataInputNodeDialog.CSV_SOURCE_TYPE_KEY] =
        this.csvSourceType;
      (settings as any)[DataInputNodeDialog.CSV_FILE_NAME_KEY] =
        this.csvFileName;
    }
  }
}

interface DataInputDialogPanelProps {
  settings: SettingsObject;
  specs: DataTableSpec[];
  initialUrl: string;
  initialSourceType: 'url' | 'upload' | 'conversation';
  initialFileName: string;
  onDataChange: (
    url: string,
    sourceType: 'url' | 'upload' | 'conversation',
    fileName: string,
  ) => void;
}

interface ConversationCsvFile {
  url: string;
  originalName: string;
  displayName: string;
}

function DataInputDialogPanel(props: DataInputDialogPanelProps) {
  const [sourceType, setSourceType] = useState<
    'url' | 'upload' | 'conversation'
  >(props.initialSourceType);
  const [url, setUrl] = useState(props.initialUrl);
  const [fileName, setFileName] = useState(props.initialFileName);
  const [selectedConversationFile, setSelectedConversationFile] = useState('');
  const [conversationCsvFiles, setConversationCsvFiles] = useState<
    ConversationCsvFile[]
  >([]);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [uploadedFile, setUploadedFile] = useState<Attachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSourceType(props.initialSourceType);
    setUrl(props.initialUrl);
    setFileName(props.initialFileName);

    if (props.initialSourceType === 'conversation' && props.initialUrl) {
      setSelectedConversationFile(props.initialUrl);
    }
  }, [props.initialSourceType, props.initialUrl, props.initialFileName]);

  const fetchConversationCsvFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/node/data-input');
      if (response.ok) {
        const files = await response.json();
        setConversationCsvFiles(files);
      }
    } catch (error) {
      console.error('Error fetching conversation CSV files:', error);
    }
  }, []);

  useEffect(() => {
    fetchConversationCsvFiles();
  }, [fetchConversationCsvFiles]);

  const addCsvToConversation = useCallback(
    async (fileUrl: string, fileName: string) => {
      try {
        await fetch('/api/node/data-input', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: fileUrl,
            name: fileName,
          }),
        });
        await fetchConversationCsvFiles();
      } catch (error) {
        console.error('Error adding CSV to conversation:', error);
      }
    },
    [fetchConversationCsvFiles],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        const attachment: Attachment = {
          name: file.name,
          contentType: file.type,
          url: result.url,
        };

        setUploadedFile(attachment);
        setUploadQueue([]);
        setUrl(result.url);
        setFileName(file.name);
        setSourceType('upload');

        await addCsvToConversation(result.url, file.name);
        props.onDataChange(result.url, 'upload', file.name);
        toast.success('File uploaded successfully');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file');
        setUploadQueue([]);
      }
    },
    [props, addCsvToConversation],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setUploadQueue([file.name]);
      await uploadFile(file);
    },
    [uploadFile],
  );

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setFileName('');
    setUploadedFile(null);
    setSelectedConversationFile('');
    props.onDataChange(newUrl, 'url', '');
  };

  const handleConversationFileSelect = (fileUrl: string) => {
    const selectedFile = conversationCsvFiles.find((f) => f.url === fileUrl);
    if (selectedFile) {
      setSelectedConversationFile(fileUrl);
      setUrl(fileUrl);
      setFileName(selectedFile.originalName);
      setUploadedFile(null);
      props.onDataChange(fileUrl, 'conversation', selectedFile.originalName);
    }
  };

  const handleSourceTypeChange = (value: string) => {
    const newSourceType = value as 'url' | 'upload' | 'conversation';
    setSourceType(newSourceType);
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUrl('');
    setFileName('');
    props.onDataChange('', 'upload', '');
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Data Input Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Load CSV data from a URL, upload a file, or select from conversation
          files.
        </p>
      </div>

      <Tabs
        value={sourceType}
        onValueChange={handleSourceTypeChange}
        className="w-full"
      >
        <TabsList className="flex w-full">
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="conversation">From Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="csv-url">CSV URL</Label>
            <Input
              id="csv-url"
              type="url"
              placeholder="https://example.com/data.csv"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the URL of a CSV file to load data from.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv,application/vnd.ms-excel"
              className="hidden"
            />

            {!uploadedFile && uploadQueue.length === 0 && (
              <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <UploadIcon className="size-10 text-muted-foreground mb-4" />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mb-2"
                  >
                    <PaperclipIcon className="size-4 mr-2" />
                    Choose CSV File
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Upload a CSV file from your computer
                  </p>
                </CardContent>
              </Card>
            )}

            {uploadQueue.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="size-6 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">{uploadQueue[0]}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploading...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {uploadedFile && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="size-6 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">{fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        File uploaded successfully
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeUploadedFile}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="conversation" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="conversation-csv">
              Select CSV from conversation
            </Label>
            {conversationCsvFiles.length > 0 ? (
              <Select
                value={selectedConversationFile}
                onValueChange={handleConversationFileSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a CSV file from this conversation" />
                </SelectTrigger>
                <SelectContent>
                  {conversationCsvFiles.map((file) => (
                    <SelectItem key={file.url} value={file.url}>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="size-4 text-green-600" />
                        {file.displayName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Card>
                <CardContent className="p-4 text-center">
                  <FileSpreadsheet className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No CSV files found in this conversation.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload files in the chat or use the Upload tab above.
                  </p>
                </CardContent>
              </Card>
            )}
            <p className="text-xs text-muted-foreground">
              Select a CSV file that was previously uploaded to this
              conversation.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
