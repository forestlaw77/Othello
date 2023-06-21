import React, { useEffect } from "react";

// ゲームの盤面サイズ
const boardSize = 8; // 4, 6, 8, 10, ...

// 探索の深さ
const minimaxDepth = 3;

// 初期盤面の生成
const initialBoard = Array.from(Array(boardSize), () =>
  Array(boardSize).fill(null)
);
initialBoard[Math.floor(boardSize / 2) - 1][Math.floor(boardSize / 2) - 1] =
  "white";
initialBoard[Math.floor(boardSize / 2) - 1][Math.floor(boardSize / 2)] =
  "black";
initialBoard[Math.floor(boardSize / 2)][Math.floor(boardSize / 2) - 1] =
  "black";
initialBoard[Math.floor(boardSize / 2)][Math.floor(boardSize / 2)] = "white";

/**
 * ゲーム終了時の処理を行います。
 *
 * @param {string[][]} boardState - 現在の盤面の状態
 * @param {Function} calculateWinner - 勝利プレイヤーを計算する関数
 * @param {Function} setBoardState - 盤面の状態を設定する関数
 * @param {Function} setCurrentPlayer - 現在のプレイヤーを設定する関数
 * @param {Function} setIsComputerTurn - コンピュータのターンかどうかを設定する関数
 * @returns {void}
 */
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
  setTimeout(function () {
    setBoardState(initialBoard);
    setCurrentPlayer("black");
    setIsComputerTurn(false);
  }, 100);
};

/**
 * ゲームボードコンポーネント
 * @returns {JSX.Element} ゲームボードの表示要素
 */
const Board = () => {
  const [boardState, setBoardState] = React.useState(initialBoard); // 盤面の初期状態を設定する
  const [blackCount, setBlackCount] = React.useState(2);
  const [whiteCount, setWhiteCount] = React.useState(2);
  const [isComputerTurn, setIsComputerTurn] = React.useState(false);
  const [currentPlayer, setCurrentPlayer] = React.useState("black"); // 先手: 'black', 後手: 'white'

  /**
   * 盤面が全て埋まっているかどうかを判定します。
   *
   * @param {Array.<Array.<string|null>>} board - 盤面の状態を表す2次元配列
   * @returns {boolean} - 盤面が全て埋まっている場合はtrue、そうでない場合はfalse
   */
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

  /**
   * ゲームが終了したかどうかを判定します。
   *
   * @param {Array.<Array.<string|null>>} board - 盤面の状態を表す2次元配列
   * @returns {boolean} - ゲームが終了している場合はtrue、そうでない場合はfalse
   */
  const checkGameOver = (board) => {
    // 石を置ける位置をプレイヤー毎に確認する
    const validMovesBlack = getValidMoves(board, "black");
    const validMovesWhite = getValidMoves(board, "white");

    if (validMovesBlack.length === 0 && validMovesWhite.length === 0) {
      // 両者とも石を置けない場合、ゲームオーバー
      return true;
    }

    if (boardIsFull(board)) {
      // 盤面が一杯になった場合、ゲームオーバー
      return true;
    }

    return false;
  };

  /**
   * 指定されたプレイヤーが置ける有効な手のリストを取得します。
   *
   * @param {Array.<Array.<string|null>>} board - 盤面の状態を表す2次元配列
   * @param {string} player - プレイヤーの識別子 ("black"または"white")
   * @returns {Array.<{row: number, col: number}>} - 有効な手の座標のリスト
   */
  const getValidMoves = (board, player) => {
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

    // {0, 0} から、すべてのセルをチェックする
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] != null) {
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
            currentRow < boardSize &&
            currentCol < boardSize
          ) {
            const cell = board[currentRow][currentCol];

            if (cell === null) {
              // 石の置いていないセルがあれば、その方向には石は置けないので、次の方向に移る
              break;
            } else if (!foundOpponent && cell === player) {
              // 対戦相手の石が見つかる前にプレイヤーの石を見つけたら、その方向には石は置けないので、次の方向に移る
              break;
            } else if (cell !== player) {
              // 対戦相手の石を見つけたら、裏返せるかどうか確認処理するため foundOpponent フラグを建てる
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

  /**
   * 指定された方向において、指定された座標から石をひっくり返します。
   *
   * @param {number} row - 現在の行のインデックス
   * @param {number} col - 現在の列のインデックス
   * @param {number} dRow - 方向ベクトルの行成分
   * @param {number} dCol - 方向ベクトルの列成分
   * @param {string} player - プレイヤーの識別子 ("black"または"white")
   * @param {Array.<Array.<string|null>>} board - 盤面の状態を表す2次元配列
   */
  const flipStonesInDirection = (row, col, dRow, dCol, player, board) => {
    const opponent = player === "black" ? "white" : "black";
    const stonesToFlip = [];
    let currentRow = row + dRow;
    let currentCol = col + dCol;

    while (
      currentRow >= 0 &&
      currentRow < boardSize &&
      currentCol >= 0 &&
      currentCol < boardSize
    ) {
      if (board[currentRow][currentCol] === null) {
        break; // マス目が空の場合はひっくり返せないため、ループを終了
      }
      if (board[currentRow][currentCol] === player) {
        // 自分の石にぶつかった場合、ひっくり返す処理を行う
        stonesToFlip.forEach((stone) => {
          board[stone.row][stone.col] = player;
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

  /**
   * マス目がクリックされた時の処理を行います。
   *
   * @param {number} rowIndex - クリックされたマス目の行インデックス
   * @param {number} colIndex - クリックされたマス目の列インデックス
   */
  const handleCellClick = (rowIndex, colIndex) => {
    // マス目がクリックされた時の処理
    // rowIndex: クリックされたマス目の行インデックス
    // colIndex: クリックされたマス目の列インデックス

    // クリックされたマス目に石が置けるかどうかの判定
    const isValidMove = checkValidMove(rowIndex, colIndex);

    if (isValidMove) {
      // 石を置く処理を実行
      const newBoard = makeMove(boardState, rowIndex, colIndex, currentPlayer);
      setBoardState(newBoard);
      // プレーヤーの手番を切り替える
      setIsComputerTurn(true);
      setCurrentPlayer(currentPlayer === "black" ? "white" : "black");
    } else {
      // 石を置けない場合の処理
      // 例えば、エラーメッセージを表示するなど
      console.log("Invalid move");
    }
  };

  /**
   * 盤面の状態から勝利プレイヤーを計算します。
   *
   * @param {Array<Array<string|null>>} board - 盤面の状態を表す2次元配列
   * @returns {string|null} 勝利プレイヤーを示す文字列 ("black"、"white") または引き分けの場合は null
   */
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

  /**
   * 盤面上の指定されたプレイヤーの石の数を計算します。
   *
   * @param {Array<Array<string|null>>} board - 盤面の状態を表す2次元配列
   * @param {string} player - プレイヤーを示す文字列 ("black"、"white")
   * @returns {number} 指定されたプレイヤーの石の数
   */
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

  /**
   * 指定された位置に石を置けるかどうかを判定します。
   *
   * @param {number} rowIndex - クリックされたマス目の行インデックス
   * @param {number} colIndex - クリックされたマス目の列インデックス
   * @returns {boolean} 石を置ける場合はtrue、置けない場合はfalse
   */
  const checkValidMove = (rowIndex, colIndex) => {
    // 石を置ける場所の取得
    const validMoves = getValidMoves(boardState, currentPlayer);

    // rowIndex, colIndexの位置が石を置ける場所に含まれているかどうかを判定
    return validMoves.some(
      (move) => move.row === rowIndex && move.col === colIndex
    );
  };

  /**
   * 盤面のセルを表すコンポーネントです。
   *
   * @param {Object} props - コンポーネントのプロパティ
   * @param {string} props.cellState - セルの状態を示す文字列 ("black"、"white")
   * @param {number} props.rowIndex - セルの行インデックス
   * @param {number} props.colIndex - セルの列インデックス
   * @param {boolean} props.isValidMove - セルが有効な移動先かどうかを示すフラグ
   * @returns {JSX.Element} BoardCellコンポーネントのレンダリング結果
   */
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

  /**
   * 指定された位置にプレイヤーの石を配置した後、盤面を更新します。
   *
   * @param {Array<Array<string|null>>} board - 盤面の状態を表す2次元配列
   * @param {number} row - 石を配置するマス目の行インデックス
   * @param {number} col - 石を配置するマス目の列インデックス
   * @param {string} player - プレイヤーを示す文字列 ("black"、"white")
   * @returns {Array<Array<string|null>>} 更新された盤面の状態を表す2次元配列
   */
  const makeMove = (board, row, col, player) => {
    // 盤面のコピーを作成
    const newBoard = [...board.map((row) => [...row])];

    // 新しい石を配置
    newBoard[row][col] = player;

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
      flipStonesInDirection(row, col, dRow, dCol, player, newBoard);
    });

    return newBoard;
  };

  /**
   * ミニマックス法とα-β刈りを使用して、最適な手を選択するロジックです。
   *
   * @param {Array<Array<string|null>>} board - 盤面の状態を表す2次元配列
   * @param {string} player - 現在のプレイヤーを示す文字列 ("black"、"white")
   * @returns {{ row: number, col: number }|null} 最適な手を表すオブジェクト ({ row: number, col: number })、またはnull（手が見つからない場合）
   */
  const findBestMove = (board, player) => {
    // 最適な手を探索するため、仮想盤面を現盤面から作成する
    const tempBoard = [...board.map((row) => [...row])];

    let bestMove = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    const availableMoves = getValidMoves(tempBoard, player); // player のすべての手を列挙する（配置可能な場所を得る）

    for (let i = 0; i < availableMoves.length; i++) {
      const move = availableMoves[i]; // i番目の手を選択する
      const newBoard = makeMove(tempBoard, move.row, move.col, player); // player の石を置く
      const score = minimax(
        newBoard,
        player === "black" ? "white" : "black",
        minimaxDepth,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        false
      );

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  };

  /**
   * ミニマックス法によって最適な手を選択します。
   *
   * @param {Array<Array<string|null>>} board - 盤面の状態を表す2次元配列
   * @param {number} depth - 探索の深さ
   * @param {number} alpha - アルファ値
   * @param {number} beta - ベータ値
   * @param {boolean} maximizingPlayer - 最大化プレイヤーかどうかを示すフラグ
   * @returns {number} 評価値
   */
  const minimax = (board, player, depth, alpha, beta, maximizingPlayer) => {
    if (depth === 0 || checkGameOver(board)) {
      // 検索の深さに達した、またはゲームオーバー
      return evaluate(board); // 葉の評価値を返す
    }

    if (maximizingPlayer) {
      // 最大化プレイヤーの場合
      let maxEval = Number.NEGATIVE_INFINITY;
      const availableMoves = getValidMoves(board, player); // すべての手を列挙する（配置可能な場所を得る）

      // 全ての可能な手に対して評価値を計算し、最大評価値を選択する
      for (let i = 0; i < availableMoves.length; i++) {
        const move = availableMoves[i]; // i 番目の手を選択する
        const newBoard = makeMove(board, move.row, move.col, player); // 石を置く
        const evalResult = minimax(
          newBoard,
          player === "black" ? "white" : "black",
          depth - 1,
          alpha,
          beta,
          false
        ); // 石を置いたあとの相手の局面
        maxEval = Math.max(maxEval, evalResult);
        alpha = Math.max(alpha, evalResult);

        // アルファベータプルーニングの処理
        if (beta <= alpha) {
          break;
        }
      }

      return maxEval;
    } else {
      // 最小化プレイヤーの場合
      let minEval = Number.POSITIVE_INFINITY;
      const availableMoves = getValidMoves(board, player); // すべての手を列挙する（配置可能な場所を得る）

      // 全ての可能な手に対して評価値を計算し、最小評価値を選択する
      for (let i = 0; i < availableMoves.length; i++) {
        const move = availableMoves[i]; // i 番目の手を選択する
        const newBoard = makeMove(board, move.row, move.col, player); // 石を置く
        const evalResult = minimax(
          newBoard,
          player === "black" ? "white" : "black",
          depth - 1,
          alpha,
          beta,
          true
        ); // 石を置いたあとの相手の局面
        minEval = Math.min(minEval, evalResult);
        beta = Math.min(beta, evalResult);

        // アルファベータプルーニングの処理
        if (beta <= alpha) {
          break;
        }
      }

      return minEval;
    }
  };

  /**
   * 盤面の評価値を計算します。
   *
   * @param {Array<Array<string|null>>} board - 盤面の状態を表す2次元配列
   * @returns {number} 盤面の評価値
   */
  const evaluate = (board) => {
    // プレイヤーごとの重み付け係数
    const weights = {
      black: -1,
      white: 1,
    };

    // 各セルの価値を格納する配列
    const cellValues = [
      [30, -12, 0, -1, -1, 0, -12, 30],
      [-12, -15, -3, -3, -3, -3, -15, -12],
      [0, -3, 0, -1, -1, 0, -3, 0],
      [-1, -3, -1, -1, -1, -1, -3, -1],
      [-1, -3, -1, -1, -1, -1, -3, -1],
      [0, -3, 0, -1, -1, 0, -3, 0],
      [-12, -15, -3, -3, -3, -3, -15, -12],
      [30, -12, 0, -1, -1, 0, -12, 30],
    ];

    let score = 0;

    // 盤面を走査して各セルの価値を評価に加算
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === "black") {
          score += cellValues[row][col] * weights.black;
        } else if (board[row][col] === "white") {
          score += cellValues[row][col] * weights.white;
        }
      }
    }

    return score;
  };

  /**
   * ゲームの進行状況を監視し、コンピュータの手番やゲーム終了時の処理を実行します。
   */
  useEffect(() => {
    if (isComputerTurn) {
      // コンピュータの手番の処理を実行する
      const move = findBestMove(boardState, currentPlayer);
      if (move !== null) {
        const newBoard = makeMove(
          boardState,
          move.row,
          move.col,
          currentPlayer
        );
        setBoardState(newBoard);
      }
      setIsComputerTurn(false);
      setCurrentPlayer(currentPlayer === "black" ? "white" : "black");
    } else {
      const userValidMoves = getValidMoves(boardState, currentPlayer);
      const computerValidMoves = getValidMoves(
        boardState,
        currentPlayer === "black" ? "white" : "black"
      );
      if (userValidMoves.length === 0 && computerValidMoves.length !== 0) {
        setIsComputerTurn(true);
        setCurrentPlayer(currentPlayer === "black" ? "white" : "black");
      }
    }
  }, [isComputerTurn]);

  /**
   * 盤面の状態を監視し、各プレイヤーの石の数を更新し、ゲーム終了時の処理を実行します。
   */
  useEffect(() => {
    const blackStones = countStones(boardState, "black");
    const whiteStones = countStones(boardState, "white");
    setBlackCount(blackStones);
    setWhiteCount(whiteStones);
    const gameOver = checkGameOver(boardState);
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
      }, 100);
    }
  }, [boardState]);

  /**
   * マス目のインデックスを表示する関数
   * @returns {JSX.Element} インデックスの表示要素
   */
  const renderIndices = () => {
    const validMoves = getValidMoves(boardState, currentPlayer);
    const columnIndices = Array.from({ length: boardState[0].length }, (_, i) =>
      String.fromCharCode(97 + i)
    );

    return (
      <div className="board-indices">
        {/* 列のインデックスを表示 */}
        <div className="board-row">
          <div className="corner-index-cell"></div>
          {boardState[0].map((cell, colIndex) => (
            <div key={colIndex} className="col-index-cell">
              {columnIndices[colIndex]}
            </div>
          ))}
        </div>
        {/* 行のインデックスとゲームボードを表示 */}
        {boardState.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {/* 行のインデックスを表示 */}
            <div className="row-index-cell">{rowIndex + 1}</div>
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
