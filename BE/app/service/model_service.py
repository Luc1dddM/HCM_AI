import torch
import numpy as np

class ModelService:
    def __init__(
        self,
        model,
        preprocess,
        tokenizer,
        device: str = None,  # None để tự detect
    ):
        # tự chọn device: GPU nếu có, CPU nếu không
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        self.model = model.to(self.device)
        self.preprocess = preprocess
        self.tokenizer = tokenizer
        self.model.eval()

    def embedding(self, query_text: str) -> np.ndarray:
        """
        Return (1, ndim 1024) numpy.ndarray
        """
        with torch.no_grad():
            text_tokens = self.tokenizer([query_text]).to(self.device)
            query_embedding = (
                self.model.encode_text(text_tokens)
                .cpu()
                .detach()
                .numpy()
                .astype(np.float32)
            )
        return query_embedding
