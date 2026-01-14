import { useEffect, useRef, useState } from 'react'
import createModule from './wasm/sim.js'
import './App.css'

export default function App() {
  const wasmRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const dprRef = useRef(window.devicePixelRatio || 1);
  const quantity = useRef(null);
  const currIdx = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    createModule().then(Module => {
      wasmRef.current = Module;
    }).catch(error => {
      console.error("Error with loading WASM: ", error);
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      dprRef.current = dpr;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctxRef.current = ctx;

      // if (wasmRef.current) {
      //   initCanvas(wasmRef.current, ctx);
      // }
    };

    setup();
    window.addEventListener("resize", setup);

    return () => window.removeEventListener("resize", setup);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const Module = wasmRef.current;
    const ctx = ctxRef.current;
    let rafId;
    let running = true;

    initCanvas(Module, ctx);
    const loop = () => {
      if (!running) return;
      const ptr = Module._step();
      const heap = Module.HEAP64;

      const base = ptr / 8;
      console.log(heap[base], heap[base + 1]);
      if (heap[base] === -1n) {
        running = false;
        return;
      }
      console.log("drawing");
      draw(ctx, heap[base], heap[base + 1]);

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      setIsRunning(false);
      cancelAnimationFrame(rafId)
    };
  }, [isRunning])

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const _quantity = BigInt(formData.get("quantity"));
    const algorithm = Number(formData.get("algorithm"));
    quantity.current = _quantity;

    // console.log(quantity)
    const Module = wasmRef.current;
    Module._init(_quantity, algorithm);
    setIsRunning(true);
    initCanvas(Module, ctxRef.current);
  }

  const initCanvas = (Module, ctx) => {
    const body_ptr = Module._get_arr();
    const heap = Module.HEAP64;

    const stride = 8 / 8;
    const base = body_ptr / 8;

    const rect = canvasRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const cellWidth = width / Number(quantity.current);
    const heightStride = height / Number(quantity.current);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.beginPath();
    for (let i = 0; i < quantity.current; i++) {
      const idx = base + i * stride;
      // console.log("i: %d, num: %d", i, heap[idx]);
      const cellHeight = Number(heap[idx]) * heightStride;
      // console.log(cellWidth, height, cellHeight);
      ctx.rect(cellWidth * i, height - cellHeight, cellWidth, cellHeight);
      ctx.fill();
    }
  }

  const draw = (ctx, idx, val) => {
    console.log("updating index %d with value %d", idx, val);
    const rect = canvasRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const cellWidth = width / Number(quantity.current);
    const heightStride = height / Number(quantity.current);

    ctx.clearRect(cellWidth * Number(idx), 0, cellWidth, height);
    ctx.fillStyle = "white";
    ctx.beginPath();
    const cellHeight = Number(val) * heightStride;
    ctx.rect(cellWidth * Number(idx), height - cellHeight, cellWidth, cellHeight);
    ctx.fill();
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
              <option value="0">Bubble</option>
              <option value="1">Merge</option>
              <option value="2">Quick</option>
            </select>
          </div>

          <button>Run</button>
        </form>
      </header>

      <canvas ref={canvasRef} />
    </main>
  )
}