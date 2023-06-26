import React, { useEffect } from "react";

/**
 * デフォルトの盤面状態を取得します。
 *
 * @param {number} size - 盤面のサイズ
 * @returns {Array<Array<string|null>>} 盤面の初期状態を表す2次元配列
 */
const getDefaultBoardState = (size) => {
  const board = Array.from(Array(size), () => Array(size).fill(null));
  const center = Math.floor(size / 2);

  board[center - 1][center - 1] = "white";
  board[center - 1][center] = "black";
  board[center][center - 1] = "black";
  board[center][center] = "white";

  return board;
};

/**
 * デフォルトのセルの評価値配列を保持するオブジェクト
 * @type {Object<number, number[][]>} サイズをキーとした評価値配列のマップ
 */
const defaultCellValues = {
  8: [
    [30, -12, 0, -1, -1, 0, -12, 30],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [30, -12, 0, -1, -1, 0, -12, 30],
  ],
};

/**
 * ボードのサイズに応じたデフォルトのセルの評価値配列を生成する関数
 * @param {number} size - ボードのサイズ
 * @returns {number[][]} サイズに応じたデフォルトのセルの評価値配列
 */
const getDefaultCellValues = (size) => {
  if (defaultCellValues.hasOwnProperty(size)) {
    return defaultCellValues[size];
  }

  const defaultValues = [];

  for (let row = 0; row < size; row++) {
    const rowValues = [];
    for (let col = 0; col < size; col++) {
      const center = Math.floor(size / 2);
      const distance = Math.max(Math.abs(row - center), Math.abs(col - center));
      const value = size - distance;
      rowValues.push(value);
    }
    defaultValues.push(rowValues);
  }

  return defaultValues;
};

/**
 * ゲームボードコンポーネント
 * @returns {JSX.Element} ゲームボードの表示要素
 */
const Board = () => {
  const minimaxDepth = 3; // 探索の深さ
  const [boardSize, setBoardSize] = React.useState(8); // ゲームの盤面サイズ
  const [boardState, setBoardState] = React.useState(
    getDefaultBoardState(boardSize)
  ); // 盤面の初期状態を設定する
  const [blackCount, setBlackCount] = React.useState(2);
  const [whiteCount, setWhiteCount] = React.useState(2);
  const [cellValues, setCellValues] = React.useState(
    getDefaultCellValues(boardSize)
  ); // セルの評価値配列
  const [isComputerTurn, setIsComputerTurn] = React.useState(false);
  const [currentPlayer, setCurrentPlayer] = React.useState("black"); // 先手: 'black', 後手: 'white'
  const [moves, setMoves] = React.useState([]); // 手の配列
  const [gamePhase, setGamePhase] = React.useState("early");

  // boardSizeを変更する関数
  const changeBoardSize = (size) => {
    setBoardSize(size);
  };

  /**
   * ボードサイズが変更されたときに実行される副作用のコールバック関数です。
   */
  useEffect(() => {
    const newCellValues = getDefaultCellValues(boardSize);
    setCellValues(newCellValues);

    const initialBoard = getDefaultBoardState(boardSize);
    setBoardState(initialBoard);
  }, [boardSize]);

  const determineGamePhase = (moves, blackCount, whiteCount, boardSize) => {
    const earlyGameMoves = 10; // 序盤とみなす最小の手数
    const earlyGamePieceRatio = 0.4; // 序盤とみなす最小の駒の割合
    const midGameMoves = 54; // 中盤とみなす手数
    const midGamePieceRatio = 0.9; // 中盤とみなす駒の割合

    const totalMoves = moves.length; // 現在の手数
    const totalPieces = blackCount + whiteCount; // 現在の駒の総数
    const pieceRatio = totalPieces / (boardSize * boardSize); // 駒の割合

    if (boardSize < 8) {
      return "end";
    } else if (
      totalMoves < earlyGameMoves ||
      pieceRatio < earlyGamePieceRatio
    ) {
      return "early"; // 手数が少ないか駒の割合が少ない場合は序盤
    } else if (totalMoves < midGameMoves || pieceRatio < midGamePieceRatio) {
      return "mid"; // 手数が一定以上か駒の割合が一定以上の場合は中盤
    } else {
      return "end";
    }
  };

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
      setBoardState(getDefaultBoardState(boardSize));
      setCurrentPlayer("black");
      setIsComputerTurn(false);
      setMoves([]);
    }, 100);
  };

  /**
   * ユーザーの手を記録する関数
   * @param {number} row - 行のインデックス
   * @param {number} col - 列のインデックス
   * @returns {void}
   */
  const recordGame = (row, col) => {
    const newMove = { row, col };
    setMoves((prevMoves) => [...prevMoves, newMove]);
  };

  /**
   * 手の履歴を表示する関数
   * @returns {JSX.Element[]} 手の履歴の要素の配列
   */
  const renderMoveHistory = () => {
    const columnIndices = Array.from({ length: boardState[0].length }, (_, i) =>
      String.fromCharCode(97 + i)
    );
    return moves.map((move, index) => (
      <div key={index}>
        Move {index + 1}: Row {move.row + 1}, Col {columnIndices[move.col]}
      </div>
    ));
  };

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
      recordGame(rowIndex, colIndex);
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
   * 反復深化法により、時間があればより深く調べます。
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
    const timeLimit = Date.now() + 300;

    const availableMoves = getValidMoves(tempBoard, player); // player のすべての手を列挙する（配置可能な場所を得る）

    for (
      let depth = minimaxDepth;
      Date.now() < timeLimit && depth < 60;
      depth++
    ) {
      for (let i = 0; i < availableMoves.length; i++) {
        const move = availableMoves[i]; // i番目の手を選択する
        const newBoard = makeMove(tempBoard, move.row, move.col, player); // player の石を置く

        // 全滅チェック
        if (isSelfDefeatingMove(newBoard, player, move)) {
          // 全滅になる手は避ける
          continue;
        }

        // 相手局面の評価
        const opponent = player === "black" ? "white" : "black";
        const score = minimax(
          newBoard,
          opponent,
          depth,
          Number.NEGATIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          false
        );

        // 相手プレイヤーの手での最悪スコアを選択
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return bestMove;
  };

  /**
   * ミニマックス法によって最適な手を選択します。
   *
   * n-1手目 = max(n手目A, n手目B, ...)
   * n-2手目 = min(n-1手目A, n-1手目B, ...)
   * n-3手目 = max(n-2手目A, n-2手目B, ...)
   *
   * 自分の手番ではスコアが最も高い手を選び、相手の手番ではスコアが最も低い手 (相手にとって最も高い手) を選びます。
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
      return evaluate(board, player); // 葉の評価値を返す
    }

    if (maximizingPlayer) {
      // 最大化プレイヤーの場合
      let maxEval = Number.NEGATIVE_INFINITY;
      const availableMoves = getValidMoves(board, player); // すべての手を列挙する（配置可能な場所を得る）

      // 全ての可能な手に対して評価値を計算し、最大評価値を選択する
      for (let i = 0; i < availableMoves.length; i++) {
        const move = availableMoves[i]; // i 番目の手を選択する

        const newBoard = makeMove(board, move.row, move.col, player); // 石を置く

        // 石を置いたあとの相手の局面を評価
        const opponent = player === "black" ? "white" : "black";
        const evalResult = minimax(
          newBoard,
          opponent,
          depth - 1,
          alpha,
          beta,
          false
        );

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

        // 石を置いたあとの相手の局面を評価
        const opponent = player === "black" ? "white" : "black";
        const evalResult = minimax(
          newBoard,
          opponent,
          depth - 1,
          alpha,
          beta,
          true
        );

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

  const isSelfDefeatingMove = (board, player) => {
    const opponent = player === "black" ? "white" : "black";

    // 相手の手を列挙する
    const opponentMoves = getValidMoves(board, opponent);

    // 相手の手を試してみて、自滅する手があるかどうかを確認する
    for (let i = 0; i < opponentMoves.length; i++) {
      const opponentMove = opponentMoves[i];
      const tempBoardAfterOpponentMove = makeMove(
        board,
        opponentMove.row,
        opponentMove.col,
        opponent
      );
      const playerStoneCount = countStones(tempBoardAfterOpponentMove, player);

      // プレイヤーの石が全滅するかどうかをチェック
      if (playerStoneCount === 0) {
        // 全滅する場合、避けるべき手として扱う
        return true;
      }
    }

    return false;
  };

  /**
   * 盤面の評価値を計算します。
   *
   * @param {Array<Array<string|null>>} board - 盤面の状態を表す2次元配列
   * @returns {number} 盤面の評価値
   */
  const evaluate = (board, player) => {
    let score = 0;

    if (gamePhase === "end") {
      //      const opponent = player === "black" ? "white" : "black";
      //      score = countStones(board, player) - countStones(board, opponent);
      score = countStones(board, "black") - countStones(board, "white");
    } else {
      // プレイヤーごとの重み付け係数
      const weights = {
        white: 1,
        black: -1,
      };

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
        recordGame(move.row, move.col);
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
    const newGamePhase = determineGamePhase(
      moves,
      blackStones,
      whiteStones,
      boardSize
    );
    if (gamePhase !== newGamePhase) {
      setGamePhase(newGamePhase);
    }

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
        <div>Player: {currentPlayer}</div>
        <div>Game Phase: {gamePhase} </div>
        {/* 石の数の表示部分 */}
        <div>Black Stones: {blackCount}</div>
        <div>White Stones: {whiteCount}</div>
        <div>Move History</div>
        <div>{renderMoveHistory()}</div>
      </div>
    </div>
  );
};

export default Board;
