import { useEffect, useRef, useState } from 'react'
import createModule from './wasm/sim.js'
import './App.css'

export default function App() {
  const wasmRef = useRef(null);
  const canvasRef = useRef(null);
  const sCanvasRef = useRef(null);
  const ctxRef = useRef(null);
  const sCtxRef = useRef(null);
  const dprRef = useRef(window.devicePixelRatio || 1);
  const quantity = useRef(null);
  const algorithm = useRef(null);
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
      let rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      dprRef.current = dpr;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctxRef.current = ctx;

      const sCanvas = sCanvasRef.current;
      rect = sCanvas.getBoundingClientRect();
      sCanvas.width = Math.round(rect.width * dpr);
      sCanvas.height = Math.round(rect.height * dpr);

      const sCtx = sCanvas.getContext("2d");
      sCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      sCtxRef.current = sCtx;

      sCtx.fillStyle = "white";
      sCtx.font = "15px Fira Code";
      sCtx.fillText("Operations done:", 20, 30);
      sCtx.fillText("0", 170, 30);
    };

    setup();
    window.addEventListener("resize", setup);

    return () => window.removeEventListener("resize", setup);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    console.log("entering useEffect");

    const Module = wasmRef.current;
    const ctx = ctxRef.current;
    const sCtx = sCtxRef.current;
    let rafId;
    const swapOp = algorithm.current == 2;
    let loop;

    initCanvas(Module, ctx);
    console.log("frontend canvas initialized");
    if (swapOp) {
      loop = () => {
        let ptr = Module._step();
        let heap = Module.HEAP64;

        let base = ptr / 8;
        // console.log(heap[base], heap[base + 1]);
        if (heap[base] === -1n) {
          setIsRunning(false);
          return;
        }
        updateOpCnt(sCtx);
        // console.log("drawing");
        draw(ctx, sCtx, heap[base], heap[base + 1]);

        ptr = Module._step();
        base = ptr / 8;
        draw(ctx, sCtx, heap[base], heap[base + 1]);


        rafId = requestAnimationFrame(loop);
      };
    }
    else {
      loop = () => {
        console.log("draw loop executed");
        const ptr = Module._step();
        const heap = Module.HEAP64;

        const base = ptr / 8;
        // console.log(heap[base], heap[base + 1]);
        if (heap[base] === -1n) {
          setIsRunning(false);
          return;
        }
        // console.log("drawing");
        updateOpCnt(sCtx);
        draw(ctx, sCtx, heap[base], heap[base + 1]);

        rafId = requestAnimationFrame(loop);
      };
    }
    console.log("entering draw loop");
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId)
    };
  }, [isRunning])

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const _quantity = BigInt(formData.get("quantity"));
    const _algorithm = Number(formData.get("algorithm"));
    quantity.current = _quantity;
    algorithm.current = _algorithm;
    console.log("frontend form submitted");

    const Module = wasmRef.current;
    Module._init(_quantity, _algorithm);
    setIsRunning(true);
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

  const draw = (ctx, sCtx, idx, val) => {
    // console.log("updating index %d with value %d", idx, val);
    const rect = canvasRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const cellWidth = width / Number(quantity.current);
    const heightStride = height / Number(quantity.current);

    // opsCnt.current++;

    ctx.clearRect(cellWidth * Number(idx), 0, cellWidth, height);
    ctx.fillStyle = "white";

    ctx.beginPath();
    const cellHeight = Number(val) * heightStride;
    ctx.rect(cellWidth * Number(idx), height - cellHeight, cellWidth, cellHeight);
    ctx.fill();
  }

  const updateOpCnt = (sCtx) => {
    const Module = wasmRef.current;
    const heap = Module.HEAP64;
    const base = Module._get_op_cnt() / 8;
    const cnt = heap[base];

    sCtx.fillStyle = "white";
    sCtx.font = "15px Fira Code";
    sCtx.clearRect(100, 0, 200, 100);
    sCtx.fillText(String(algorithm.current >= 1 ? cnt / BigInt(2) : cnt), 170, 30);
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