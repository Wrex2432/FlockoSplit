import { useEffect, useRef, useState, useCallback } from "react";

export function usePersonDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<any>(null);
  const animFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const loadModel = useCallback(async () => {
    try {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      modelRef.current = await cocoSsd.load();
      setIsLoading(false);
    } catch {
      setError("Failed to load detection model.");
      setIsLoading(false);
    }
  }, []);

  const detect = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const predictions = await modelRef.current.detect(videoRef.current);
    const people = predictions.filter((p: any) => p.class === "person" && p.score > 0.5);
    setCount(people.length);

    // Draw on canvas
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "hsl(175, 85%, 55%)";
        ctx.lineWidth = 3;
        ctx.font = "16px Space Grotesk";
        ctx.fillStyle = "hsl(175, 85%, 55%)";
        people.forEach((p: any) => {
          const [x, y, w, h] = p.bbox;
          ctx.strokeRect(x, y, w, h);
          ctx.fillText(`${Math.round(p.score * 100)}%`, x, y - 5);
        });
      }
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera().then(loadModel);
    return stopCamera;
  }, [startCamera, loadModel, stopCamera]);

  useEffect(() => {
    if (!isLoading && !error) {
      detect();
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isLoading, error, detect]);

  return { videoRef, canvasRef, count, isLoading, error, stopCamera };
}
