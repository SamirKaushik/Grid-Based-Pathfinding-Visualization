import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaStop } from "react-icons/fa"
class Queue {
  constructor() {
    this.items = {};
    this.f = -1;
    this.r = -1;
    this.size = 0;
  }
  push(item) {
    if (this.f === -1) {
      this.f = 0;
    }
    this.r++;
    this.items[this.r] = item;
    this.size++;
  }
  pop() {
    if (this.size === 0) {
      this.f = -1;
      this.r = -1;
      return;
    }
    delete this.items[this.f];
    this.f++;
    this.size--;
  }
  front() {
    return this.items[this.f];
  }
  empty() {
    return (this.size === 0)
  }
}



function App() {
  const [grid, setGrid] = useState(null);
  const [n, setN] = useState(50);
  const [cellSize, setCellSize] = useState(30 / n);
  const [processing, setProcessing] = useState(false);
  const cancelToken = useRef(false);
  const [speed, setSpeed] = useState(8)
  const [cellSizeRef,setCellSizeRef]=useState("vw")
  // const [coords, setCoords] = useState({
  //   start: { x: 0, y: 0 },
  //   end: { x: n - 1, y: n - 1 }
  // })

  useEffect(()=>{
    if(window.innerWidth<800){
      setCellSizeRef("vh")
    }
    else{
      setCellSizeRef("vw")
    }
  },[window.innerWidth])
  const clearPath = async () => {
    var oldgrid = [...grid];
    let rows = n;
    let cols = n;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (oldgrid[i][j] === 2) oldgrid[i][j] = 1;
      }
    }
    setGrid(oldgrid);
  }

  const generateGrid = () => {
    var grid = [];
    let rows = n;
    let cols = n;
    for (let i = 0; i < rows; i++) {
      grid[i] = [];
      for (let j = 0; j < cols; j++) {
        let randomVal = Math.random();
        if (randomVal <= 0.7) grid[i][j] = 1;
        else grid[i][j] = 0;
      }
    }
    grid[0][0] = 1;
    grid[n - 1][n - 1] = 1;
    setGrid([...grid]);
  }
  const dpGrid = () => {
    var grid = [];
    let rows = n;
    let cols = n;
    for (let i = 0; i < rows; i++) {
      grid[i] = [];
      for (let j = 0; j < cols; j++) {
        grid[i][j] = true;
      }
    }
    return grid;
  }
  const isBlocked = (grid, row, col) => {
    return row < 0 || col < 0 || row > (n - 1) || col > (n - 1) || grid[row][col] === 0 || grid[row][col] === 2;
  }
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const findPathSlow = async (grid, row, col) => {
    if (cancelToken.current) { return false; }
    if (isBlocked(grid, row, col)) {
      return false;
    }

    const originalVal = grid[row][col];
    grid[row][col] = 2;
    setGrid([...grid]);
    await delay((10 - speed) * 50);

    if (row === n - 1 && col === n - 1) {
      setGrid([...grid]);
      return true;
    }

    if (await findPathSlow([...grid], row + 1, col)) return true;
    if (await findPathSlow([...grid], row, col + 1)) return true;
    if (await findPathSlow([...grid], row - 1, col)) return true;
    if (await findPathSlow([...grid], row, col - 1)) return true;

    grid[row][col] = originalVal;
    setGrid([...grid]);
    await delay((10 - speed) * 50);

    return false;
  }
  const findPathMemo = async (grid, row, col, dp) => {
    if (cancelToken.current) return false;
    if (isBlocked(grid, row, col)) {
      return false;
    }
    if (dp[row][col] === false) return false; //if path is not available after this point we backtrack

    const originalVal = grid[row][col];
    grid[row][col] = 2;
    setGrid([...grid]);
    await delay((10 - speed) * 50);

    if (row === n - 1 && col === n - 1) {
      setGrid([...grid]);
      return true;
    }

    if (await findPathMemo([...grid], row + 1, col, dp)) return true;
    if (await findPathMemo([...grid], row, col + 1, dp)) return true;
    if (await findPathMemo([...grid], row - 1, col, dp)) return true;
    if (await findPathMemo([...grid], row, col - 1, dp)) return true;

    grid[row][col] = originalVal;
    dp[row][col] = false;
    //path not available after {row,col}, so we memoize this
    setGrid([...grid]);
    await delay((10 - speed) * 50);

    return false;
  }

  const bfs = async (grid) => {
    const q = new Queue();
    q.push({ row: 0, col: 0 });

    const visited = Array.from({ length: n }, () => Array(n).fill(false));

    while (!q.empty()) {
      let size = q.size;
      if (cancelToken.current) return false;
      while (size--) {
        if (cancelToken.current) return false;
        const node = q.front();
        const { row, col } = node;
        grid[row][col] = 2;
        if (row === n - 1 && col === n - 1) {
          // Mark the destination cell as visited
          visited[row][col] = true;

          // Update the grid and trigger a UI update
          setGrid([...grid]);
          await delay((10 - speed) * 50);

          return true;
        }

        visited[row][col] = true; // Mark the current node as visited

        const dirx = [1, 0, -1, 0];
        const diry = [0, 1, 0, -1];

        for (let i = 0; i < 4; i++) {
          const newRow = row + dirx[i];
          const newCol = col + diry[i];

          if (
            newRow >= 0 &&
            newRow < n &&
            newCol >= 0 &&
            newCol < n &&
            grid[newRow][newCol] !== 0 &&
            !visited[newRow][newCol]
          ) {
            q.push({ row: newRow, col: newCol });
            visited[newRow][newCol] = true; // Mark the adjacent node as visited
          }
        }

        q.pop();
      }
      // Update the grid and trigger a UI update after marking the cell as visited
      setGrid([...grid]);
      await delay((10 - speed) * 50);
    }

    return false;

  }

  const selectAlgorithm = async (type) => {
    await clearPath()
    cancelToken.current = false; // Reset the cancel token.
    switch (type) {
      case 1:
        if ((await findPathSlow([...grid], 0, 0))) toast.success("Path Found!!!");
        else toast.error("No Path Found!!!");
        break;
      case 2:
        if ((await findPathMemo([...grid], 0, 0, dpGrid()))) toast.success("Path Found!!!");
        else toast.error("No Path Found!!!");
        break;
      case 3:
        if ((await bfs([...grid]))) toast.success("Destination Reached!!!");
        else toast.error("No Path Found!!!");
        break;
      default: break;
    }
    setProcessing(false)
  }

  useEffect(() => {
    generateGrid()
    setCellSize(30 / n)
    return () => {
      // Cleanup function to cancel ongoing operations when the component unmounts.
      cancelToken.current = true;
    };
  },
    [])


  useEffect(() => {
    if (processing !== false) {
      selectAlgorithm(processing)
    }
  }, [processing])

  return (
    <div className="w-[100vw] h-[100vh] flex items-center justify-center overflow-hidden">
      <ToastContainer />
      <div className="flex md:flex-row flex-col items-center w-full md:px-[50px] md:gap-[50px] gap-[15px] p-[20px]">
        <div style={processing ? { opacity: 0.2 } : { opacity: 1 }} className="flex flex-col gap-[10px] transition flex-grow min-w-[80%] md:min-w-fit md:max-w-1/4" >
          <div className={`rounded-md border px-[10px] text-xs md:text-sm py-[5px] w-full`}>
            <div>Grid Size: {n}</div>
            <input 
            disabled={processing}
            type="range" min={1} max={200} step={1} value={n} onChange={(e) => { setN(e.target.value) }} className="outline-none w-full" name="Size" id="" />
          </div>
          <button
            onClick={() => {
              if (n >= 1) {
                generateGrid()
                setCellSize(30 / n)
              }
              else {
                toast.info("Choose Valid size (10-200) ")
              }
            }}
            className={`rounded-md border px-[10px] py-[5px] text-xs md:text-sm`}
            disabled={processing}
          >Generate
          </button>
        </div>
        <div className="min-w-fit transition">
          <button style={!processing ? { opacity: 0 } : { opacity: 1 }} onClick={() => { cancelToken.current = true; }} className="flex items-center mx-auto gap-[5px] text-sm justify-center hover:text-red-500 transition"><FaStop /> Stop</button>
          <div id="grid" className="rounded-lg p-[15px] shadow-lg transition">
            {
              grid?.map((row, idx) => {
                return <div key={`r${idx}`} id={`r${idx}`} className="flex items-center justify-center">
                  {row?.map((cell, i) => {
                    return <div
                      style={
                        {
                          height: cellSize + cellSizeRef,
                          width: cellSize + cellSizeRef,
                          margin: cellSize / 10 + cellSizeRef
                        }
                      }
                      key={`r${idx}c${i}`}
                      id={`r${idx}c${i}`}
                      className={` 
                    ${idx === 0 && i === 0 ? "bg-blue-500" :
                          idx === n - 1 && i === n - 1 ? "bg-red-500" :
                            cell === 0 ? "bg-gray-200" :
                              cell === 1 ? "bg-white" :
                                cell === 2 && "bg-black"
                        }
                     overflow-visible
                     `}
                    >
                    </div>
                  })}
                </div>
              })
            }
          </div>
        </div>
        <div style={processing ? { opacity: 0.2 } : { opacity: 1 }} className="flex flex-col gap-[5px] md:gap-[10px] transition flex-grow min-w-[80%] md:min-w-fit md:max-w-1/4">
          <div className={`rounded-md border px-[10px] text-xs md:text-sm py-[5px]`}>
            <div>Speed: {speed}</div>
            <input 
            disabled={processing}
            type="range" min={1} max={10} step={1} value={speed} onChange={(e) => { setSpeed(e.target.value) }} className="outline-none w-full" name="Size" id="" />
          </div>
          <button onClick={async () => {
            setProcessing(1)
          }} className="rounded-md border px-[10px] py-[5px] text-xs md:text-sm"
            disabled={processing}
            title="Traverses all possible paths"
          >Backtracking</button>
          <button onClick={async () => {
            setProcessing(2)
          }} className="rounded-md border px-[10px] py-[5px] text-xs md:text-sm"
            disabled={processing}
            title="Won't enter a blocked path again because of memoization"
          >Memoized Backtracking</button>
          <button onClick={async () => {
            setProcessing(3)
          }} className="rounded-md border px-[10px] py-[5px] text-xs md:text-sm"
            disabled={processing}
            title="Visually shows BFS with a flood-filling like effect"
          >Breadth First Search</button>
        </div>
      </div>
    </div>
  );
}

export default App;