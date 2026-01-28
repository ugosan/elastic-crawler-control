import React, { useState, useEffect, useRef } from 'react';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiCodeBlock,
  EuiCallOut,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiSpacer
} from '@elastic/eui';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function CrawlLogs({ executionId, onClose }) {
  const [logs, setLogs] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`${API_BASE}/logs/${executionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Log file not found');
          } else {
            setError(`Failed to load logs: ${response.statusText}`);
          }
          setIsLoading(false);
          return;
        }

        const logContent = await response.text();
        
        const parsedLogs = logContent
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r');
        
        setLogs(parsedLogs);


        setError(null);
        setIsLoading(false);
      } catch (err) {
        setError(`Error loading logs: ${err.message}`);
        setIsLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);

    return () => clearInterval(interval);
  }, [executionId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <EuiFlyout onClose={onClose} size="l" ownFocus>
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={true}>
            <EuiTitle size="m">
              <h2>Crawler Logs</h2>
            </EuiTitle>
          </EuiFlexItem>
          
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <code style={{ fontSize: '12px', color: '#69707D' }}>{executionId}</code>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        {isLoading ? (
          <EuiFlexGroup justifyContent="center" alignItems="center" style={{ height: '100%' }}>
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="xl" />
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : error ? (
          <EuiCallOut title="Error" color="warning" iconType="alert">
            {error}
          </EuiCallOut>
        ) : logs ? (
          <>
            <EuiCodeBlock
              language="log"
              fontSize="s"
              paddingSize="m"
              overflowHeight="100%"
              
            >
              {logs}
            </EuiCodeBlock>
            <div ref={logsEndRef} />
          </>
        ) : (
          <EuiCallOut title="No logs available" color="primary">
            Logs will appear here once the crawler starts running.
          </EuiCallOut>
        )}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
}
