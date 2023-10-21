import { useEffect, useState } from "react";
import { FaCircle, FaRegCircle } from "react-icons/fa";

// TODO: move to /types.ts
type Coordinate = [number, number];
type Ship = {
  id: number;
  type: string;
  coordinates: Coordinate[];
  hits: boolean[];
  sunk: boolean;
};
type CellState = {
  hit: boolean;
  coordinates: Coordinate;
  ship_id: number | null;
};

// TODO: move to /constants.ts
const BOARD_SIZE = 10;
const SHIP_TYPES = {
  CARRIER: "carrier",
  BATTLESHIP: "battleship",
  CRUISER: "cruiser",
  SUBMARINE: "submarine",
  DESTROYER: "destroyer",
};
const DEFAULT_SHIPS = [
  {
    id: 1,
    type: SHIP_TYPES.CARRIER,
    coordinates: [
      [2, 9],
      [3, 9],
      [4, 9],
      [5, 9],
      [6, 9],
    ],
  },
  {
    id: 2,
    type: SHIP_TYPES.BATTLESHIP,
    coordinates: [
      [5, 2],
      [5, 3],
      [5, 4],
      [5, 5],
    ],
  },
  {
    id: 3,
    type: SHIP_TYPES.CRUISER,
    coordinates: [
      [8, 1],
      [8, 2],
      [8, 3],
    ],
  },
  {
    id: 4,
    type: SHIP_TYPES.SUBMARINE,
    coordinates: [
      [3, 0],
      [3, 1],
      [3, 2],
    ],
  },
  {
    id: 6,
    type: SHIP_TYPES.DESTROYER,
    coordinates: [
      [0, 0],
      [1, 0],
    ],
  },
];

// TODO: move to /utils.ts
const createNewShipState = () => DEFAULT_SHIPS.reduce((acc, ship) => {
  return {
    ...acc,
    [ship.id]: {
      ...ship,
      hits: Array.from({ length: ship.coordinates.length }, () => false),
      sunk: false,
    },
  };
}, {})

const createNewBoardState =  () => Array.from({ length: BOARD_SIZE }).map((_row, x) => {
  return Array.from({ length: BOARD_SIZE }).map((_col, y) => {
    const cellState: CellState = {
      hit: false,
      coordinates: [x, y],
      ship_id: null,
    };
    return cellState;
  });
})

export default function App() {
  const [shipState, setShipState] = useState<Record<number, Ship>>(createNewShipState());

  const [boardState, setBoardState] = useState(() => createNewBoardState());

  const [actionLog, setActionLog] = useState<string[]>([]);

  // place ships on the game board
  useEffect(() => {
    // TODO: move to inital state definition of board state to avoid this needless effect
    setBoardState((boardState) => {
      const newBoardState = [
        ...boardState.map((rowColumns) => [...rowColumns]),
      ];

      Object.values(shipState).forEach((ship) => {
        ship.coordinates.forEach((coordinate) => {
          const x = coordinate[0];
          const y = coordinate[1];
          newBoardState[x][y] = {
            ...boardState[x][y],
            ship_id: ship.id,
          };
        });
      });

      return newBoardState;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // HELPER METHODS

  const updateCellState = (cellState: CellState) => {
    setBoardState((boardState) => {
      const newBoardState = [
        ...boardState.map((rowColumns) => [...rowColumns]),
      ];
      const x = cellState.coordinates[0];
      const y = cellState.coordinates[1];
      newBoardState[x][y] = cellState;
      return newBoardState;
    });
  };

  const updateShipState = (ship: Ship) => {
    setShipState((shipState) => {
      return {
        ...shipState,
        [ship.id]: ship,
      };
    });
  };

  
  const recordAction = (action: string) => {
    setActionLog((actionLog) => {
      return [...actionLog, action];
    });
  };

  // EVENT HANDLERS

  const fireShot = (cellState: CellState) => {
    const x = cellState.coordinates[0];
    const y = cellState.coordinates[1];
    //if  already fired at this cell, skip
    if (cellState.hit) return;

    // missed shot, update cell state
    if (!cellState.ship_id) {
      updateCellState({ ...cellState, hit: true });
      recordAction(`[${x},${y}]: miss`);
      return;
    }
    // hit shot, update ship and cell state
    const ship = shipState[cellState.ship_id];
    const hits = [...ship.hits].map((hit, index) => {
      const isHitCordinate =
        ship.coordinates[index][0] === x && ship.coordinates[index][1] === y;
      return isHitCordinate ? true : hit;
    });
    const sunk = hits.every((hit) => hit);
    updateShipState({ ...ship, hits, sunk });
    updateCellState({ ...cellState, hit: true });
    recordAction(`[${x},${y}]: ${sunk ? "sunk ship!" : "hit"}`);
  };

  const resetGame = () => {
    setShipState(createNewShipState());
    setBoardState(createNewBoardState());
    setActionLog([]);
  };

  const showGameOver = Object.values(shipState).every((ship) => ship.sunk);

  return (
    <div className="container mx-auto my-8">
      {showGameOver && (
        <div className="flex justify-center mb-4">
          <button className="rounded bg-black p-2 text-lg text-white" onClick={resetGame}>Game Over! Try Again?</button>
        </div>
      )}
      <div className="flex flex-col md:flex-row flex-nowrap gap-4">
        <div className="md:flex-grow flex flex-col items-center">
          {boardState.map((row, x) => {
            return (
              <div key={x} className="flex flex-row">
                {row.map((cellState, y) => {
                  return (
                    <Cell
                      key={y}
                      cellState={cellState}
                      shipState={
                        cellState.ship_id ? shipState[cellState.ship_id] : null
                      }
                      onClick={fireShot}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="md:flex-shrink flex-col gap-2">
          {actionLog.map((action, index) => {
            return (
              <div key={index} className="text-gray-500">
                {action}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// TODO: Move to own file
type CellProps = {
  cellState: CellState;
  shipState: Ship | null;
  onClick: (cellState: CellState) => void;
};

function Cell({ cellState, shipState, onClick }: CellProps) {
  const themeStyles = !cellState.hit
    ? "text-gray-100 hover:text-gray-600"
    : shipState
    ? shipState.sunk
      ? "text-red-600"
      : "text-orange-400"
    : "text-gray-500";
  return (
    <button
      className={`w-6 h-6 sm:w-8 sm:h-8 inline-flex justify-center items-center transition-colors ${themeStyles}`}
      onClick={() => onClick(cellState)}
      disabled={cellState.hit}
    >
      {!cellState.hit ? <FaRegCircle /> : <FaCircle />}
    </button>
  );
}
