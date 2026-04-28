from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import analyze, monitor, sdk, events, simulate, settings, mitigate, preflight, benchmark, firewall, report, debias, cicd, stream_analyze

app = FastAPI(
    title="FairSight API",
    version="1.0.0",
    description="Real-time AI bias detection and monitoring platform"
)

# Build list of allowed origins dynamically
# In production on Render, ALLOW_ALL_ORIGINS=true or set multiple FRONTEND_URL values
_frontend_url = os.getenv("FRONTEND_URL", "")
_allow_all = os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true"

if _allow_all:
    _origins = ["*"]
else:
    _origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    # Add every URL in FRONTEND_URL (comma-separated list supported)
    for url in _frontend_url.split(","):
        url = url.strip()
        if url:
            _origins.append(url)
            # Also add without trailing slash and with www variant
            _origins.append(url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.(vercel\.app|run\.app)" if not _allow_all else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/analyze", tags=["Analysis"])
app.include_router(stream_analyze.router, prefix="/analyze", tags=["Analysis-Stream"])
app.include_router(monitor.router, prefix="/monitor", tags=["Monitor"])
app.include_router(sdk.router, prefix="/sdk", tags=["SDK"])
app.include_router(events.router, tags=["Events"])
app.include_router(simulate.router, tags=["Simulation"])
app.include_router(settings.router, prefix="/settings", tags=["Settings"])
app.include_router(mitigate.router, prefix="/mitigate", tags=["Mitigation"])
app.include_router(preflight.router, prefix="/preflight", tags=["Preflight"])
app.include_router(benchmark.router, prefix="/benchmark", tags=["Benchmark Lab"])
app.include_router(firewall.router,  prefix="/firewall",  tags=["Fairness Firewall"])
app.include_router(report.router,    prefix="/report",    tags=["Compliance Report"])
app.include_router(debias.router,    prefix="/debias",    tags=["Auto-Debiasing"])
app.include_router(cicd.router,      prefix="/cicd",      tags=["CI/CD Gate"])


@app.get("/")
async def root():
    return {
        "name": "FairSight API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
