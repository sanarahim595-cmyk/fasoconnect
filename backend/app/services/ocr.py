import re
from dataclasses import dataclass

CNIB_NOT_DETECTED_MESSAGE = "Numéro CNIB non détecté. Veuillez scanner une CNIB lisible."

CNIB_PATTERNS = [
    re.compile(r"\bCNIB\s*(?:N|N°|NO|NUMERO|NUMÉRO)?\s*[:#-]?\s*([A-Z0-9]{6,24})\b", re.IGNORECASE),
    re.compile(r"\b(?:N|N°|NO|NUMERO|NUMÉRO)\s*[:#-]?\s*([A-Z]{1,4}[0-9]{5,18})\b", re.IGNORECASE),
    re.compile(r"\b([A-Z]{1,4}[0-9]{6,18})\b", re.IGNORECASE),
    re.compile(r"\b([0-9]{8,18})\b"),
]


@dataclass(frozen=True)
class OCRResult:
    cnib_number: str | None
    confidence: float
    raw_text: str
    provider: str


class CnibOCRService:
    def extract_cnib_number(self, *, content: bytes, filename: str | None = None) -> OCRResult:
        raw_text = self._extract_text(content)
        searchable = " ".join(part for part in [filename or "", raw_text] if part)
        cnib_number = self._find_cnib_number(searchable)

        if not cnib_number:
            return OCRResult(
                cnib_number=None,
                confidence=0,
                raw_text=raw_text,
                provider="simulated_ocr",
            )

        confidence = 0.92 if "CNIB" in searchable.upper() else 0.66
        return OCRResult(
            cnib_number=cnib_number,
            confidence=confidence,
            raw_text=raw_text,
            provider="simulated_ocr",
        )

    def _extract_text(self, content: bytes) -> str:
        try:
            decoded = content.decode("utf-8", errors="ignore")
            cleaned = "".join(
                char for char in decoded
                if char == "\n" or char == "\r" or char == "\t" or ord(char) >= 32
            )
            return cleaned[:800]
        except Exception:
            return ""

    def _find_cnib_number(self, value: str) -> str | None:
        normalized = value.upper().replace("_", " ").replace(".", " ")
        for pattern in CNIB_PATTERNS:
            match = pattern.search(normalized)
            if match:
                candidate = re.sub(r"[^A-Z0-9]", "", match.group(1).upper())
                if self._looks_like_pdf_internal_number(candidate):
                    continue
                return candidate
        return None

    def _looks_like_pdf_internal_number(self, value: str) -> bool:
        if not value.isdigit():
            return False
        return len(set(value)) == 1 or value.startswith("000000")
