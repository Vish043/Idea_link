import { useState } from 'react';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

interface IPProtectionToolsProps {
  ideaId: string;
  ideaHash?: string;
  locked?: boolean;
  versionHistory?: Array<{
    version: number;
    content: string;
    timestamp: string;
    changedBy: {
      _id: string;
      name: string;
      email: string;
    } | string;
  }>;
  isOwner: boolean;
  onLockChange?: (locked: boolean) => void;
}

export default function IPProtectionTools({
  ideaId,
  ideaHash,
  locked = false,
  versionHistory = [],
  isOwner,
  onLockChange,
}: IPProtectionToolsProps) {
  const [showHash, setShowHash] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificate, setCertificate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const { showError, showSuccess } = useToast();

  const handleToggleLock = async () => {
    if (!isOwner) return;

    try {
      setTogglingLock(true);
      const response = await api.patch(`/ideas/${ideaId}/lock`, { locked: !locked });
      showSuccess(response.data.message);
      if (onLockChange) {
        onLockChange(!locked);
      }
    } catch (err: any) {
      showError(err.response?.data?.error || `Failed to ${locked ? 'unlock' : 'lock'} idea`);
    } finally {
      setTogglingLock(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ideas/${ideaId}/certificate`);
      // API returns { success: true, certificate: string } or just the certificate string
      const cert = response.data.certificate || response.data;
      setCertificate(cert);
      setShowCertificate(true);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!certificate) return;

    const blob = new Blob([certificate], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IP-Certificate-${ideaId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyHash = () => {
    if (ideaHash) {
      navigator.clipboard.writeText(ideaHash);
      showSuccess('Hash copied to clipboard');
    }
  };

  const handleVerifyIntegrity = async () => {
    try {
      setVerifying(true);
      const response = await api.get(`/ideas/${ideaId}/verify`);
      setIntegrityStatus({
        valid: response.data.valid,
        message: response.data.message,
      });
      if (response.data.valid) {
        showSuccess('Idea integrity verified successfully');
      } else {
        showError('Idea integrity check failed');
      }
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to verify integrity');
      setIntegrityStatus(null);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          IP Protection Tools
        </h3>
        {locked && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Locked
          </span>
        )}
      </div>

      {/* Lock/Unlock Feature */}
      {isOwner && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Idea Lock</p>
            <p className="text-xs text-gray-600 mt-1">
              {locked
                ? 'This idea is locked and cannot be edited'
                : 'Lock this idea to prevent further edits'}
            </p>
          </div>
          <button
            onClick={handleToggleLock}
            disabled={togglingLock}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              locked
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            } disabled:opacity-50`}
          >
            {togglingLock ? '...' : locked ? 'Unlock' : 'Lock'}
          </button>
        </div>
      )}

      {/* Cryptographic Hash */}
      {ideaHash && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Cryptographic Proof</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyIntegrity}
                disabled={verifying}
                className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Verify Integrity'}
              </button>
              <button
                onClick={handleCopyHash}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Copy Hash
              </button>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            {showHash ? (
              <p className="text-xs font-mono text-gray-800 break-all">{ideaHash}</p>
            ) : (
              <button
                onClick={() => setShowHash(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Click to reveal hash
              </button>
            )}
          </div>
          {integrityStatus && (
            <div className={`p-2 rounded-lg text-xs ${
              integrityStatus.valid 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {integrityStatus.valid ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium">{integrityStatus.message}</span>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">
            SHA-256 hash serves as cryptographic proof of ownership. Includes title, description, summary, tags, skills, owner ID, and timestamp.
          </p>
        </div>
      )}

      {/* Version History */}
      {versionHistory.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-900 hover:text-indigo-600"
          >
            <span>Version History ({versionHistory.length} versions)</span>
            <svg
              className={`w-4 h-4 transition-transform ${showVersionHistory ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showVersionHistory && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {versionHistory.map((version, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-indigo-600">Version {version.version}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(version.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {typeof version.changedBy === 'object' && (
                    <p className="text-xs text-gray-600 mb-1">
                      Changed by: {version.changedBy.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-700 line-clamp-2">{version.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* IP Certificate */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-900">IP Certificate</p>
          <p className="text-xs text-gray-500">Comprehensive ownership proof</p>
        </div>
        <button
          onClick={showCertificate ? () => setShowCertificate(false) : handleGenerateCertificate}
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : showCertificate ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Hide Certificate
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate IP Certificate
            </>
          )}
        </button>
        {showCertificate && certificate && (
          <div className="space-y-2">
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 shadow-sm">
              <div className="bg-white p-4 rounded border border-gray-200">
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">{certificate}</pre>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadCertificate}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download as TXT
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(certificate);
                  showSuccess('Certificate copied to clipboard');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              This certificate includes comprehensive proof of ownership with cryptographic hash, version history, and metadata.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

