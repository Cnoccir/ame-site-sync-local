import React, { useState, useEffect } from 'react';
import { Search, File, FileText, Image, Download, ExternalLink, Calendar, Filter, Loader2, AlertCircle } from 'lucide-react';
import { GoogleDriveService } from '../lib/services/GoogleDriveService';

interface DriveFile {
  file_id: string;
  name: string;
  mime_type: string;
  created_time: string;
  modified_time: string;
  web_view_link: string;
  file_size: number;
  thumbnail_link?: string;
  description?: string;
  relevance_score?: number;
}

interface CustomerGoogleDriveProps {
  customerId: string;
  customerName: string;
}

const CustomerGoogleDrive: React.FC<CustomerGoogleDriveProps> = ({
  customerId,
  customerName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [hasGoogleDriveAccess, setHasGoogleDriveAccess] = useState(false);
  const [customerFolders, setCustomerFolders] = useState<any[]>([]);
  
  const driveService = new GoogleDriveService();

  // File type mappings for filtering
  const fileTypes = {
    'all': 'All Files',
    'application/pdf': 'PDF Documents',
    'application/vnd.google-apps.document': 'Google Docs',
    'application/vnd.google-apps.spreadsheet': 'Google Sheets',
    'application/vnd.google-apps.presentation': 'Google Slides',
    'image/': 'Images',
    'text/': 'Text Files'
  };

  // Year options for filtering (last 4 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i);

  useEffect(() => {
    initializeGoogleDrive();
  }, [customerId]);

  const initializeGoogleDrive = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Initialize Google Drive service
      await driveService.initializeFromSettings();

      // Check if customer has linked folders
      const folders = await driveService.getCustomerFolders(customerId);
      setCustomerFolders(folders);
      setHasGoogleDriveAccess(folders.length > 0);

      // Load recent files if folders exist
      if (folders.length > 0) {
        await searchFiles('', true); // Load recent files
      }
    } catch (err) {
      console.error('Failed to initialize Google Drive:', err);
      setError('Failed to connect to Google Drive. Please check configuration.');
    } finally {
      setIsInitializing(false);
    }
  };

  const searchFiles = async (query: string = searchQuery, isInitialLoad = false) => {
    if (!hasGoogleDriveAccess && !isInitialLoad) return;

    try {
      setIsLoading(true);
      setError(null);

      const searchParams: any = {
        customerId,
        maxResults: 20
      };

      // Add search query if provided
      if (query && query.trim()) {
        searchParams.query = query.trim();
      }

      // Add file type filter
      if (selectedFileType !== 'all') {
        if (selectedFileType.endsWith('/')) {
          // Handle category filters like 'image/' or 'text/'
          searchParams.fileTypePrefix = selectedFileType;
        } else {
          searchParams.fileTypes = [selectedFileType];
        }
      }

      // Add year filter
      if (selectedYear !== 'all') {
        searchParams.yearFilter = parseInt(selectedYear);
      }

      const results = await driveService.searchFiles(searchParams);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search files:', err);
      setError('Failed to search files. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchFiles(searchQuery);
  };

  const handleFilterChange = () => {
    searchFiles(searchQuery);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('document')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (mimeType.includes('spreadsheet')) return <FileText className="w-4 h-4 text-green-500" />;
    if (mimeType.includes('presentation')) return <FileText className="w-4 h-4 text-orange-500" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isInitializing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-gray-600">Connecting to Google Drive...</span>
        </div>
      </div>
    );
  }

  if (!hasGoogleDriveAccess) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Google Drive Access</h3>
        </div>
        <div className="text-gray-600">
          <p className="mb-4">
            No Google Drive folders are linked to <strong>{customerName}</strong>.
          </p>
          <p className="text-sm">
            To enable document access, link this customer's Google Drive folder through the 
            Admin Panel → Google Drive Settings → Folder Management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Google Drive Documents
          </h3>
          <div className="text-sm text-gray-500">
            {customerFolders.length} folder{customerFolders.length !== 1 ? 's' : ''} linked
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedFileType}
              onChange={(e) => {
                setSelectedFileType(e.target.value);
                handleFilterChange();
              }}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(fileTypes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                handleFilterChange();
              }}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Years</option>
              {yearOptions.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">Searching documents...</span>
          </div>
        )}

        {!isLoading && searchResults.length === 0 && !error && (
          <div className="text-center py-8">
            <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery ? 'No documents found matching your search.' : 'No recent documents found.'}
            </p>
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((file) => (
              <div
                key={file.file_id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {file.thumbnail_link ? (
                      <img
                        src={file.thumbnail_link}
                        alt={file.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        {getFileIcon(file.mime_type)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {file.name}
                        </h4>
                        {file.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Modified {formatDate(file.modified_time)}</span>
                          <span>{formatFileSize(file.file_size)}</span>
                          {file.relevance_score && searchQuery && (
                            <span>
                              Relevance: {Math.round(file.relevance_score * 100)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={file.web_view_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Open in Google Drive"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && searchResults.length >= 20 && (
          <div className="text-center mt-6">
            <button
              onClick={() => searchFiles(searchQuery)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Load More Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerGoogleDrive;
