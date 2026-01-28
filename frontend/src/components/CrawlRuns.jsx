import React, { useState, useEffect } from 'react';
import {
  EuiText,
  EuiSpacer,
  EuiProgress,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCard,
  EuiBadge,
  EuiButton,
  EuiTextAlign
} from '@elastic/eui';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function CrawlRuns({ onViewLogs }) {
  const [crawls, setCrawls] = useState([]);
  const [isLoadingCrawls, setIsLoadingCrawls] = useState(true);
  const [cancellingIds, setCancellingIds] = useState(new Set());

  const handleCancelCrawl = async (executionId) => {
    setCancellingIds(prev => new Set(prev).add(executionId));
    try {
      const response = await fetch(`${API_BASE}/cancel/${executionId}`, {
        method: 'POST'
      });
      if (response.ok) {
        // Reload crawls to get updated status
        const crawlsResponse = await fetch(`${API_BASE}/crawls`);
        if (crawlsResponse.ok) {
          const data = await crawlsResponse.json();
          if (data.crawls) {
            const crawlsList = Object.entries(data.crawls).map(([id, crawl]) => ({
              execution_id: id,
              ...crawl
            }));
            setCrawls(crawlsList);
          }
        }
      }
    } catch (err) {
      console.error('Failed to cancel crawl:', err);
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(executionId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const loadCrawls = async () => {
      try {
        const response = await fetch(`${API_BASE}/crawls`);
        if (response.ok) {
          const data = await response.json();
          if (data.crawls) {
            const crawlsList = Object.entries(data.crawls).map(([id, crawl]) => ({
              execution_id: id,
              ...crawl
            }));
            console.debug(crawlsList)
            setCrawls(crawlsList);
          }
        }
      } catch (err) {
        console.error('Failed to load crawls:', err);
      } finally {
        setIsLoadingCrawls(false);
      }
    };

    loadCrawls();
    const interval = setInterval(loadCrawls, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'started': return 'default';
      case 'running': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  return (
    <>
      <EuiText>
        <h2>Crawl Runs</h2>
      </EuiText>
      <EuiSpacer />

      {isLoadingCrawls ? (
        <EuiProgress size="xs" color="accent" />
      ) : crawls.length === 0 ? (
        <EuiCallOut
          title="No crawls yet"
          color="primary"
        >
          Start a crawl using the configuration above
        </EuiCallOut>
      ) : (
        <EuiFlexGroup direction="column" gutterSize="m">
          {crawls.map((crawl) => (
            <EuiFlexItem key={crawl.execution_id}>
              {(crawl.status === 'running' || crawl.status === 'started') && (
                <EuiProgress size="xs" color="success" />
              )}
              <EuiCard
                title={
                  <EuiFlexGroup alignItems="center" gutterSize="s">
                    <EuiFlexItem grow={false}>
                      <EuiBadge>
                        {crawl.execution_id}
                      </EuiBadge>
                    </EuiFlexItem>

                    <EuiFlexItem grow={true} />
                    
                    <EuiFlexItem grow={false}>
                      <EuiBadge color={getStatusColor(crawl.status)}>
                        {crawl.status}
                      </EuiBadge>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                }
                titleSize="xs"
              >
                <EuiFlexGroup gutterSize="m" justifyContent="spaceBetween"  >
                  <EuiFlexItem >
                    <EuiTextAlign textAlign="left">
                        <EuiText size="xs">
                        <div>
                        <dl>
                            <dt style={{ fontWeight: 600, marginTop: '8px' }}>Output Index</dt>
                            <dd style={{ marginLeft: 0, marginBottom: '8px' }}>
                              <code>{crawl.config?.output_index || crawl.output_index}</code>
                            </dd>

                            {crawl.elasticsearch_url && (
                              <>
                                <dt style={{ fontWeight: 600 }}>Output: elasticsearch_url</dt>
                                <dd style={{ marginLeft: 0, marginBottom: '8px' }}>
                                  <code>{crawl.elasticsearch_url}</code>
                                </dd>
                              </>
                            )}

                            {(crawl.config?.domains || crawl.domains_crawled) && (
                              <>
                                <dt style={{ fontWeight: 600 }}>Domains</dt>
                                <dd style={{ marginLeft: 0 }}>
                                  {crawl.domains_crawled
                                    ? crawl.domains_crawled.join(', ')
                                    : crawl.config?.domains.map(d => d.url).join(', ')}
                                </dd>
                              </>
                            )}
                        </dl>
                        </div>
                        </EuiText>

                     </EuiTextAlign>
                  </EuiFlexItem>
                  
                  <EuiFlexItem>
                    <EuiTextAlign textAlign="left">
                    <EuiText size="xs">

                        <p><b>Started:</b> {new Date(crawl.started_at).toLocaleString()}</p>
                        
                        {crawl.completed_at && (
                        <p><b>Completed:</b> {crawl.completed_at ? new Date(crawl.completed_at).toLocaleString() : '...'}</p>
                        )}

                        {crawl.message && (
                            <p>{crawl.message}</p>
                        
                        )}

                        {crawl.stats?.pages_visited && (
                            <p><b>Pages Visited:</b> {crawl.stats.pages_visited}</p>
                        )}

                        
                        {crawl.stats?.documents_indexed && (
                            <p><b>Documents Indexed:</b> {crawl.stats.documents_indexed}</p>
                        )}

                    </EuiText>
                    </EuiTextAlign>
                  </EuiFlexItem>
                </EuiFlexGroup>
                
                
                
                {crawl.error_message && (
                  <>
                    <EuiSpacer size="m" />
                    <EuiCallOut title="Error" color="danger" size="s">
                      {crawl.error_message}
                    </EuiCallOut>
                  </>
                )}
                
                {(crawl.status === 'running' || crawl.status === 'completed' || crawl.status === 'failed') && (
                  <>
                    <EuiSpacer size="m" />
                    <EuiFlexGroup gutterSize="s">
                      {(crawl.status === 'running' || crawl.status === 'started') && (
                        <EuiFlexItem grow={false}>
                          <EuiButton
                            size="s"
                            color="danger"
                            iconType="cross"
                            isLoading={cancellingIds.has(crawl.execution_id)}
                            onClick={() => handleCancelCrawl(crawl.execution_id)}
                          >
                            Cancel
                          </EuiButton>
                        </EuiFlexItem>
                      )}
                      <EuiFlexItem grow={false}>
                        <EuiButton
                          size="s"
                          iconType="documentation"
                          onClick={() => onViewLogs(crawl.execution_id)}
                        >
                          View Logs
                        </EuiButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </>
                )}
              </EuiCard>
            </EuiFlexItem>
          ))}
          <EuiSpacer size="l" />
        </EuiFlexGroup>
         
      )}
    </>
  );
}
