"""Database abstraction layer for crawl data persistence.

Currently implements file-based storage with JSON files.
Can be refactored to use Elasticsearch or another database.
"""

import json
import os
from typing import Any, Dict, Optional

from models import CrawlConfig, CrawlResult, CrawlStatus

CRAWLS_BASE_DIR = "/crawler/crawls"

def get_crawl_dir(execution_id: str) -> str:
    return f"{CRAWLS_BASE_DIR}/{execution_id}"


def get_info_path(execution_id: str) -> str:
    return f"{get_crawl_dir(execution_id)}/info.json"


def get_log_path(execution_id: str) -> str:
    return f"{get_crawl_dir(execution_id)}/logs.log"


def crawl_exists(execution_id: str) -> bool:
    return os.path.exists(get_info_path(execution_id))


def create_crawl(execution_id: str, config: CrawlConfig, status: CrawlStatus):
    crawl_dir = get_crawl_dir(execution_id)
    os.makedirs(crawl_dir, exist_ok=True)
    
    info_data = {
        "config": config.model_dump(exclude_none=True),
        "status": status.model_dump(exclude_none=True),
    }
    
    with open(get_info_path(execution_id), "w") as f:
        json.dump(info_data, f, indent=2)


def update_status(execution_id: str, status: CrawlStatus):
    info_path = get_info_path(execution_id)
    
    info_data = {}
    if os.path.exists(info_path):
        with open(info_path, "r") as f:
            info_data = json.load(f)
    
    info_data["status"] = status.model_dump(exclude_none=True)
    
    with open(info_path, "w") as f:
        json.dump(info_data, f, indent=2)


def update_result(execution_id: str, result: CrawlResult):
    info_path = get_info_path(execution_id)
    
    info_data = {}
    if os.path.exists(info_path):
        with open(info_path, "r") as f:
            info_data = json.load(f)
    
    info_data["result"] = result.model_dump(exclude_none=True)
    
    with open(info_path, "w") as f:
        json.dump(info_data, f, indent=2)


def get_crawl_info(execution_id: str) -> Optional[Dict[str, Any]]:
    info_path = get_info_path(execution_id)
    
    if not os.path.exists(info_path):
        return None
    
    with open(info_path, "r") as f:
        return json.load(f)


def get_crawl_status(execution_id: str) -> Optional[CrawlStatus]:
    info = get_crawl_info(execution_id)
    if not info or "status" not in info:
        return None
    
    status_data = info["status"].copy()
    
    # Add config if available
    if "config" in info:
        status_data["config"] = info["config"]
    
    # Add result if available
    if "result" in info:
        result_data = info["result"]
        status_data["result"] = result_data
        
        # Update completed_at from result if not in status
        if "completed_at" in result_data and not status_data.get("completed_at"):
            status_data["completed_at"] = result_data["completed_at"]
    
    return CrawlStatus(**status_data)


def get_crawl_config(execution_id: str) -> Optional[CrawlConfig]:
    info = get_crawl_info(execution_id)
    if info and "config" in info:
        return CrawlConfig(**info["config"])
    return None


def list_all_crawls() -> Dict[str, CrawlStatus]:
    if not os.path.exists(CRAWLS_BASE_DIR):
        return {}
    
    crawls_list = []
    for execution_id in os.listdir(CRAWLS_BASE_DIR):
        crawl_dir = f"{CRAWLS_BASE_DIR}/{execution_id}"
        
        if os.path.isdir(crawl_dir):
            creation_time = os.path.getctime(crawl_dir)
            crawls_list.append((execution_id, creation_time))
    
    # Sort by creation time, most recent first
    crawls_list.sort(key=lambda x: x[1], reverse=True)
    
    # Build result dict maintaining order
    crawls_data = {}
    for execution_id, _ in crawls_list:
        status = get_crawl_status(execution_id)
        if status:
            crawls_data[execution_id] = status
    
    return crawls_data


def get_logs(execution_id: str) -> Optional[str]:
    log_path = get_log_path(execution_id)
    
    if not os.path.exists(log_path):
        return None
    
    with open(log_path, "r") as f:
        return f.read()
