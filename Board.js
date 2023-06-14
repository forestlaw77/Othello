import React, { useEffect } from "react";

// ゲームの盤面サイズ
const boardSize = 8;

// 初期盤面の生成
const initialBoard = Array.from(Array(boardSize), () =>
  Array(boardSize).fill(null)
);
initialBoard[3][3] = "white";
initialBoard[3][4] = "black";
initialBoard[4][3] = "black";
initialBoard[4][4] = "white";

const handleGameOver = (
  boardState,
  calculateWinner,
  setBoardState,
  setCurrentPlayer,
  setIsComputerTurn
) => {
  // 勝利プレイヤーの取得
  const winner = calculateWinner(boardState); // 勝利判定のロジックに基づいて勝利プレイヤーを取得する関数を呼び出す

  // 結果を表示する
  if (winner) {
    alert(`勝利プレイヤー: ${winner}`);
  } else {
    alert("引き分け");
  }
  setBoardState(initialBoard);
  setCurrentPlayer("black");
  setIsComputerTurn(false);
};

const Board = () => {
  const [boardState, setBoardState] = React.useState(initialBoard); // 盤面の初期状態を設定する
  const [blackCount, setBlackCount] = React.useState(2);
  const [whiteCount, setWhiteCount] = React.useState(2);
  const [isComputerTurn, setIsComputerTurn] = React.useState(false);
  const [currentPlayer, setCurrentPlayer] = React.useState("black"); // 先手: 'black', 後手: 'white'

  const boardIsFull = (board) => {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] === null) {
          return false; // 空のセルが存在する場合は盤面が埋まっていない
        }
      }
    }
    return true; // 盤面が全て埋まっている
  };

  const checkGameOver = () => {
    // 石を置ける位置をプレイヤー毎に確認する
    const validMovesBlack = getValidMoves("black");
    const validMovesWhite = getValidMoves("white");

    if (validMovesBlack.length === 0 && validMovesWhite.length === 0) {
      // 両者とも石を置けない場合、ゲームオーバー
      return true;
    }

    if (boardIsFull(boardState)) {
      // 盤面が一杯になった場合、ゲームオーバー
      return true;
    }

    return false;
  };

  const isCorner = (rowIndex, colIndex) => {
    const numRows = boardState.length; // 盤面の行数
    const numCols = boardState[0].length; // 盤面の列数

    // 盤面の四隅の位置をチェックする
    const corners = [
      [0, 0], // 左上の角
      [0, numCols - 1], // 右上の角
      [numRows - 1, 0], // 左下の角
      [numRows - 1, numCols - 1], // 右下の角
    ];

    // 指定されたセルの位置が角であるかを判定する
    return corners.some(([cornerRow, cornerCol]) => {
      return rowIndex === cornerRow && colIndex === cornerCol;
    });
  };

  const isAdjacentToCorner = (rowIndex, colIndex) => {
    const numRows = 8; // 盤面の行数
    const numCols = 8; // 盤面の列数

    // 盤面の隅に隣接する位置をチェックする
    const adjacentPositions = [
      [0, 1], // 左上の隣接位置
      [1, 0], // 左上の隣接位置
      [0, numCols - 2], // 右上の隣接位置
      [1, numCols - 1], // 右上の隣接位置
      [numRows - 2, 0], // 左下の隣接位置
      [numRows - 1, 1], // 左下の隣接位置
      [numRows - 2, numCols - 1], // 右下の隣接位置
      [numRows - 1, numCols - 2], // 右下の隣接位置
    ];

    // 指定されたセルの位置が角に隣接しているかを判定する
    return adjacentPositions.some(([adjacentRow, adjacentCol]) => {
      return rowIndex === adjacentRow && colIndex === adjacentCol;
    });
  };

  const makeComputerMove = () => {
    // 石が置ける位置を取得する
    const validMoves = getValidMoves(currentPlayer);

    // 1. 角に置ける場所があれば、角に置く
    const cornerMoves = validMoves.filter((move) =>
      isCorner(move.row, move.col)
    );
    if (cornerMoves.length > 0) {
      const randomMove =
        cornerMoves[Math.floor(Math.random() * cornerMoves.length)];
      placeStone(randomMove.row, randomMove.col);
      return;
    }

    // 2. 角に隣接する場所にはできるだけ置かないようにする
    const nonAdjacentMoves = validMoves.filter(
      (move) => !isAdjacentToCorner(move.row, move.col)
    );
    if (nonAdjacentMoves.length > 0) {
      const randomMove =
        nonAdjacentMoves[Math.floor(Math.random() * nonAdjacentMoves.length)];
      placeStone(randomMove.row, randomMove.col);
      return;
    }

    // 3. ランダムに石を置く
    if (validMoves.length > 0) {
      const randomMove =
        validMoves[Math.floor(Math.random() * validMoves.length)];
      placeStone(randomMove.row, randomMove.col);
    }
  };

  const getValidMoves = (player) => {
    const validMoves = [];

    const directions = [
      { row: -1, col: -1 }, // 左上
      { row: -1, col: 0 }, // 上
      { row: -1, col: 1 }, // 右上
      { row: 0, col: -1 }, // 左
      { row: 0, col: 1 }, // 右
      { row: 1, col: -1 }, // 左下
      { row: 1, col: 0 }, // 下
      { row: 1, col: 1 }, // 右下
    ];

    const numRows = boardState.length;
    const numCols = boardState[0].length;

    // {0, 0} から、すべてのセルをチェックする
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (boardState[row][col] != null) {
          // 既に石が置いてあったら、そこには石は置けないのでスキップする
          continue;
        }
        for (let direction of directions) {
          // 周辺８方向の石を確認する
          const { row: dirRow, col: dirCol } = direction;
          let currentRow = row + dirRow;
          let currentCol = col + dirCol;
          let foundOpponent = false;
          let validMove = false;

          while (
            // 盤面外に出たら終了
            currentRow >= 0 &&
            currentCol >= 0 &&
            currentRow < numRows &&
            currentCol < numCols
          ) {
            const cell = boardState[currentRow][currentCol];

            if (cell === null) {
              // 石の置いていないセルがあれば、その方向には石は置けないので、次の方向に移る
              break;
            } else if (!foundOpponent && cell === player) {
              // 対戦相手の石が見つかる前にプレイヤーの石を見つけたら、その方向には石は置けないので、次の方向に移る
              break;
            } else if (cell !== player) {
              // 対戦相手の石を見つけたら、裏返せるかどうか確認処理するため foundOpponet フラグを建てる
              // 挟める石があるかどうかチェックが必要なので、breakしない
              foundOpponent = true;
            } else if (foundOpponent) {
              // 対戦相手の石が見つかっている状態で、プレイヤーの石が見つかったので、validMove フラグを建てる
              validMove = true;
              break;
            }
            currentRow += dirRow;
            currentCol += dirCol;
          }
          if (validMove) {
            // 置けることが分かったので、位置を記録して、次のセルについて確認する
            validMoves.push({ row, col });
            break;
          }
        }
      }
    }
    return validMoves;
  };

  const flipStonesInDirection = (
    row,
    col,
    dRow,
    dCol,
    currentPlayer,
    board
  ) => {
    const opponent = currentPlayer === "black" ? "white" : "black";
    const stonesToFlip = [];
    let currentRow = row + dRow;
    let currentCol = col + dCol;

    while (
      currentRow >= 0 &&
      currentRow < 8 &&
      currentCol >= 0 &&
      currentCol < 8
    ) {
      if (board[currentRow][currentCol] === null) {
        break; // マス目が空の場合はひっくり返せないため、ループを終了
      }
      if (board[currentRow][currentCol] === currentPlayer) {
        // 自分の石にぶつかった場合、ひっくり返す処理を行う
        stonesToFlip.forEach((stone) => {
          board[stone.row][stone.col] = currentPlayer;
        });
        break;
      }
      if (board[currentRow][currentCol] === opponent) {
        // 相手の石にぶつかった場合、ひっくり返す対象として記録しておく
        stonesToFlip.push({ row: currentRow, col: currentCol });
      }
      currentRow += dRow;
      currentCol += dCol;
    }
  };

  const placeStone = (rowIndex, colIndex) => {
    // 盤面の状態を取得
    const board = [...boardState];

    // 現在のプレイヤーの石をクリック位置に置く
    board[rowIndex][colIndex] = currentPlayer;

    // 上下左右および斜めの方向に対してひっくり返す処理を行う
    const directions = [
      [-1, 0], // 上
      [1, 0], // 下
      [0, -1], // 左
      [0, 1], // 右
      [-1, -1], // 左上
      [-1, 1], // 右上
      [1, -1], // 左下
      [1, 1], // 右下
    ];

    directions.forEach(([dRow, dCol]) => {
      flipStonesInDirection(
        rowIndex,
        colIndex,
        dRow,
        dCol,
        currentPlayer,
        board
      );
    });

    // 盤面の状態を更新
    setBoardState(board);
  };

  const handleCellClick = (rowIndex, colIndex) => {
    // マス目がクリックされた時の処理
    // rowIndex: クリックされたマス目の行インデックス
    // colIndex: クリックされたマス目の列インデックス

    // クリックされたマス目に石が置けるかどうかの判定
    const isValidMove = checkValidMove(rowIndex, colIndex);

    if (isValidMove) {
      // 石を置く処理を実行
      placeStone(rowIndex, colIndex);
      // プレーヤーの手番を切り替える
      setIsComputerTurn(true);
      setCurrentPlayer(currentPlayer === "black" ? "white" : "black");
    } else {
      // 石を置けない場合の処理
      // 例えば、エラーメッセージを表示するなど
      console.log("Invalid move");
    }
  };

  const calculateWinner = (board) => {
    const blackCount = board.flat().filter((cell) => cell === "black").length;
    const whiteCount = board.flat().filter((cell) => cell === "white").length;

    if (blackCount > whiteCount) {
      return "black"; // 黒が勝利
    } else if (blackCount < whiteCount) {
      return "white"; // 白が勝利
    } else {
      return null; // 引き分け
    }
  };

  // 石の数を計算する関数
  const countStones = (board, player) => {
    let count = 0;
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] === player) {
          count++;
        }
      }
    }
    return count;
  };
  const checkValidMove = (rowIndex, colIndex) => {
    // 石を置ける場所の取得
    const validMoves = getValidMoves(currentPlayer);

    // rowIndex, colIndexの位置が石を置ける場所に含まれているかどうかを判定
    return validMoves.some(
      (move) => move.row === rowIndex && move.col === colIndex
    );
  };

  const BoardCell = ({ cellState, rowIndex, colIndex, isValidMove }) => {
    const cellClass = isValidMove ? "valid-move" : "board-cell";
    return (
      <div
        className={cellClass}
        onClick={() => handleCellClick(rowIndex, colIndex)}
      >
        {cellState === "black" && <div className="black-stone" />}
        {cellState === "white" && <div className="white-stone" />}
      </div>
    );
  };

  useEffect(() => {
    if (isComputerTurn) {
      // コンピュータの手番の処理を実行する
      makeComputerMove();
      setIsComputerTurn(false);
      setCurrentPlayer(currentPlayer === "black" ? "white" : "black");
    } else {
      const userValidMoves = getValidMoves(currentPlayer);
      const computerValidMoves = getValidMoves(
        currentPlayer === "black" ? "white" : "black"
      );
      if (userValidMoves.length === 0 && computerValidMoves.length !== 0) {
        setIsComputerTurn(true);
        setCurrentPlayer(currentPlayer === "black" ? "white" : "black");
      }
    }
  }, [isComputerTurn]);

  useEffect(() => {
    const blackStones = countStones(boardState, "black");
    const whiteStones = countStones(boardState, "white");
    setBlackCount(blackStones);
    setWhiteCount(whiteStones);
    const gameOver = checkGameOver();
    if (gameOver) {
      // ゲームオーバーの処理を実行する
      setTimeout(() => {
        handleGameOver(
          boardState,
          calculateWinner,
          setBoardState,
          setCurrentPlayer,
          setIsComputerTurn
        );
      }, 10);
    }
  }, [boardState]);

  const renderIndices = () => {
    const validMoves = getValidMoves(currentPlayer);
    return (
      <div className="board-indices">
        {/* Render column indices */}
        <div className="board-row">
          <div className="corner-index-cell"></div>
          {boardState[0].map((cell, colIndex) => (
            <div key={colIndex} className="col-index-cell">
              {colIndex}
            </div>
          ))}
        </div>
        {/* 行のインデックスとゲームボードを表示 */}
        {boardState.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {/* 行のインデックスを表示 */}
            <div className="row-index-cell">{rowIndex}</div>
            {/* ゲームボードのセルを表示 */}
            {row.map((cell, colIndex) => {
              const isValidMove = validMoves.some(
                (move) => move.row === rowIndex && move.col === colIndex
              );
              return (
                <BoardCell
                  key={colIndex}
                  cellState={cell}
                  rowIndex={rowIndex}
                  colIndex={colIndex}
                  isValidMove={isValidMove}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="game-board">
      <div className="board-container">
        <div className="board">{renderIndices()}</div>
      </div>
      <div className="score-container">
        {/* 石の数の表示部分 */}
        <div>Black Stones: {blackCount}</div>
        <div>White Stones: {whiteCount}</div>
      </div>
    </div>
  );
};

export default Board;
