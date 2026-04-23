import threading
import requests
import time
from typing import Any, List

class FairSight:
    """
    FairSight SDK — wraps any ML model for real-time bias monitoring.
    
    Usage:
        fs = FairSight(
            model=your_model,
            protected=["race", "gender"],
            api_key="fs_live_..."
        )
        result = fs.predict(X)  # Exactly like before, now monitored
    """
    
    def __init__(
        self,
        model: Any,
        protected: List[str],
        api_key: str,
        endpoint: str = "http://localhost:8000",
        batch_size: int = 20,
        async_mode: bool = True
    ):
        self.model = model
        self.protected = protected
        self.api_key = api_key
        self.endpoint = endpoint
        self.batch_size = batch_size
        self.async_mode = async_mode
        self._decision_buffer = []
        self._lock = threading.Lock()
        
        # Start background flush thread
        if async_mode:
            self._flush_thread = threading.Thread(target=self._auto_flush, daemon=True)
            self._flush_thread.start()
        
        print(f"✓ FairSight initialized | Protected: {protected} | Mode: {'async' if async_mode else 'sync'}")
    
    def predict(self, X, **kwargs):
        """
        Drop-in replacement for model.predict(). 
        Adds bias monitoring with minimal overhead.
        """
        start = time.perf_counter()
        result = self.model.predict(X, **kwargs)
        latency = (time.perf_counter() - start) * 1000
        
        # Capture decision for monitoring asynchronously
        self._capture_decision(X, result, latency)
        
        return result
    
    def _capture_decision(self, X, predictions, latency_ms: float):
        """Capture decision data without blocking"""
        try:
            # Safely handle different types (Pandas, Numpy, list)
            if hasattr(X, 'to_dict'):
                data = X.to_dict(orient='records')
            elif hasattr(X, 'tolist'):
                data = X.tolist()
            else:
                data = list(X)
                
            preds = predictions.tolist() if hasattr(predictions, 'tolist') else list(predictions)
            
            entry = {
                "timestamp": time.time(),
                "inputs": data[:5] if isinstance(data, list) else data,  # max 5 rows per capture to save memory
                "predictions": preds[:5],
                "latency_ms": round(latency_ms, 2)
            }
            
            with self._lock:
                self._decision_buffer.append(entry)
                if len(self._decision_buffer) >= self.batch_size and not self.async_mode:
                    self._flush()
        except Exception as e:
            # Never crash the parent application
            pass
            
    def _flush(self):
        """Send buffered decisions to FairSight backend"""
        if not self._decision_buffer:
            return
            
        batch = []
        with self._lock:
            batch = self._decision_buffer.copy()
            self._decision_buffer.clear()
            
        try:
            requests.post(
                f"{self.endpoint}/sdk/ingest",
                json={"decisions": batch, "protected_attributes": self.protected, "api_key": self.api_key},
                timeout=3
            )
        except Exception:
            # Silent fail — never impact parent app
            pass
            
    def _auto_flush(self):
        """Background thread: flush every 10 seconds or when batch size is reached"""
        while True:
            time.sleep(10)
            if self._decision_buffer:
                self._flush()
