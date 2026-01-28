import datetime
import os
import subprocess
import tempfile
from typing import Any, Dict

import yaml

import db
from elasticsearch_client import ElasticsearchClient
from models import CrawlResult, CrawlStats, CrawlStatus


def parse_crawl_stats(log_content: str) -> CrawlStats:
    stats_data = {}
    for line in log_content.split("\n"):
        if "Pages visited:" in line:
            stats_data["pages_visited"] = line.split(":")[-1].strip()
        elif "Documents upserted:" in line:
            stats_data["documents_indexed"] = line.split(":")[-1].strip()
        elif "Crawl duration" in line:
            stats_data["duration_seconds"] = line.split(":")[-1].strip()
    return CrawlStats(**stats_data)


def run_crawler_process(execution_id: str, crawl_config: Dict[str, Any], es_host: str, es_api_key: str, active_processes: Dict[str, Any]) -> CrawlResult:
    if not es_host or not es_api_key:
        result = CrawlResult(
            status="error",
            message="Elasticsearch configuration not found in request or environment variables"
        )
        db.update_result(execution_id, result)
        return result
    
    full_config = {
        **crawl_config,
        "output_sink": "elasticsearch",
        "elasticsearch": {
            "host": es_host,
            "api_key": es_api_key,
        },
    }

    try:
        es_client = ElasticsearchClient(url=es_host, api_key=es_api_key)
        index_name = crawl_config.get("output_index")
        es_client.ensure_index(index_name)
    except Exception as e:
        result = CrawlResult(
            status="error",
            message=f"Failed to create Elasticsearch index: {str(e)}"
        )
        db.update_result(execution_id, result)
        return result

    config_file = tempfile.NamedTemporaryFile(
        mode="w", suffix=".yml", delete=False, dir="/tmp"
    )
    yaml.dump(full_config, config_file)
    config_file.close()
    config_path = config_file.name

    status_info = db.get_crawl_status(execution_id)
    if status_info:
        status_info.status = "running"
        status_info.message = "Crawl is in progress"
        db.update_status(execution_id, status_info)

    crawl_dir = db.get_crawl_dir(execution_id)
    log_path = db.get_log_path(execution_id)

    try:
        with open(log_path, "w") as log_file:
            process = subprocess.Popen(
                ["jruby", "bin/crawler", "crawl", config_path],
                cwd="/crawler",
                stdout=log_file,
                stderr=subprocess.STDOUT,
                text=True,
            )
            
            active_processes[execution_id] = process
            
            try:
                process.wait(timeout=3300)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()

        with open(log_path, "r") as log_file:
            log_content = log_file.read()
        
        crawl_stats = parse_crawl_stats(log_content) if log_content else None

        error_message = None
        if process.returncode != 0:
            with open(log_path, "r") as log_file:
                error_content = log_file.read()
            error_message = error_content[:500] if error_content else "Crawl failed"
        
        # Read status to get started_at
        status_info = db.get_crawl_status(execution_id)
        started_at = status_info.started_at if status_info else None
        completed_at = datetime.datetime.now(datetime.UTC).replace(tzinfo=None).isoformat()

        response = CrawlResult(
            status="completed" if process.returncode == 0 else "failed",
            return_code=process.returncode,
            domains_crawled=[d.get("url") for d in crawl_config.get("domains", [])],
            started_at=started_at,
            completed_at=completed_at,
            error_message=error_message
        )

        db.update_result(execution_id, response)
        
        # Update status with completed_at, stats, and message
        if status_info:
            status_info.status = "completed" if process.returncode == 0 else "failed"
            status_info.completed_at = completed_at
            status_info.stats = crawl_stats
            
            # Update message with completion info
            if crawl_stats and crawl_stats.duration_seconds:
                status_info.message = f"Crawl completed in {crawl_stats.duration_seconds} seconds"
            else:
                status_info.message = "Crawl completed"
            
            if process.returncode != 0:
                status_info.message = "Crawl failed"
            
            db.update_status(execution_id, status_info)
        
        if execution_id in active_processes:
            del active_processes[execution_id]
        return response

    except Exception as e:
        result = CrawlResult(status="failed", message=f"Error running crawler: {str(e)}")
        db.update_result(execution_id, result)
        if execution_id in active_processes:
            del active_processes[execution_id]
        return result
    finally:
        if os.path.exists(config_path):
            os.unlink(config_path)
