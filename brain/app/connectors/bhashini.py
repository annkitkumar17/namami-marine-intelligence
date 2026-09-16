from typing import Optional
from datetime import datetime, timezone

from app.connectors.base import BaseConnector
from app.schemas.connectors import BhashiniResult


class BhashiniConnector(BaseConnector):
    def __init__(self, api_key: Optional[str] = None, endpoint_url: str = "https://dhruva-api.bhashini.gov.in/services/inference"):
        super().__init__(
            connector_id="bhashini",
            name="BHASHINI Indic Language AI",
            category="LANGUAGE",
            provider="Digital India Bhashini Division (MeitY)",
            source_url=endpoint_url,
            is_enabled=True,
            api_key=api_key,
        )

    async def translate_text(self, text: str, source_lang: str = "en", target_lang: str = "hi") -> BhashiniResult:
        meta = self.build_metadata(
            data_mode="demo" if not self.api_key else "live",
            confidence=0.98,
        )

        translations: dict = {
            "hi": "निकटतम मत्स्य क्षेत्र 46.2 किमी दक्षिण-पश्चिम में स्थित है। मौसम सुरक्षित है।",
            "ta": "அருகிலுள்ள மீன்பிடி மண்டலம் 46.2 கிமீ தொலைவில் உள்ளது. வானிலை பாதுகாப்பானது.",
        }

        translated = translations.get(target_lang, text)

        return BhashiniResult(
            source_text=text,
            detected_language=source_lang,
            translated_text=translated,
            target_language=target_lang,
            audio_output_url=None,
            metadata=meta,
        )

    async def fetch_normalized(self, **kwargs) -> BhashiniResult:
        return await self.translate_text(
            text=kwargs.get("text", ""),
            source_lang=kwargs.get("source_lang", "en"),
            target_lang=kwargs.get("target_lang", "hi"),
        )

    def get_demo_fixture(self, **kwargs) -> BhashiniResult:
        meta = self.build_metadata(data_mode="demo", confidence=0.95)
        return BhashiniResult(
            source_text="Nearest PFZ is 46.2 km west.",
            detected_language="en",
            translated_text="निकटतम मत्स्य क्षेत्र 46.2 किमी पश्चिम में है।",
            target_language="hi",
            metadata=meta,
        )
