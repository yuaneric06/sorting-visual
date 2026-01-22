import { useEffect, useRef, useState } from 'react'
import createModule from './wasm/sim.js'
import apiKeys from './hidden.js'
import { GoogleGenAI } from '@google/genai';
import './App.css'

export default function App() {
  const wasmRef = useRef(null);
  const heapRef = useRef(null);
  const canvasRef = useRef(null);
  const sCanvasRef = useRef(null);
  const ctxRef = useRef(null);
  const sCtxRef = useRef(null);
  const quantity = useRef(null);
  const algorithm = useRef(null);
  const needsRedrawRef = useRef(false);
  const canvasGeoRef = useRef({
    width: 0,
    height: 0,
    cellWidth: 0,
    heightStride: 0
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const computeCanvasGeo = () => {
    const rect = canvasRef.current.getBoundingClientRect();
    const geo = canvasGeoRef.current;

    geo.width = rect.width;
    geo.height = rect.height;
    geo.cellWidth = rect.width / quantity.current;
    geo.heightStride = rect.height / quantity.current;
  };

  useEffect(() => {
    let resizeRaf = null;

    // --- Load WASM once ---
    createModule()
      .then((Module) => {
        wasmRef.current = Module;
      })
      .catch((error) => {
        console.error("Error with loading WASM:", error);
      });

    const canvas = canvasRef.current;
    const sCanvas = sCanvasRef.current;
    if (!canvas || !sCanvas) return;

    // --- Get contexts ONCE ---
    ctxRef.current = canvas.getContext("2d");
    sCtxRef.current = sCanvas.getContext("2d");

    const resize = () => {
      // debounce resize to one per frame
      if (resizeRaf !== null) return;

      if (quantity.current != null) {
        computeCanvasGeo();
        needsRedrawRef.current = true;
      }

      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;

        const dpr = window.devicePixelRatio || 1;

        // ---- main canvas ----
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);

        const canvasGeo = canvasGeoRef.current;
        const width = rect.width;
        const height = rect.height;
        canvasGeo.width = width;
        canvasGeo.height = height;

        canvasGeo.cellWidth = width / Number(quantity.current);
        canvasGeo.heightStride = height / Number(quantity.current);

        const ctx = ctxRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const sRect = sCanvas.getBoundingClientRect();
        sCanvas.width = Math.round(sRect.width * dpr);
        sCanvas.height = Math.round(sRect.height * dpr);

        const sCtx = sCtxRef.current;
        sCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
        sCtx.fillStyle = "white";
        sCtx.font = "15px Fira Code";

        needsRedrawRef.current = true;
      });
    };

    // initial setup
    resize();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;


    const Module = wasmRef.current;
    heapRef.current = Module.HEAP32;
    const ctx = ctxRef.current;
    const sCtx = sCtxRef.current;
    let rafId;
    const heap = heapRef.current;

    initCanvas(Module, ctx);
    if (algorithm.current == 10) {
      vibeSort();
      return;
    }

    const loop = () => {
      if (needsRedrawRef.current) {
        needsRedrawRef.current = false;
        initCanvas(Module, ctxRef.current);
        updateOpCnt(sCtxRef.current);
      }

      const ptr = Module._step();

      const base = ptr / 4;
      if (heap[base] === -1) {
        setIsRunning(false);
        setIsFinished(true);
        return;
      }
      updateOpCnt(sCtx);
      draw(ctx, heap[base], heap[base + 1]);

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId)
    };
  }, [isRunning]);

  useEffect(() => {
    calculateWritesPerElement(sCtxRef.current);
    displayRuntime(sCtxRef.current);
  }, [isFinished]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const Module = wasmRef.current;
    if (!Module) return;

    const formData = new FormData(e.currentTarget);
    const _quantity = Number(formData.get("quantity"));
    const _algorithm = Number(formData.get("algorithm"));
    quantity.current = _quantity;
    algorithm.current = _algorithm;

    Module._init(_quantity, _algorithm);
    setIsRunning(true);
    setIsFinished(false);

    computeCanvasGeo();
    initCanvas(wasmRef.current, ctxRef.current);
  }

  const initCanvas = (Module, ctx) => {
    const body_ptr = Module._get_arr();
    const heap = heapRef.current;
    if (!heap) return;

    const base = body_ptr / 4;

    const { width, height, cellWidth, heightStride } = canvasGeoRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";

    ctx.beginPath();
    for (let i = 0; i < quantity.current; i++) {
      const idx = base + i;
      const cellHeight = Number(heap[idx]) * heightStride;
      ctx.rect(cellWidth * i, height - cellHeight, cellWidth, cellHeight);
    }
    ctx.fill();
  }

  const draw = (ctx, idx, val) => {
    const { height, cellWidth, heightStride } = canvasGeoRef.current;

    // opsCnt.current++;

    ctx.clearRect(cellWidth * Number(idx), 0, cellWidth, height);
    ctx.fillStyle = "white";

    ctx.beginPath();
    const cellHeight = val * heightStride;
    ctx.rect(cellWidth * Number(idx), height - cellHeight, cellWidth, cellHeight);
    ctx.fill();
  }

  const updateOpCnt = (sCtx) => {
    const Module = wasmRef.current;
    const heap = heapRef.current;
    const base = Module._get_op_cnt() / 4;
    const cnt = heap[base];
    const canvas = sCtx.canvas;

    sCtx.clearRect(0, 0, canvas.width, canvas.height);
    sCtx.fillStyle = "white";
    sCtx.font = "15px Fira Code";
    sCtx.fillText(`Writes: ${cnt}`, 50, 20);
  }

  const displayRuntime = (sCtx) => {
    const Module = wasmRef.current;
    if (!Module) return;
    const heap = Module.HEAP64;
    const base = Module._get_runtime() / 8;
    const runtime = heap[base];

    sCtx.fillText(`Runtime (ms): ${runtime}`, 50, 50);
  }

  const calculateWritesPerElement = (sCtx) => {
    const Module = wasmRef.current;
    if (!Module || quantity.current == null) return;

    const heap = heapRef.current;
    const base = Module._get_op_cnt() / 4;
    const writes = heap[base];
    const n = quantity.current;

    const writesPerElement = writes / n;

    const canvas = sCtx.canvas;

    sCtx.fillStyle = "white";
    sCtx.font = "15px Fira Code";

    sCtx.fillText("Writes / element:", 20, 35);
    sCtx.fillText(writesPerElement.toFixed(2), 200, 35);
  };

  const vibeSort = async () => {
    console.log("vibing");
    const ctx = ctxRef.current;
    const sCtx = sCtxRef.current;
    ctx.fillStyle = "white";
    ctx.font = "15px Fira Code";
    const { width, height, cellWidth, heightStride } = canvasGeoRef.current;
    const rect = sCanvasRef.current.getBoundingClientRect();
    const sWidth = rect.width;
    const sHeight = rect.height;
    sCtx.fillText("Prompting AI...", sWidth / 2, sHeight / 2);
    const unsortedArray = Array(quantity.current);

    const Module = wasmRef.current;
    const body_ptr = Module._get_arr();
    const heap = heapRef.current;
    if (!heap) return;

    const base = body_ptr / 4;


    for (let i = 0; i < quantity.current; i++) {
      const idx = base + i;
      unsortedArray[i] = Number(heap[idx]);
    }

    const ai = new GoogleGenAI({ apiKey: apiKeys.geminiApiKey });
    const requestText = `Here's an array of integers in Javascript. Return the array but sorted. Only return the array, do not add anything extra: [${unsortedArray}]`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: requestText,
    }).catch(error => {
      console.error("Error: ", error);
      sCtx.clearRect(0, 0, sWidth, sHeight);
      sCtx.fillText("Error with prompting AI\ncheck dev console for details", sWidth / 2, sHeight / 2);
    });
    console.log(response.text);
    const sortedArr = JSON.parse(response.text);


    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.beginPath();
    for (let i = 0; i < sortedArr.length; i++) {
      const cellHeight = sortedArr[i] * heightStride;
      ctx.rect(cellWidth * i, height - cellHeight, cellWidth, cellHeight);
    }
    ctx.fill();
    sCtx.clearRect(0, 0, sWidth, sHeight);
    sCtx.fillText("Vibe sorting completed", sWidth / 2, sHeight / 2);
  }

  return (
    <main>
      <header>
        <form onSubmit={handleSubmit}>
          <div className="option">
            <label htmlFor="quantity">Element count: </label>
            <input type="number" id="quantity" name="quantity" required />
          </div>

          <div className="option">
            <label htmlFor="algorithm">Algorithm: </label>
            <select name="algorithm" id="algorithm" required >
              <option value="" disable select hidden>Select an algorithm</option>
              <option value="0">Merge</option>
              <option value="1">Insertion</option>
              <option value="2">Quick</option>
              <option value="3">Selection</option>
              <option value="4">Bubble</option>
              <option value="5">Heap</option>
              <option value="6">Cycle</option>
              <option value="7">Three way merge</option>
              <option value="8">Bogo</option>
              <option value="9">Stalin</option>
              <option value="-1">Miracle</option>
              <option value="10">Vibe</option>
            </select>
          </div>

          <button>Run</button>
        </form>

        <canvas className="stats" ref={sCanvasRef} />
      </header>

      <canvas className="mainCanvas" ref={canvasRef} />
    </main>
  )
}