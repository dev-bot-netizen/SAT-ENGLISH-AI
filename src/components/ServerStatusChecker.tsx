import React, { useState, useEffect } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ErrorIcon } from './icons/ErrorIcon';
import { XIcon } from './icons/XIcon';

interface Status {
  ok: boolean;
  message: string;
}

interface ServerStatus {
  firebaseAdmin: Status;
  mongoDb: Status;
}

interface ServerStatusCheckerProps {
    onClose: () => void;
}

const ServerStatusChecker: React.FC<ServerStatusCheckerProps> = ({ onClose }) => {
    const [status, setStatus] = useState<ServerStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/health');
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data);
                } else {
                    const message = `Health check endpoint returned HTTP ${response.status}. The API route might be misconfigured or the server is down.`;
                    setStatus({
                        firebaseAdmin: { ok: false, message },
                        mongoDb: { ok: false, message },
                    });
                }
            } catch (error) {
                const message = 'Could not connect to the server. Check your network or for a possible CORS issue.';
                setStatus({
                    firebaseAdmin: { ok: false, message },
                    mongoDb: { ok: false, message },
                });
            } finally {
                setIsLoading(false);
            }
        };
        checkStatus();
    }, []);

    const StatusRow: React.FC<{ serviceName: string; statusInfo?: Status }> = ({ serviceName, statusInfo }) => (
        <div className="flex justify-between items-start text-xs p-2 rounded bg-slate-100 dark:bg-gray-800/50">
            <span className="font-semibold text-slate-700 dark:text-gray-300">{serviceName}:</span>
            {isLoading || !statusInfo ? (
                <SpinnerIcon className="w-4 h-4 text-slate-400" />
            ) : (
                <div className="flex items-center space-x-1">
                    {statusInfo.ok ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                        <ErrorIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className={`text-right ${statusInfo.ok ? 'text-green-400' : 'text-red-400'}`}>
                        {statusInfo.ok ? 'OK' : 'Error'}
                    </span>
                </div>
            )}
        </div>
    );
    
    const renderDetails = (statusInfo?: Status) => {
        if (isLoading || !statusInfo || statusInfo.ok) return null;
        return (
            <div className="mt-1 p-2 text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded">
                <strong>Details:</strong> {statusInfo.message}
            </div>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-3 shadow-2xl z-50 text-slate-900 dark:text-white animate-modal-enter">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold">Backend Status</h3>
                <button 
                    onClick={onClose} 
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close status checker"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
            <div className="space-y-2">
                <div>
                    <StatusRow serviceName="Firebase Admin Init" statusInfo={status?.firebaseAdmin} />
                    {renderDetails(status?.firebaseAdmin)}
                </div>
                 <div>
                    <StatusRow serviceName="MongoDB Connection" statusInfo={status?.mongoDb} />
                     {renderDetails(status?.mongoDb)}
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-3">This panel indicates issues with server environment variables. Please check the reported error and update your configuration.</p>
        </div>
    );
};

export default ServerStatusChecker;
