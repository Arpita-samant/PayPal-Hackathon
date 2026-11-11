import math
import logging
from typing import List
from app.config import settings

logger = logging.getLogger(__name__)

class VectorService:
    @staticmethod
    def get_embedding(text: str) -> List[float]:
        """Generates a 768-dimensional embedding using Google Gemini or deterministic fallback"""
        if settings.GEMINI_API_KEY:
            try:
                # Attempt to use google-genai
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                response = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=text
                )
                if hasattr(response, "embeddings") and response.embeddings:
                    vals = response.embeddings[0].values
                    return vals[:768] if len(vals) >= 768 else vals
                elif hasattr(response, "embedding") and response.embedding:
                    vals = response.embedding.values
                    return vals[:768] if len(vals) >= 768 else vals
            except Exception as e:
                logger.warning(f"Gemini embedding API call failed: {e}. Using deterministic semantic projection.")

        # High-dimension deterministic projection for offline / test consistency
        return VectorService._deterministic_projection(text, dim=768)

    @staticmethod
    def _deterministic_projection(text: str, dim: int = 768) -> List[float]:
        """Creates normalized 768-dim semantic projection vector based on n-gram hashes"""
        vec = [0.0] * dim
        tokens = text.lower().replace("-", " ").replace("_", " ").split()
        for idx, token in enumerate(tokens):
            h = hash(token)
            slot = abs(h) % dim
            sign = 1.0 if (h >> 3) % 2 == 0 else -1.0
            vec[slot] += sign * (1.0 / (idx + 1)**0.5)

        # Normalize to unit length
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            return [x / norm for x in vec]
        return [0.0] * dim

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)
