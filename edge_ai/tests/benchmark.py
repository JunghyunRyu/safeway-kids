"""Edge AI PoC 벤치마크.

모델 파일이 있으면 100회 추론 시간을 측정한다.
없으면 graceful skip.

실행: python -m tests.benchmark  (edge_ai 디렉토리에서)
또는: python tests/benchmark.py
"""

import os
import sys
import time
import statistics

import numpy as np

# edge_ai를 패키지 루트로 설정
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from config import YOLO_ONNX_PATH, ARCFACE_ONNX_PATH, INPUT_RESOLUTION

NUM_ITERATIONS = 100


def benchmark_yolo():
    """YOLOv8n ONNX 추론 벤치마크."""
    if not os.path.exists(YOLO_ONNX_PATH):
        print(f"[SKIP] YOLO model not found: {YOLO_ONNX_PATH}")
        return None

    from core.yolo_detector import YOLODetector

    print(f"[YOLO] Loading model: {YOLO_ONNX_PATH}")
    detector = YOLODetector(model_path=YOLO_ONNX_PATH, input_size=INPUT_RESOLUTION)

    # Warm-up
    dummy_frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    for _ in range(5):
        detector.detect(dummy_frame)

    # Benchmark
    times = []
    for i in range(NUM_ITERATIONS):
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        t0 = time.perf_counter()
        detector.detect(frame)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        times.append(elapsed_ms)

    detector.close()
    return times


def benchmark_arcface():
    """ArcFace ONNX 임베딩 추출 벤치마크."""
    if not os.path.exists(ARCFACE_ONNX_PATH):
        print(f"[SKIP] ArcFace model not found: {ARCFACE_ONNX_PATH}")
        return None

    import onnxruntime as ort

    print(f"[ArcFace] Loading model: {ARCFACE_ONNX_PATH}")
    sess_options = ort.SessionOptions()
    sess_options.intra_op_num_threads = 4
    sess_options.inter_op_num_threads = 1
    session = ort.InferenceSession(
        ARCFACE_ONNX_PATH,
        sess_options=sess_options,
        providers=["CPUExecutionProvider"],
    )
    input_name = session.get_inputs()[0].name

    # Warm-up
    dummy = np.random.rand(1, 3, 112, 112).astype(np.float32)
    for _ in range(5):
        session.run(None, {input_name: dummy})

    # Benchmark
    times = []
    for i in range(NUM_ITERATIONS):
        face = np.random.rand(1, 3, 112, 112).astype(np.float32)
        t0 = time.perf_counter()
        session.run(None, {input_name: face})
        elapsed_ms = (time.perf_counter() - t0) * 1000
        times.append(elapsed_ms)

    return times


def benchmark_preprocess():
    """YOLOv8n 전처리(letterbox) 벤치마크. 모델 불필요."""
    print("[Preprocess] Benchmarking letterbox resize...")

    import cv2

    target = INPUT_RESOLUTION
    times = []
    for _ in range(NUM_ITERATIONS):
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        t0 = time.perf_counter()

        h, w = frame.shape[:2]
        ratio = min(target / h, target / w)
        new_w, new_h = int(w * ratio), int(h * ratio)
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        pad_w = (target - new_w) // 2
        pad_h = (target - new_h) // 2
        padded = np.full((target, target, 3), 114, dtype=np.uint8)
        padded[pad_h:pad_h + new_h, pad_w:pad_w + new_w] = resized
        blob = padded[:, :, ::-1].astype(np.float32) / 255.0
        blob = blob.transpose(2, 0, 1)
        blob = np.expand_dims(blob, axis=0)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        times.append(elapsed_ms)

    return times


def print_stats(name: str, times: list[float]):
    """통계 출력."""
    print(f"\n{'='*60}")
    print(f"  {name} Benchmark ({len(times)} iterations)")
    print(f"{'='*60}")
    print(f"  Mean:   {statistics.mean(times):8.2f} ms")
    print(f"  Median: {statistics.median(times):8.2f} ms")
    print(f"  Stdev:  {statistics.stdev(times):8.2f} ms")
    print(f"  Min:    {min(times):8.2f} ms")
    print(f"  Max:    {max(times):8.2f} ms")
    p95 = sorted(times)[int(len(times) * 0.95)]
    print(f"  P95:    {p95:8.2f} ms")
    print(f"  P99:    {sorted(times)[int(len(times) * 0.99)]:8.2f} ms")
    fps = 1000.0 / statistics.mean(times) if statistics.mean(times) > 0 else 0
    print(f"  ~FPS:   {fps:8.1f}")
    print(f"{'='*60}")


def main():
    print("=" * 60)
    print("  SafeWay Kids Edge AI PoC Benchmark")
    print(f"  Input Resolution: {INPUT_RESOLUTION}x{INPUT_RESOLUTION}")
    print(f"  Iterations: {NUM_ITERATIONS}")
    print("=" * 60)

    results = {}

    # Preprocess (always runs)
    preprocess_times = benchmark_preprocess()
    if preprocess_times:
        results["Preprocess (letterbox)"] = preprocess_times

    # YOLO
    yolo_times = benchmark_yolo()
    if yolo_times:
        results["YOLOv8n ONNX (detect)"] = yolo_times

    # ArcFace
    arcface_times = benchmark_arcface()
    if arcface_times:
        results["ArcFace ONNX (embedding)"] = arcface_times

    if not results:
        print("\n[!] No benchmarks ran. Model files not found.")
        print(f"    YOLO:    {YOLO_ONNX_PATH}")
        print(f"    ArcFace: {ARCFACE_ONNX_PATH}")
        return

    for name, times in results.items():
        print_stats(name, times)

    # Summary
    print(f"\n{'='*60}")
    print("  Summary")
    print(f"{'='*60}")
    for name, times in results.items():
        mean = statistics.mean(times)
        p95 = sorted(times)[int(len(times) * 0.95)]
        print(f"  {name:30s}  mean={mean:.1f}ms  p95={p95:.1f}ms")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
