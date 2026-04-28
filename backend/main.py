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



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
