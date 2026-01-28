import datetime
import os
import uuid
from typing import Any, Dict

import uvicorn
from fastapi import BackgroundTasks, FastAPI, HTTPException, Response

import db
from crawler import run_crawler_process
from models import CrawlConfig, CrawlResult, CrawlStatus

app = FastAPI(title="Elastic Crawler Service")

active_processes: Dict[str, Any] = {}


@app.post("/api/crawl")
async def trigger_crawl(
    config: CrawlConfig,
    background_tasks: BackgroundTasks,
    async_mode: bool = True,
) -> Dict[str, Any]:
    crawl_config = config.model_dump(exclude_none=True)
    execution_id = str(uuid.uuid4())
    started_at = datetime.datetime.now(datetime.UTC).replace(tzinfo=None).isoformat()

    es_host = crawl_config.pop("elasticsearch_url", None) or os.environ.get("ES_URL")
    es_api_key = crawl_config.pop("elasticsearch_api_key", None) or os.environ.get("ES_API_KEY")

    print(f"Starting crawl with execution ID: {execution_id}. Output ES: {es_host}")
    
    initial_status = CrawlStatus(
        status="started",
        execution_id=execution_id,
        started_at=started_at,
        message="Crawl queued for execution",
    )
    
    db.create_crawl(execution_id, CrawlConfig(**crawl_config), initial_status)

    if async_mode:
        background_tasks.add_task(run_crawler_process, execution_id, crawl_config, es_host, es_api_key, active_processes)
        return initial_status.model_dump()
    else:
        result = run_crawler_process(execution_id, crawl_config, es_host, es_api_key, active_processes)
        return result


@app.get("/api/status/{execution_id}")
async def check_status(execution_id: str) -> Dict[str, Any]:
    status = db.get_crawl_status(execution_id)
    
    if not status:
        raise HTTPException(
            status_code=404,
            detail=f"Execution {execution_id} not found"
        )
    
    return status.model_dump()


@app.post("/api/cancel/{execution_id}")
async def cancel_crawl(execution_id: str) -> Dict[str, Any]:
    if not db.crawl_exists(execution_id):
        raise HTTPException(
            status_code=404,
            detail=f"Execution {execution_id} not found"
        )

    process = active_processes.get(execution_id)
    message = ""
    
    if process and process.poll() is None:
        process.kill()
        process.wait()
        message = "Crawl has been cancelled"
        del active_processes[execution_id]
    else:
        message = "Crawl already completed or not running"
    
    status = db.get_crawl_status(execution_id)
    if status:
        status.status = "cancelled"
        status.message = message
        db.update_status(execution_id, status)
        return status.model_dump()
    
    return {"status": "cancelled", "message": message}


@app.get("/api/crawls")
async def list_crawls() -> Dict[str, Any]:
    crawls = db.list_all_crawls()
    crawls_data = {exec_id: status.model_dump() for exec_id, status in crawls.items()}
    return {
        "total": len(crawls_data),
        "crawls": crawls_data
    }


@app.get("/api/logs/{execution_id}")
async def get_logs_endpoint(execution_id: str) -> Response:
    content = db.get_logs(execution_id)
    
    if content is None:
        raise HTTPException(
            status_code=404,
            detail=f"Log file for execution {execution_id} not found"
        )
    
    return Response(content=content, media_type="text/plain")


@app.get("/api/info/{execution_id}")
async def get_info(execution_id: str) -> Dict[str, Any]:
    info = db.get_crawl_info(execution_id)
    
    if not info:
        raise HTTPException(
            status_code=404,
            detail=f"Info file for execution {execution_id} not found"
        )
    
    return info


@app.get("/api/health")
async def health_check() -> Dict[str, str]:
    return {"status": "healthy", "service": "crawly", "version": "1.0.0"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
