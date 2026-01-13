import { useEffect, useRef, useState } from 'react'
import createModule from './wasm/sim.js'
import './App.css'

export default function App() {
  const wasmRef = useRef(null);
  const canvasRef = useRef(null);
  const quantity = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    createModule().then(Module => {
      wasmRef.current = Module;
    }).catch(error => {
      console.error("Error with loading WASM: ", error);
    })
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const Module = wasmRef.current;
    let rafId;

    const loop = () => {
      Module._step();
      draw(Module);

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
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
  }

  const draw = (Module) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const body_ptr = Module._get_arr();
    const heap = Module.HEAP64;

    const stride = 8 / 8;
    const base = body_ptr / 8;

    const width = canvas.width;
    const height = canvas.height;

    const cellWidth = width / Number(quantity.current);
    const heightStride = height / Number(quantity.current);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    for (let i = 0; i < quantity.current; i++) {
      const idx = base + i * stride;
      console.log("i: %d, num: %d", i, heap[idx]);
      const cellHeight = Number(heap[idx]) * heightStride;
      console.log(cellWidth, height, cellHeight);
      ctx.rect(cellWidth * i, height - cellHeight, cellWidth, cellHeight);
      ctx.fill();
    }
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