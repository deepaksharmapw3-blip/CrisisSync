"""
AI Service — Claude-powered intelligence for CrisisSync.

All prompts are optimized for hospitality emergency response context.
Uses streaming-safe single API calls with structured JSON output.
"""

import json
import logging
import anthropic
from typing import Optional, List, Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        if settings.ANTHROPIC_API_KEY:
            self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        else:
            self.client = None
            logger.warning("ANTHROPIC_API_KEY not set — AI features will return mock data")

    async def _call(self, system: str, user: str, max_tokens: int = 1024) -> str:
        """Make an Anthropic API call. Falls back to mock if no key or API error."""
        if not self.client:
            return self._get_mock_fallback(user)
            
        try:
            message = await self.client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return message.content[0].text
        except Exception as e:
            logger.error(f"Claude API error (falling back to mock): {e}")
            return self._get_mock_fallback(user)

    def _get_mock_fallback(self, user_prompt: str) -> str:
        """Generate a context-aware mock JSON response when AI is offline."""
        # Simple rule-based mock for triage based on common keywords
        p = user_prompt.lower()
        severity = 0.5
        actions = ["Assess the situation immediately", "Contact primary response team", "Maintain radio contact"]
        summary = "AI Core offline. Using heuristic fallback analysis."
        tags = ["fallback-mode"]
        
        if "fire" in p:
            severity = 0.9
            summary = "Potential fire incident detected. Immediate evacuation of immediate area suggested."
            actions = ["Confirm fire suppression system active", "Evacuate nearby staff/guests", "Contact local fire department"]
            tags += ["fire-hazard", "high-alert"]
        elif "medical" in p:
            severity = 0.8
            summary = "Medical emergency reported. First aid team should be dispatched."
            actions = ["Retrieve AED and first aid kit", "Clear area for medical responders", "Determine guest consciousness"]
            tags += ["medical-alert", "urgent"]
        elif "security" in p:
            severity = 0.6
            summary = "Security breach or incident. Security team notified."
            actions = ["Review surveillance footage", "Dispatch security officer", "Lockdown nearby access points"]
            tags += ["security-alert"]

        return json.dumps({
            "severity_score": severity,
            "summary": summary,
            "suggested_actions": actions,
            "tags": tags,
            "requires_evacuation": severity > 0.8,
            "call_911": severity > 0.7,
            "estimated_response_time_minutes": 3
        })

    # ── Incident Triage ───────────────────────────────────────────────────────
    async def triage_incident(
        self,
        incident_type: str,
        description: str,
        location: str,
        severity: str,
    ) -> dict:
        """
        Analyze an incident and return structured triage data.
        Returns severity_score, summary, suggested_actions[], tags[].
        """
        system = """You are an expert emergency response coordinator for hospitality properties
(hotels, resorts, event venues). Your job is to quickly triage incoming incidents,
assess risk, and provide clear, actionable guidance for staff and responders.
Always respond with ONLY valid JSON — no explanation, no markdown, no preamble."""

        user = f"""Triage this emergency incident:

Type: {incident_type}
Location: {location}
Severity: {severity}
Description: {description}

Respond with this exact JSON structure:
{{
  "severity_score": <float 0.0-1.0, where 1.0 is life-threatening>,
  "summary": "<2-3 sentence triage summary for responders>",
  "suggested_actions": [
    "<immediate action 1>",
    "<immediate action 2>",
    "<immediate action 3>",
    "<immediate action 4>",
    "<immediate action 5>"
  ],
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "requires_evacuation": <true/false>,
  "call_911": <true/false>,
  "estimated_response_time_minutes": <integer>
}}"""

        raw = await self._call(system, user)
        try:
            clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            return json.loads(clean)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI triage response: {raw}")
            return {
                "severity_score": 0.5,
                "summary": description,
                "suggested_actions": ["Assess the situation", "Contact relevant team"],
                "tags": [incident_type],
                "requires_evacuation": False,
                "call_911": False,
                "estimated_response_time_minutes": 5,
            }

    # ── Incident Summary ──────────────────────────────────────────────────────
    async def summarize_incident(self, incident: Any, messages: List[Any]) -> str:
        """Generate a formal incident report summary from the incident + chat thread."""
        chat_log = "\n".join(
            f"[{m.sender_name or 'Unknown'} - {m.sender_role}]: {m.content}"
            for m in messages
        ) or "No messages yet."

        system = """You are a professional incident report writer for hospitality properties.
Write clear, factual, concise summaries suitable for management review and insurance documentation."""

        user = f"""Write a professional incident summary report for this emergency:

INCIDENT DETAILS:
- Type: {incident.type}
- Location: {incident.location}
- Status: {incident.status}
- Reported: {incident.reported_at}
- Description: {incident.description}
- Reporter: {incident.reporter_name or "Staff"}

RESPONSE COMMUNICATIONS:
{chat_log}

Write a 3-4 paragraph professional incident report. Include: what happened, 
immediate response taken, current status, and any follow-up actions required."""

        return await self._call(system, user, max_tokens=600)

    # ── Smart Quick Replies ───────────────────────────────────────────────────
    async def suggest_responses(
        self, incident: Any, recent_messages: List[Any], user_role: str
    ) -> List[str]:
        """Generate 5 context-aware quick reply suggestions."""
        recent_chat = "\n".join(
            f"{m.sender_role}: {m.content}" for m in reversed(recent_messages)
        ) or "No messages yet."

        system = """You are helping emergency responders communicate quickly and clearly
during a crisis. Generate short, professional, action-oriented messages.
Respond with ONLY a JSON array of 5 strings."""

        user = f"""Incident: {incident.type} at {incident.location} — {incident.description[:200]}
Current status: {incident.status}
Recent chat:
{recent_chat}

I am a: {user_role}

Generate 5 short, relevant quick-reply messages I might want to send right now.
Respond with ONLY a JSON array: ["message1", "message2", "message3", "message4", "message5"]"""

        raw = await self._call(system, user, max_tokens=300)
        try:
            clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(clean)
            if isinstance(result, list):
                return result[:5]
        except Exception:
            pass
        # Fallback quick replies
        return [
            "En route to location",
            "Situation assessed, under control",
            "Need additional support",
            "Area secured",
            "Update incoming",
        ]

    # ── Auto-Tag ──────────────────────────────────────────────────────────────
    async def generate_tags(self, description: str, incident_type: str, location: str) -> List[str]:
        """Generate 3-6 descriptive tags for incident categorization."""
        system = "Generate short descriptive tags for incident categorization. Return ONLY a JSON array of strings."
        user = f"""Type: {incident_type}, Location: {location}
Description: {description}

Generate 4-6 relevant short tags (e.g. "grease-fire", "evacuation-needed", "floor-1").
Return ONLY: ["tag1", "tag2", "tag3", ...]"""

        raw = await self._call(system, user, max_tokens=150)
        try:
            clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(clean)
            if isinstance(result, list):
                return result[:6]
        except Exception:
            pass
        return [incident_type, location.lower().replace(" ", "-")]

    # ── Property Risk Assessment ──────────────────────────────────────────────
    async def risk_assessment(self, incidents: List[Any]) -> dict:
        """Analyze recent incident patterns and provide risk assessment."""
        if not incidents:
            return {
                "risk_level": "low",
                "summary": "No recent incidents. Property appears to be operating safely.",
                "top_risks": [],
                "recommendations": ["Maintain current safety protocols"],
            }

        incident_summary = "\n".join(
            f"- {i.type} at {i.location}: {i.description[:80]} (status: {i.status})"
            for i in incidents[:20]
        )

        system = """You are a hospitality safety risk analyst. Analyze incident patterns
and provide actionable risk assessment. Respond with ONLY valid JSON."""

        user = f"""Analyze these {len(incidents)} recent incidents from a hospitality property:

{incident_summary}

Respond with this JSON:
{{
  "risk_level": "<low|medium|high|critical>",
  "summary": "<2-3 sentence overview>",
  "top_risks": [
    {{"area": "<location>", "risk": "<description>", "frequency": <count>}}
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>"
  ],
  "trend": "<improving|stable|worsening>"
}}"""

        raw = await self._call(system, user, max_tokens=700)
        try:
            clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            return json.loads(clean)
        except Exception:
            return {
                "risk_level": "medium",
                "summary": f"Analyzed {len(incidents)} recent incidents.",
                "top_risks": [],
                "recommendations": ["Review safety protocols", "Increase staff training"],
                "trend": "stable",
            }
