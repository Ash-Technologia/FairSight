# backend/services/webhook_service.py
# Sends formatted bias alerts to Slack, Discord, or Teams webhooks.
# Auto-detects platform from URL. Never crashes the audit pipeline.

import httpx
from datetime import datetime, timezone
import asyncio


def _detect_platform(url: str) -> str:
    if "discord.com" in url:
        return "discord"
    if "office.com" in url or "webhook.office" in url:
        return "teams"
    return "slack"


def _build_slack_payload(filename: str, fairness_score: int, verdict: str,
                         severity: str, top_violation: dict, dashboard_url: str) -> dict:
    score_emoji = "🟢" if fairness_score >= 80 else ("🟡" if fairness_score >= 60 else "🔴")
    return {
        "text": f"🚨 FairSight Bias Alert — {filename}",
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"🚨 Bias Alert — {filename}"}
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Verdict:*\n{verdict}"},
                    {"type": "mrkdwn", "text": f"*Fairness Score:*\n{score_emoji} {fairness_score}/100"},
                    {"type": "mrkdwn", "text": f"*Severity:*\n{severity}"},
                    {"type": "mrkdwn", "text": f"*Top Violation:*\n{top_violation.get('metric_name', 'N/A')} = {top_violation.get('value', 'N/A')}"},
                ]
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "View Report →"},
                        "url": dashboard_url,
                        "style": "primary"
                    }
                ]
            }
        ]
    }


def _build_discord_payload(filename: str, fairness_score: int, verdict: str,
                           severity: str, top_violation: dict, dashboard_url: str) -> dict:
    color = 0x22C55E if fairness_score >= 80 else (0xF59E0B if fairness_score >= 60 else 0xEF4444)
    return {
        "embeds": [{
            "title": f"🚨 FairSight Bias Alert — {filename}",
            "color": color,
            "fields": [
                {"name": "Verdict", "value": verdict, "inline": True},
                {"name": "Score", "value": f"{fairness_score}/100", "inline": True},
                {"name": "Severity", "value": severity, "inline": True},
                {
                    "name": "Top Violation",
                    "value": f"{top_violation.get('metric_name', 'N/A')}: "
                             f"{top_violation.get('value', 'N/A')} "
                             f"(threshold: {top_violation.get('threshold', 'N/A')})"
                },
                {"name": "View Report", "value": f"[Open Dashboard]({dashboard_url})"},
            ],
            "footer": {"text": "FairSight Diagnostic Platform"},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }]
    }


def _build_teams_payload(filename: str, fairness_score: int, verdict: str,
                         severity: str, top_violation: dict, dashboard_url: str) -> dict:
    return {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "FF0000" if fairness_score < 70 else "F59E0B",
        "summary": f"FairSight Bias Alert — {filename}",
        "sections": [{
            "activityTitle": f"🚨 Bias Detected in **{filename}**",
            "activitySubtitle": f"Verdict: {verdict} | Score: {fairness_score}/100 | Severity: {severity}",
            "facts": [
                {"name": "Top Violation", "value": f"{top_violation.get('metric_name', 'N/A')} = {top_violation.get('value', 'N/A')}"},
            ],
        }],
        "potentialAction": [{
            "@type": "OpenUri",
            "name": "View Report",
            "targets": [{"os": "default", "uri": dashboard_url}],
        }]
    }


async def fire_bias_alert(
    webhook_url: str,
    audit_id: str,
    filename: str,
    fairness_score: int,
    verdict: str,
    severity: str,
    top_violation: dict,
    dashboard_url: str,
) -> bool:
    """Send formatted bias alert to Slack/Discord/Teams. Never raises — always returns bool."""
    try:
        platform = _detect_platform(webhook_url)
        if platform == "discord":
            payload = _build_discord_payload(filename, fairness_score, verdict, severity, top_violation, dashboard_url)
        elif platform == "teams":
            payload = _build_teams_payload(filename, fairness_score, verdict, severity, top_violation, dashboard_url)
        else:
            payload = _build_slack_payload(filename, fairness_score, verdict, severity, top_violation, dashboard_url)

        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(webhook_url, json=payload)
            if res.status_code not in (200, 204):
                print(f"[webhook] Non-200 response from {platform}: {res.status_code} {res.text[:200]}")
                return False
        return True
    except Exception as e:
        print(f"[webhook] Fire failed (non-blocking): {e}")
        return False
