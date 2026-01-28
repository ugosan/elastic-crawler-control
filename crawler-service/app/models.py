from typing import Optional

from pydantic import BaseModel


class CrawlConfig(BaseModel):
    domains: list[dict]
    output_index: str
    crawl_rules: Optional[list] = None
    extraction_rules: Optional[list] = None
    max_crawl_depth: Optional[int] = None
    max_duration_seconds: Optional[int] = None
    max_url_length: Optional[int] = None
    max_unique_url_count: Optional[int] = None
    user_agent: Optional[str] = None
    elasticsearch_url: Optional[str] = None
    elasticsearch_api_key: Optional[str] = None


class CrawlStats(BaseModel):
    pages_visited: Optional[str] = None
    documents_indexed: Optional[str] = None
    duration_seconds: Optional[str] = None


class CrawlResult(BaseModel):
    status: str
    execution_id: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    message: Optional[str] = None
    return_code: Optional[int] = None
    domains_crawled: Optional[list[str]] = None
    error_message: Optional[str] = None


class CrawlStatus(BaseModel):
    status: str
    execution_id: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    message: Optional[str] = None
    config: Optional[CrawlConfig] = None
    stats: Optional[CrawlStats] = None
    result: Optional[CrawlResult] = None