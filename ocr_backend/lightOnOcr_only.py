### LightOnOCR  only code for testing

import torch
from transformers import LightOnOcrForConditionalGeneration, LightOnOcrProcessor
from PIL import Image
import ollama
import json
import gc

device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float32 if device == "mps" else torch.bfloat16

local_image_path = "000.jpg"
image = Image.open(local_image_path).convert("RGB")

model = LightOnOcrForConditionalGeneration.from_pretrained("lightonai/LightOnOCR-2-1B-base", torch_dtype=dtype).to(device)
processor = LightOnOcrProcessor.from_pretrained("lightonai/LightOnOCR-2-1B-base")

conversation = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": image},
            {
                "type": "text",
                "text": """
You are a receipt data extraction API.

Your task is to extract structured data from the receipt image.

You MUST return STRICTLY valid JSON.
Do NOT return markdown.
Do NOT return tables.
Do NOT return formatted text.
Do NOT explain anything.
Do NOT include text before or after the JSON.
Return ONLY valid JSON.

If a value is missing, return null.
All numeric values must be numbers (no currency symbols).
Quantities must be numbers.
Prices must be numbers.

Use this exact JSON schema:

{
  "invoice_number": string | null,
  "date": string | null,
  "time": string | null,
  "cashier": string | null,
  "sales_person": string | null,
  "bill_to": string | null,
  "address": string | null,
  "currency": string | null,
  "line_items": [
    {
      "description": string,
      "quantity": number,
      "unit_price": number,
      "total_price": number
    }
  ],
  "subtotal": number | null,
  "tax": number | null,
  "total": number | null,
  "rounding": number | null,
  "payment_method": string | null,
  "card_last4": string | null
}

Extract the data from the receipt image now and return ONLY the JSON object.
"""
            }
        ]
    }
]



inputs = processor.apply_chat_template(
    conversation,
    add_generation_prompt=True,
    tokenize=True,
    return_dict=True,
    return_tensors="pt",
)
inputs = {k: v.to(device=device, dtype=dtype) if v.is_floating_point() else v.to(device) for k, v in inputs.items()}

output_ids = model.generate(**inputs, max_new_tokens=1024)
generated_ids = output_ids[0, inputs["input_ids"].shape[1]:]
output_text = processor.decode(generated_ids, skip_special_tokens=True)


prompt = f"""
You are a receipt extraction API.
Return ONLY valid JSON.

Schema:
{{
  "invoice_number": string | null,
  "date": string | null,
  "time": string | null,
  "total": number | null,
  "payment_method": string | null
}}

Receipt text:
{output_text}
"""

print(output_text)

print("RUNNING OLLAMA INFERENCE")

response = ollama.chat(
    model="llama3:8b",
    messages=[{"role": "user", "content": prompt}],
    format="json",
    options={"temperature": 0}
)

output_text = response["message"]["content"]

print(output_text)

# Try parsing
data = json.loads(output_text)
print(json.dumps(data, indent=2))
