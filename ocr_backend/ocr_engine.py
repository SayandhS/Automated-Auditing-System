"""OCR engine: loads LightOnOCR model and extracts raw text from images."""

import torch
from PIL import Image
from transformers import LightOnOcrForConditionalGeneration, LightOnOcrProcessor


class OcrEngine:
    """Singleton-style OCR engine that loads the model once."""

    def __init__(self) -> None:
        self._model = None
        self._processor = None
        self._device = None
        self._dtype = None

    def load(self) -> None:
        """Load the LightOnOCR model and processor into memory."""
        if self._model is not None:
            return  # already loaded

        self._device = (
            "mps" if torch.backends.mps.is_available()
            else "cuda" if torch.cuda.is_available()
            else "cpu"
        )
        self._dtype = torch.float32 if self._device == "mps" else torch.bfloat16

        model_name = "lightonai/LightOnOCR-2-1B-base"
        self._model = LightOnOcrForConditionalGeneration.from_pretrained(
            model_name, torch_dtype=self._dtype
        ).to(self._device)
        self._processor = LightOnOcrProcessor.from_pretrained(model_name)

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def extract_text(self, image: Image.Image) -> str:
        """Run OCR on a PIL Image and return the raw extracted text."""
        if not self.is_loaded:
            raise RuntimeError("OCR engine not loaded. Call load() first.")

        import time
        print(f"[OCR] Starting text extraction (device={self._device})...")
        start_time = time.time()

        image = image.convert("RGB")

        conversation = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {
                        "type": "text",
                        "text": (
                            "Extract ALL text from this document image. "
                            "Return the complete text content exactly as it appears, "
                            "preserving the layout as much as possible."
                        ),
                    },
                ],
            }
        ]

        inputs = self._processor.apply_chat_template(
            conversation,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        inputs = {
            k: v.to(device=self._device, dtype=self._dtype) if v.is_floating_point() else v.to(self._device)
            for k, v in inputs.items()
        }

        print(f"[OCR] Running model inference (max_new_tokens=1024)...")
        output_ids = self._model.generate(**inputs, max_new_tokens=1024)
        generated_ids = output_ids[0, inputs["input_ids"].shape[1]:]
        result = self._processor.decode(generated_ids, skip_special_tokens=True)

        elapsed = time.time() - start_time
        print(f"[OCR] Extraction complete in {elapsed:.1f}s — {len(result)} chars extracted")
        return result


# Module-level singleton
engine = OcrEngine()
