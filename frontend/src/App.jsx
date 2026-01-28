import React, { useState, useEffect } from 'react';
import {
  EuiProvider,
  EuiPage,
  EuiPageBody,
  EuiHeader,
  EuiHeaderSectionItem,
  EuiHeaderLogo,
  EuiHeaderLinks,
  EuiHeaderLink,
  EuiPageSection,
  EuiCard,
  EuiButton,
  EuiSpacer,
  EuiTextArea,
  EuiFormRow,
  EuiCallOut,
  EuiCheckbox,
  EuiFieldText,
  EuiFieldPassword
} from '@elastic/eui';
import '@elastic/eui-theme-borealis';

import CrawlLogs from './components/CrawlLogs';
import CrawlRuns from './components/CrawlRuns';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const DEFAULT_CONFIG = {
  "domains": [
    {
      "url": "https://www.elastic.co",
      "seed_urls": [
        "https://www.elastic.co/search-labs",
        "https://www.elastic.co/search-labs/tutorials/examples"
      ]
    }
  ],
  "max_crawl_depth": 3,
  "max_unique_url_count": 500,
  "output_index": "example-crawl"
};

function App() {
  const [configText, setConfigText] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logExecutionId, setLogExecutionId] = useState(null);
  const [useDefaultOutputSink, setUseDefaultOutputSink] = useState(true);
  const [esUrl, setEsUrl] = useState('');
  const [esApiKey, setEsApiKey] = useState('');

  const handleRunCrawl = async () => {
    if (isSubmitting) return; // Prevent double click
    setError(null);
    setIsSubmitting(true);

    try {
      const config = JSON.parse(configText);

      if (!useDefaultOutputSink && esUrl && esApiKey) {
        config.elasticsearch_url = esUrl;
        config.elasticsearch_api_key = esApiKey;
      }

      console.debug('Submitting crawl with config:',config);

      const response = await fetch(`${API_BASE}/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      // Add a short timeout to prevent rapid re-enabling
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  return (
    <EuiProvider colorMode="light">
      <EuiPage grow={true}
        restrictWidth={'65rem'}
        paddingSize="none"
        >
       
        <EuiPageBody>
          <EuiHeader>
            <EuiHeaderSectionItem>
              <EuiHeaderLogo>Elastic Open Web Crawler</EuiHeaderLogo>
            </EuiHeaderSectionItem>

            <EuiHeaderSectionItem>
              <EuiHeaderLinks aria-label="App navigation links example">
                {(closeMobilePopover) => (
                  <>
                  <a href="https://github.com/elastic/crawler" target="_blank" rel="noopener noreferrer">
                    <EuiHeaderLink isActive onClick={closeMobilePopover}>
                      Docs
                    </EuiHeaderLink>
                  </a>

                  </>
                )}
              </EuiHeaderLinks>
            </EuiHeaderSectionItem>
          </EuiHeader>

          <EuiSpacer size="m"></EuiSpacer>

          <EuiPageSection
          
            paddingSize="none">
            <EuiCard
              title="Crawl Configuration"
              description="Edit the JSON configuration below and click Run to start a new crawl"
            >
              
              <EuiFormRow
                fullWidth
              >
                <EuiTextArea
                  fullWidth
                  rows={15}
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  placeholder="Enter crawl configuration JSON"
                  style={{ fontFamily: 'monospace' }}
                />
              </EuiFormRow>

              <EuiSpacer />

              <EuiCheckbox
                id="defaultOutputSink"
                label="Default Output Sink"
                checked={useDefaultOutputSink}
                onChange={(e) => setUseDefaultOutputSink(e.target.checked)}
              />
              
              <EuiSpacer size="m" />
              
              <EuiFormRow
                label="Elasticsearch URL"
                fullWidth
              >
                <EuiFieldText
                  fullWidth
                  placeholder="https://your-cluster.elastic-cloud.com:443"
                  value={esUrl}
                  onChange={(e) => setEsUrl(e.target.value)}
                  disabled={useDefaultOutputSink}
                />
              </EuiFormRow>
              
              <EuiSpacer size="s" />
              
              <EuiFormRow
                label="API Key"
                fullWidth
              >
                <EuiFieldPassword
                  fullWidth
                  placeholder="Enter your Elasticsearch API key"
                  value={esApiKey}
                  onChange={(e) => setEsApiKey(e.target.value)}
                  disabled={useDefaultOutputSink}
                  type="dual"
                />
              </EuiFormRow>
              
              <EuiSpacer size="m" />

              {error && (
                <>
                  <EuiCallOut title="Error" color="danger">
                    {error}
                  </EuiCallOut>
                  <EuiSpacer />
                </>
              )}

              <EuiButton
                onClick={handleRunCrawl}
                fill
                color="primary"
                isLoading={isSubmitting}
                iconType="play"
              >
                Run
              </EuiButton>
            </EuiCard>

            <EuiSpacer size="xl" />

            <CrawlRuns onViewLogs={setLogExecutionId} />
          </EuiPageSection>
        </EuiPageBody>
      </EuiPage>
      
      {logExecutionId && (
        <CrawlLogs
          executionId={logExecutionId}
          onClose={() => setLogExecutionId(null)}
        />
      )}
    </EuiProvider>
  );
}

export default App;
