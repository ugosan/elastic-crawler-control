import datetime
from elasticsearch import Elasticsearch

class ElasticsearchClient:
    def __init__(self, url: str, api_key: str):
        self.es = Elasticsearch(url, api_key=api_key)
        
    def ensure_index(self, index_name: str) -> None:
        if not self.es.indices.exists(index=index_name):
            self.es.indices.create(index=index_name)
        
        mappings = {
            "_meta": {
                "description": "Each document represents a web page with the following schema: 'title' and 'meta_description' provide high-level summaries; 'body' contains the full text content; 'headings' preserves the page hierarchy for semantic weighting. URL metadata is decomposed into 'url_host', 'url_path', and 'url_path_dir1/2/3' to allow for granular filtering by site section (e.g., 'blog' or 'tutorials'). 'links' contains extracted outbound URLs for discovery. Crawl timestamp: " + datetime.datetime.now(datetime.UTC).replace(tzinfo=None).isoformat() + "."
            },
            "properties": {
                "body": {
                    "type": "text",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "ignore_above": 256
                        },
                        "semantic_elser": {
                            "type": "semantic_text",
                            "inference_id": ".elser-2-elastic",
                            "model_settings": {
                                "service": "elastic",
                                "task_type": "sparse_embedding"
                            }
                        },
                        "semantic_jinav3": {
                            "type": "semantic_text",
                            "inference_id": ".jina-embeddings-v3",
                            "model_settings": {
                                "service": "elastic",
                                "task_type": "text_embedding",
                                "dimensions": 1024,
                                "similarity": "cosine",
                                "element_type": "float"
                            }
                        }
                    }
                },
                "headings": {
                    "type": "text",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "ignore_above": 256
                        },
                        "semantic_elser": {
                            "type": "semantic_text",
                            "inference_id": ".elser-2-elastic",
                            "model_settings": {
                                "service": "elastic",
                                "task_type": "sparse_embedding"
                            }
                        },
                        "semantic_jinav3": {
                            "type": "semantic_text",
                            "inference_id": ".jina-embeddings-v3",
                            "model_settings": {
                                "service": "elastic",
                                "task_type": "text_embedding",
                                "dimensions": 1024,
                                "similarity": "cosine",
                                "element_type": "float"
                            }
                        }
                    }
                },
                "title": {
                    "type": "text",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "ignore_above": 256
                        },
                        "semantic_elser": {
                            "type": "semantic_text",
                            "inference_id": ".elser-2-elastic",
                            "model_settings": {
                                "service": "elastic",
                                "task_type": "sparse_embedding"
                            }
                        },
                        "semantic_jinav3": {
                            "type": "semantic_text",
                            "inference_id": ".jina-embeddings-v3",
                            "model_settings": {
                                "service": "elastic",
                                "task_type": "text_embedding",
                                "dimensions": 1024,
                                "similarity": "cosine",
                                "element_type": "float"
                            }
                        }
                    }
                }
            }
        }
        self.es.indices.put_mapping(index=index_name, body=mappings)
