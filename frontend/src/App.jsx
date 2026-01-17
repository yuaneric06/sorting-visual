import { useEffect, useRef, useState } from 'react'
import createModule from './wasm/sim.js'
import './App.css'

export default function App() {
  const wasmRef = useRef(null);
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

        // ---- stats canvas ----
        const sRect = sCanvas.getBoundingClientRect();
        sCanvas.width = Math.round(sRect.width * dpr);
        sCanvas.height = Math.round(sRect.height * dpr);

        const sCtx = sCtxRef.current;
        sCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // redraw static UI only
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
        sCtx.fillStyle = "white";
        sCtx.font = "15px Fira Code";
        sCtx.fillText("Operations done:", 20, 30);

        // mark that main canvas needs redraw
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
    const ctx = ctxRef.current;
    const sCtx = sCtxRef.current;
    let rafId;
    const swapOp = algorithm.current == 2;

    initCanvas(Module, ctx);
    const loop = () => {
      if (needsRedrawRef.current) {
        needsRedrawRef.current = false;
        initCanvas(Module, ctxRef.current);
        updateOpCnt(sCtxRef.current);
      }

      const ptr = Module._step();
      const heap = Module.HEAP32;

      const base = ptr / 4;
      if (heap[base] === -1) {
        setIsRunning(false);
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
  }, [isRunning])

  const handleSubmit = (e) => {
    e.preventDefault();

    const Module = wasmRef.current;
    if (!Module) return;

    const formData = new FormData(e.currentTarget);
    const _quantity = Number(formData.get("quantity"));
    const _algorithm = Number(formData.get("algorithm"));
    quantity.current = _quantity;
    algorithm.current = _algorithm;

    setIsRunning(true);

    requestAnimationFrame(() => {
      Module._init(_quantity, _algorithm);
      computeCanvasGeo();
      initCanvas(wasmRef.current, ctxRef.current);
    });
  }

  const initCanvas = (Module, ctx) => {
    const body_ptr = Module._get_arr();
    const heap = Module.HEAP32;

    const stride = 1;
    const base = body_ptr / 4;

    const { width, height, cellWidth, heightStride } = canvasGeoRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";

    ctx.beginPath();
    for (let i = 0; i < quantity.current; i++) {
      const idx = base + i * stride;
      const cellHeight = Number(heap[idx]) * heightStride;
      ctx.rect(cellWidth * i, height - cellHeight, cellWidth, cellHeight);
      ctx.fill();
    }
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
    const heap = Module.HEAP32;
    const base = Module._get_op_cnt() / 4;
    const cnt = heap[base];

    sCtx.fillStyle = "white";
    sCtx.font = "15px Fira Code";
    sCtx.clearRect(100, 0, 200, 100);
    sCtx.fillText(String(algorithm.current >= 1 ? (cnt / 2) : cnt), 170, 30);
  }

  return (
    <main>
      <header>
        <form onSubmit={handleSubmit}>
          <div className="option">
            <label for="quantity">Element count: </label>
            <input type="number" id="quantity" name="quantity" />
          </div>

          <div className="option">
            <label for="algorithm">Algorithm: </label>
            <select name="algorithm" id="algorithm">
              <option value="" disable select hidden>Select an algorithm</option>
              <option value="0">Merge</option>
              <option value="1">Insertion</option>
              <option value="2">Quick</option>
              <option value="3">Selection</option>
              <option value="4">Bubble</option>
              <option value="5">Heap</option>
              <option value="6">Cycle</option>
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