# backend/routers/settings.py
# CRUD for webhook configurations. Stored in Firestore with local JSON fallback.

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
import os
import asyncio
from services.webhook_service import fire_bias_alert

router = APIRouter()

SETTINGS_CACHE = os.path.join(os.path.dirname(__file__), '..', '.fairsight_webhook_config.json')


def _load_configs() -> dict:
    try:
        if os.path.exists(SETTINGS_CACHE):
            with open(SETTINGS_CACHE, 'r') as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_config(uid: str, config: dict):
    all_configs = _load_configs()
    all_configs[uid] = config
    with open(SETTINGS_CACHE, 'w') as f:
        json.dump(all_configs, f, indent=2)


def get_webhook_config(uid: str) -> dict:
    """Public helper used by analyze.py to fetch config before firing alerts."""
    configs = _load_configs()
    return configs.get(uid, {})


class WebhookConfig(BaseModel):
    uid: str
    slack_url: Optional[str] = None
    discord_url: Optional[str] = None
    teams_url: Optional[str] = None
    bias_threshold: Optional[int] = 70
    enabled: Optional[bool] = True


@router.get("/webhooks")
async def get_webhooks(uid: str):
    config = get_webhook_config(uid)
    # Never expose full URL in list — return masked versions
    masked = {}
    for key in ('slack_url', 'discord_url', 'teams_url'):
        val = config.get(key)
        if val:
            masked[key] = val[:30] + '…' + val[-6:] if len(val) > 36 else val
        else:
            masked[key] = None
    return {
        **masked,
        'bias_threshold': config.get('bias_threshold', 70),
        'enabled': config.get('enabled', True),
        'last_alert': config.get('last_alert', None),
    }


@router.post("/webhooks")
async def save_webhooks(config: WebhookConfig):
    existing = get_webhook_config(config.uid)
    # Merge: only overwrite keys that are explicitly provided
    merged = {**existing}
    if config.slack_url is not None:
        merged['slack_url'] = config.slack_url if config.slack_url.strip() else None
    if config.discord_url is not None:
        merged['discord_url'] = config.discord_url if config.discord_url.strip() else None
    if config.teams_url is not None:
        merged['teams_url'] = config.teams_url if config.teams_url.strip() else None
    merged['bias_threshold'] = config.bias_threshold
    merged['enabled'] = config.enabled
    merged['uid'] = config.uid
    _save_config(config.uid, merged)
    return {"status": "saved"}


class TestWebhookBody(BaseModel):
    uid: str


@router.post("/webhooks/test")
async def test_webhook(body: TestWebhookBody):
    config = get_webhook_config(body.uid)
    if not config.get('enabled', True):
        return {"status": "disabled", "message": "Alerts are disabled."}

    active_url = config.get('slack_url') or config.get('discord_url') or config.get('teams_url')
    if not active_url:
        raise HTTPException(status_code=400, detail="No webhook URL configured.")

    ok = await fire_bias_alert(
        webhook_url=active_url,
        audit_id="test-alert",
        filename="FairSight_Test_Dataset.csv",
        fairness_score=44,
        verdict="GUILTY",
        severity="CRITICAL",
        top_violation={"attribute": "race", "metric_name": "demographic_parity", "value": "0.342", "threshold": "0.10"},
        dashboard_url="http://localhost:3000/dashboard",
    )
    if ok:
        return {"status": "sent", "message": "Test alert delivered successfully."}
    else:
        raise HTTPException(status_code=502, detail="Webhook delivery failed. Check your URL.")
