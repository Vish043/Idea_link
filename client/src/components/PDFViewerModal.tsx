import { useEffect, useState } from 'react';
import api from '../utils/api';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  filename?: string;
}

export default function PDFViewerModal({ isOpen, onClose, pdfUrl, filename }: PDFViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch PDF as blob with authentication
  useEffect(() => {
    if (!isOpen || !pdfUrl) return;

    let currentBlobUrl: string | null = null;

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    // Check if it's a cloud storage URL (Cloudinary) - these don't need authentication
    const isCloudStorageUrl = 
      (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) &&
      !pdfUrl.includes(API_BASE_URL) &&
      !pdfUrl.includes('localhost') &&
      !pdfUrl.includes('127.0.0.1');

    // If it's cloud storage, use it directly
    if (isCloudStorageUrl) {
      setBlobUrl(pdfUrl);
      return;
    }

    // For local API files, fetch with authentication
    const fetchPDF = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Extract relative path from full URL if needed
        let requestUrl = pdfUrl;
        
        // If it's a full URL pointing to our API, extract the relative path
        if (pdfUrl.startsWith(API_BASE_URL)) {
          // Remove the base URL to get the relative path
          requestUrl = pdfUrl.substring(API_BASE_URL.length);
        } else if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
          // If it's a different full URL, try to extract path after /api
          const apiIndex = pdfUrl.indexOf('/api');
          if (apiIndex !== -1) {
            requestUrl = pdfUrl.substring(apiIndex + 4); // +4 to skip '/api'
          }
        }
        
        // Remove leading /api if present (since api.get already adds the base URL which includes /api)
        if (requestUrl.startsWith('/api/')) {
          requestUrl = requestUrl.substring(4); // Remove '/api'
        }
        
        // Ensure it starts with /
        if (!requestUrl.startsWith('/')) {
          requestUrl = '/' + requestUrl;
        }
        
        // Get token to ensure it's available
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }
        
        console.log('Fetching PDF from:', requestUrl);
        console.log('Full URL would be:', `${API_BASE_URL}${requestUrl}`);
        
        // Use api.get which will automatically add the Authorization header via interceptor
        const response = await api.get(requestUrl, {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf,application/octet-stream,*/*',
            'Authorization': `Bearer ${token}` // Explicitly add token as fallback
          }
        });
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentBlobUrl = url;
        setBlobUrl(url);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        console.error('Request URL was:', pdfUrl);
        setError(err.response?.data?.error || err.message || 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();

    // Cleanup blob URL when component unmounts or URL changes
    return () => {
      if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [isOpen, pdfUrl]);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {filename || 'Resume'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl ml-4 flex-shrink-0 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-600">Loading PDF...</div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-600">{error}</div>
            </div>
          )}
          {blobUrl && !loading && !error && (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title={filename || 'PDF Viewer'}
              style={{ minHeight: '500px' }}
            />
          )}
        </div>

        {/* Footer with download option */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
          {blobUrl && (
            <a
              href={blobUrl}
              download={filename}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

