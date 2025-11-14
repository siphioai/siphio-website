#!/bin/bash
cd /Users/marley/siphio-website/api
export PYTHONPATH=/Users/marley/siphio-website/api
../api/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 "$@"
