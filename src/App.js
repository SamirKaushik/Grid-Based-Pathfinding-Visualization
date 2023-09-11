/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaStop } from "react-icons/fa";
import { AiFillCloseCircle, AiOutlineClear, AiOutlineControl } from "react-icons/ai"
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
  const [cellSizeRef, setCellSizeRef] = useState("vw")
  const [gridSpacing, setgridSpacing] = useState(1);
  const [mazeCreation, setMazeCreation] = useState(false)
  const [cellSelection,setCellSelection]=useState(false)
  const [mobileView, setMobileView] = useState(false);
  const [popup, setPopup] = useState(null)
  // const [coords, setCoords] = useState({
  //   start: { x: 0, y: 0 },
  //   end: { x: n - 1, y: n - 1 }
  // })

  useEffect(() => {
    if (window.innerWidth < 600) {
      setMobileView(true)
    }
    else setMobileView(false)
    if (window.innerWidth < 800) {
      setCellSizeRef("vh")
    }
    else {
      setCellSizeRef("vw")
    }
  }, [window.innerWidth])
  const clearPath = async () => {
    var oldgrid = [...grid];
    let rows = n;
    let cols = n;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (oldgrid[i][j] === 2 || oldgrid[i][j] === 3) oldgrid[i][j] = 1;
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
        if (randomVal <= gridSpacing / 100 + 0.7) grid[i][j] = 1;
        else grid[i][j] = 0;
      }
    }
    grid[0][0] = 1;
    grid[n - 1][n - 1] = 1;
    setGrid([...grid]);
  }
  const clearGrid = () => {
    var grid = [];
    let rows = n;
    let cols = n;
    for (let i = 0; i < rows; i++) {
      grid[i] = [];
      for (let j = 0; j < cols; j++) {
        grid[i][j] = 1;
      }
    }
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
  const findPathSlow = async (grid, row, col, dist) => {
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
      toast.success(`Reached the destination! Distance covered: ${dist} cells`)
      return true;
    }

    if (await findPathSlow([...grid], row + 1, col, dist + 1)) return true;
    if (await findPathSlow([...grid], row, col + 1, dist + 1)) return true;
    if (await findPathSlow([...grid], row - 1, col, dist + 1)) return true;
    if (await findPathSlow([...grid], row, col - 1, dist + 1)) return true;

    grid[row][col] = originalVal;
    setGrid([...grid]);
    if (!cancelToken.current)
      await delay((10 - speed) * 50);

    return false;
  }
  const findPathMemo = async (grid, row, col, dp, dist) => {
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
      toast.success(`Reached the destination! Distance covered: ${dist} cells`)
      return true;
    }

    if (await findPathMemo([...grid], row + 1, col, dp, dist + 1)) return true;
    if (await findPathMemo([...grid], row, col + 1, dp, dist + 1)) return true;
    if (await findPathMemo([...grid], row - 1, col, dp, dist + 1)) return true;
    if (await findPathMemo([...grid], row, col - 1, dp, dist + 1)) return true;

    grid[row][col] = originalVal;
    dp[row][col] = false;
    //path not available after {row,col}, so we memoize this
    setGrid([...grid]);
    if (!cancelToken.current)
      await delay((10 - speed) * 50);

    return false;
  }

  const bfs = async (grid) => {
    const q = new Queue();
    q.push({ row: 0, col: 0 });

    const visited = Array.from({ length: n }, () => Array(n).fill(false));

    while (!q.empty()) {
      let size = q.size;
      if (cancelToken.current) {
        clearPath();
        return false;
      }
      while (size--) {
        if (cancelToken.current) {
          clearPath();
          return false;
        }
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

  const traceShortestPath = async (path, grid, dist) => {
    // console.log(grid, "entered func");
    const dirx = [1, 0, -1, 0];
    const diry = [0, 1, 0, -1];
    let x = 0, y = 0;
    for (let i = 0; i < path.length; i++) {
      if (cancelToken.current) {
        clearPath();
        return false;
      }
      grid[x][y] = 2;
      x += dirx[path[i]];
      y += diry[path[i]];
      setGrid([...grid]);
      await delay((10 - speed) * 50);
    }
    toast.success(`Reached the destination! Distance covered: ${dist} cells`)
    return true;
  }

  const shortestPath = async (grid) => {
    const q = new Queue();
    q.push({ row: 0, col: 0, dist: 0, path: [] });

    const visited = Array.from({ length: n }, () => Array(n).fill(false));

    while (!q.empty()) {
      let size = q.size;
      if (cancelToken.current) {
        clearPath();
        return false;
      }
      while (size--) {
        if (cancelToken.current) {
          clearPath();
          return false;
        }
        const node = q.front();
        const { row, col, dist, path } = node;
        grid[row][col] = 3;
        if (row === n - 1 && col === n - 1) {
          // Mark the destination cell as visited
          visited[row][col] = true;

          // Update the grid and trigger a UI update
          setGrid([...grid]);
          await delay((10 - speed) * 50);
          // console.log(path);
          return await traceShortestPath(path, [...grid], dist);
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
            q.push({ row: newRow, col: newCol, dist: dist + 1, path: [...path, i] });
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
    setPopup(null)
    await clearPath()
    cancelToken.current = false; // Reset the cancel token.
    switch (type) {
      case 1:
        if ((await findPathSlow([...grid], 0, 0, 0))) { }
        else if (cancelToken.current) toast.info("Algorithm stopped before completion")
        else toast.error("No Path Found");
        break;
      case 2:
        if ((await findPathMemo([...grid], 0, 0, dpGrid(), 0))) { }
        else if (cancelToken.current) toast.info("Algorithm stopped before completion")
        else toast.error("No Path Found");
        break;
      case 3:
        if ((await bfs([...grid]))) toast.success("Destination Reached");
        else if (cancelToken.current) toast.info("Algorithm stopped before completion")
        else toast.error("No Path Found");
        break;
      case 4:
        if ((await shortestPath([...grid]))) { }
        else if (cancelToken.current) toast.info("Algorithm stopped before completion")
        else toast.error("No Path Found");
        break;
      default: break;
    }
    setProcessing(false)
  }

  const GridControls = () => {
    return <div style={processing || mazeCreation ? { opacity: 0.2 } : { opacity: 1 }} className="flex flex-col gap-[10px] transition flex-grow min-w-[80%] md:min-w-fit md:max-w-1/4" >
      <div className={`rounded-md shadow-md border px-[10px] text-xs md:text-sm py-[5px] w-full`}>
        <div>Grid Size: {n}</div>
        <input
          disabled={processing || mazeCreation}
          type="range" min={1} max={200} step={1} value={n} onChange={(e) => { setN(e.target.value) }} className="outline-none w-full" name="Size" id="" />
      </div>
      <div className="rounded-md shadow-md border p-[10px] flex flex-col gap-[10px]">
        <div className={`rounded-md border px-[10px] text-xs md:text-sm py-[5px] w-full`}>
          <div>Grid Spacing: {gridSpacing}</div>
          <input
            disabled={processing || mazeCreation}
            type="range" min={1} max={10} step={1} value={gridSpacing} onChange={(e) => { setgridSpacing(e.target.value) }} className="outline-none w-full" name="Density" id="" />
        </div>
        <button
          onClick={() => {
            generateGrid()
            setCellSize(30 / n)
            setPopup(null)
          }}
          className={`rounded-md border px-[10px] py-[5px] text-xs md:text-sm`}
          disabled={processing || mazeCreation}
        >Auto-Generate
        </button>

        <div className="text-center">
          OR
        </div>
        <button
          onClick={() => {
            clearGrid()
            setCellSize(30 / n)
            setMazeCreation(true)
            setPopup(null)
          }}
          className={`rounded-md border px-[10px] py-[5px] text-xs md:text-sm`}
          disabled={processing || mazeCreation}
        >Draw Maze Manually
        </button>
      </div>
    </div>
  }

  const AlgoAndSpeedControls = () => {
    return <div style={processing || mazeCreation ? { opacity: 0.2 } : { opacity: 1 }} className="flex flex-col gap-[5px] md:gap-[10px] transition flex-grow min-w-[80%] md:min-w-fit md:max-w-1/4">
      <div className={`rounded-md shadow-md border px-[10px] text-xs md:text-sm py-[5px]`}>
        <div>Speed: {speed}</div>
        <input
          disabled={processing || mazeCreation}
          type="range" min={1} max={10} step={1} value={speed} onChange={(e) => { setSpeed(e.target.value) }} className="outline-none w-full" name="Size" id="" />
      </div>
      <div className="flex flex-col gap-[10px] shadow-md border rounded-md p-[10px]">
        <button onClick={async () => {
          setProcessing(1)
        }} className="rounded-md border px-[10px] py-[5px] text-xs md:text-sm"
          disabled={processing || mazeCreation}
          title="Traverses all possible paths"
        >Backtracking</button>
        <button onClick={async () => {
          setProcessing(2)
        }} className="rounded-md border px-[10px] py-[5px] text-xs md:text-sm"
          disabled={processing || mazeCreation}
          title="Won't enter a blocked path again because of memoization"
        >Memoized Backtracking</button>
        <button onClick={async () => {
          setProcessing(3)
        }} className="rounded-md border px-[10px] py-[5px] text-xs md:text-sm"
          disabled={processing || mazeCreation}
          title="Visually shows BFS with a flood-filling like effect"
        >Breadth First Search</button>
        <button onClick={async () => {
          setProcessing(4)
        }} className="rounded-md border px-[10px] py-[5px] text-xs md:text-sm"
          disabled={processing || mazeCreation}
          title="Using BFS, we find out the shortest path"
        >Shortest Path</button>
      </div>
    </div>
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

useEffect(()=>{
  window.addEventListener("mousedown",()=>{setCellSelection(true)})
  window.addEventListener("mouseup",()=>{setCellSelection(false)})
  window.addEventListener("touchstart",()=>{setCellSelection(true)})
  window.addEventListener("touchend",()=>{setCellSelection(false)})
  return ()=>{
    window.removeEventListener("mousedown",()=>{setCellSelection(true)})
    window.removeEventListener("mouseup",()=>{setCellSelection(false)})
    window.removeEventListener("touchstart",()=>{setCellSelection(true)})
    window.removeEventListener("touchend",()=>{setCellSelection(false)})
  }
},[])

  if (!grid) return <></>
  return (
    <div className="w-[100vw] h-[100vh] flex md:items-center justify-center overflow-x-hidden">
      <ToastContainer autoClose={3500} />
      <div className="flex md:flex-row flex-col items-center w-full md:px-[50px] md:gap-[50px] gap-[15px] p-[20px]">
        {mobileView ?
          <div className="max-w-fit text-sm md:text-base mx-auto">
            <div onClick={() => { setPopup(1) }} className="flex items-center gap-[5px] rounded-md shadow-md px-[10px] mb-[5px] py-[5px]"><AiOutlineControl /> Grid Controls</div>
            <div onClick={() => { setPopup(2) }} className="flex items-center gap-[5px] rounded-md shadow-md px-[10px] py-[5px]"><AiOutlineControl /> Algorithm and Speed Controls</div>
          </div>
          : GridControls()}
        <div className="min-w-fit transition">
          <div className="flex items-center gap-[5px]">
            <button style={!(processing || mazeCreation) ? { opacity: 0 } : { opacity: 1 }} onClick={() => { cancelToken.current = true; setMazeCreation(false) }} className="flex items-center mx-auto gap-[5px] text-sm justify-center hover:text-red-500 transition"><FaStop /> Stop</button>
            {mazeCreation && <button
              style={!(mazeCreation) ? { opacity: 0 } : { opacity: 1 }}
              className="flex items-center mx-auto gap-[5px] text-sm justify-center hover:text-red-500 transition"
              onClick={() => {
                clearGrid()
              }}
            >
              <AiOutlineClear />
              Clear Grid
            </button>}
          </div>
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
                      onMouseEnter={() => {
                        if (mazeCreation&&(cellSelection||mobileView)) {
                          let oldGrid = grid;
                          oldGrid[idx][i] = 0;
                          if(idx === 0 && i === 0) oldGrid[idx][i] = 1;
                          if(idx === n-1 && i === n-1) oldGrid[idx][i] = 1;
                          setGrid([...oldGrid])
                        }
                      }}
                      onTouchStart={() => {
                        if (mazeCreation&&(cellSelection||mobileView)) {
                          let oldGrid = grid;
                          oldGrid[idx][i] = 0;
                          if(idx === 0 && i === 0) oldGrid[idx][i] = 1;
                          if(idx === n-1 && i === n-1) oldGrid[idx][i] = 1;
                          setGrid([...oldGrid])
                        }
                      }}
                      key={`r${idx}c${i}`}
                      id={`r${idx}c${i}`}
                      className={` 
                    ${idx === 0 && i === 0 ? "bg-blue-500" :
                          idx === n - 1 && i === n - 1 ? "bg-red-500" :
                            cell === 0 ? "bg-gray-200" :
                              cell === 1 ? "bg-white" :
                                cell === 2 ? "bg-black" :
                                  cell === 3 && "bg-green-300"
                        }
                        ${mazeCreation && "hover:border border-black"}
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
        {mobileView ? "" : AlgoAndSpeedControls()}
      </div>
      {popup && <div className="bg-[rgba(0,0,0,0.5)] flex justify-center items-center fixed bottom-0 z-20 w-full h-full">
        <div className="flex flex-col w-[85%] items-end gap-[10px] justify-center popup">
          <div className="text-white"><AiFillCloseCircle onClick={() => {
            setPopup(null)
          }} /></div>
          <div className="bg-white w-full rounded-md">
            {
              popup === 1
              &&
              GridControls()
            }
            {
              popup === 2
              &&
              AlgoAndSpeedControls()
            }
          </div>
        </div>
      </div>}
    </div>
  );
}

export default App;