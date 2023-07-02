import React, { useEffect } from "react";

/* global BigInt */

/**
 * 指定されたサイズのデフォルトのボード状態を生成します。
 * @param {number} size - ボードのサイズ
 * @returns {Object} - デフォルトのボード状態
 */
const getDefaultBoardState = (size) => {
  const board = {
    black: 0n, // 現プレイヤーの石のボード上の位置を示す64ビット整数
    white: 0n, // 相手プレイヤーの石のボード上の位置を示す64ビット整数
    moveCount: 0, // 手数
  };

  const center = Math.floor(size / 2);

  // 黒石と白石の位置をビット演算で設定する
  board.black =
    (1n << BigInt((center - 1) * size + center - 1)) |
    (1n << BigInt(center * size + center));
  board.white =
    (1n << BigInt((center - 1) * size + center)) |
    (1n << BigInt(center * size + center - 1));
  return board;
};

/**
 * ビットボード上の指定されたプレイヤーの石の数を計算します。
 *
 * @param {BigInt} playerBoard - プレイヤーの石の位置を示す64ビット整数
 * @returns {number} プレイヤーの石の数
 */
const countStones = (playerBoard) => {
  let cnt = BigInt(playerBoard);
  // ビット演算を使用してプレイヤーの石の数を計算
  cnt = cnt - ((cnt >> 1n) & 0x5555555555555555n); // 2bit block
  cnt = (cnt & 0x3333333333333333n) + ((cnt >> 2n) & 0x3333333333333333n); // 4bit block
  cnt = (cnt + (cnt >> 4n)) & 0x0f0f0f0f0f0f0f0fn; // 8bit block
  cnt = cnt + (cnt >> 8n); // 16bit block
  cnt = cnt + (cnt >> 16n); // 32bit block
  cnt = cnt + (cnt >> 32n); // 64bit block
  return Number(cnt & 0x7fn);
};

/**
 * ゲームボードコンポーネント
 * @returns {JSX.Element} ゲームボードの表示要素
 */
const Board = () => {
  const [boardSize, setBoardSize] = React.useState(8); // ゲームの盤面サイズ
  const initialBoard = getDefaultBoardState(boardSize);
  const [boardState, setBoardState] = React.useState(initialBoard); // 盤面の初期状態を設定する
  const [currentPlayer, setCurrentPlayer] = React.useState("black");
  // const { currentPlayer, setCurrentPlayer } = React.useState("black");
  const [blackCount, setBlackCount] = React.useState(2);
  const [whiteCount, setWhiteCount] = React.useState(2);
  const { gamePhase, setGamePhase } = React.useState("early");

  /**
   * ボードサイズが変更されたときに実行される副作用のコールバック関数です。
   */
  useEffect(() => {
    setBoardState(getDefaultBoardState(boardSize));
  }, [boardSize]);

  /**
   * 盤面の状態を監視し、各プレイヤーの石の数を更新し、ゲーム終了時の処理を実行します。
   */
  useEffect(() => {
    setBlackCount(countStones(boardState.black));
    setWhiteCount(countStones(boardState.white));
  }, [boardState]);

  const isPass = (board, player) => {
    const opponent = player === "black" ? "white" : "black";
    const playerValidMoves = getValidMoves(board, player);
    const opponentValidMoves = getValidMoves(board, opponent);

    // 自分だけが置けない場合は、パス
    return playerValidMoves === 0n && opponentValidMoves !== 0n;
  };

  const isGameOver = (board, player) => {
    const opponent = player === "black" ? "white" : "black";
    const playerValidMoves = getValidMoves(board, player);
    const opponentValidMoves = getValidMoves(board, opponent);

    // 両手番とも置く場所がない場合
    return playerValidMoves === 0n && opponentValidMoves === 0n;
  };
  
  /**
   * 指定されたプレイヤーのビットボードと相手のビットボードから、配置可能な手の配列を取得します。
   *
   * @param {object} board - ゲームの盤面状態を示すオブジェクト
   * @param {string} player - プレイヤー
   * @returns {bigint}>} 配置可能な手にビットを立てた64bit整数
   */
  const getValidMoves = (board, player) => {
    const opponent = player === "black" ? "white" : "black";
    const playerBoard = board[player];
    const opponentBoard = board[opponent];

    //左右端の番人
    const horizontalWatchBoard = opponentBoard & 0x7e7e7e7e7e7e7e7en;
    //上下端の番人
    const verticalWatchBoard = opponentBoard & 0x00ffffffffffff00n;
    //全辺の番人
    const allSideWatchBoard = opponentBoard & 0x007e7e7e7e7e7e00n;
    //空きマスのみにビットが立っているボード
    const blankBoard = ~(playerBoard | opponentBoard);
    //返り値
    let validMoves = 0n;

    //8方向チェック
    // ・一度に返せる石は最大(boardSize-2)

    //左
    let tmp = horizontalWatchBoard & (playerBoard << 1n); // 左に隣接する相手の石
    for (let i = 1; i < boardSize - 2; i++) {
      tmp |= horizontalWatchBoard & (tmp << 1n); // 左に連続して隣接する相手の石
    }
    validMoves |= blankBoard & (tmp << 1n); // 合法手として追加

    //右
    tmp = horizontalWatchBoard & (playerBoard >> 1n); // 右に隣接する相手の石
    for (let i = 1; i < boardSize - 2; i++) {
      tmp |= horizontalWatchBoard & (tmp >> 1n); // 右に連続して隣接する相手の石
    }
    validMoves |= blankBoard & (tmp >> 1n); // 合法手として追加

    //上
    tmp = verticalWatchBoard & (playerBoard << 8n); // 上に隣接する相手の石
    for (let i = 1; i < boardSize - 2; i++) {
      tmp |= verticalWatchBoard & (tmp << 8n); // 上に連続して隣接する相手の石
    }
    validMoves |= blankBoard & (tmp << 8n); // 合法手として追加

    //下
    tmp = verticalWatchBoard & (playerBoard >> 8n); // 下に隣接する相手の石
    for (let i = 1; i < boardSize - 2; i++) {
      tmp |= verticalWatchBoard & (tmp >> 8n); // 下に連続して隣接する相手の石
    }
    validMoves |= blankBoard & (tmp >> 8n);

    //左斜め上
    tmp = allSideWatchBoard & (playerBoard << 9n); // 左斜め上に隣接する相手の石
    for (let i = 1; i < boardSize - 2; i++) {
      tmp |= allSideWatchBoard & (tmp << 9n); // 左斜め上に連続して隣接する相手の石
    }
    validMoves |= blankBoard & (tmp << 9n); // 合法手として追加

    //右斜め下
    tmp = allSideWatchBoard & (playerBoard >> 9n); // 右斜め下に隣接する相手の石
    for (let i = 1; i < boardSize - 2; i++) {
      tmp |= allSideWatchBoard & (tmp >> 9n); // 右斜め下に連続して隣接する相手の石
    }
    validMoves |= blankBoard & (tmp >> 9n); // 合法手として追加

    //左斜め下
    tmp = allSideWatchBoard & (playerBoard >> 7n); // 左斜め下に隣接する相手の石
    for (let i = 1; i < boardSize - 2; i++) {
      tmp |= allSideWatchBoard & (tmp >> 7n); // 左斜め下に連続して隣接する相手の石
    }
    validMoves |= blankBoard & (tmp >> 7n); // 合法手として追加

    //右斜め上
    tmp = allSideWatchBoard & (playerBoard << 7n); // 右斜め上に隣接する相手の石
    for (let i = 1; i < boardSize - 2; i++) {
      tmp |= allSideWatchBoard & (tmp << 7n); // 右斜め上に連続して隣接する相手の石
    }
    validMoves |= blankBoard & (tmp << 7n);

    return validMoves;
  };

  const flipStone = (pos, player, board) => {
    const opponent = player === "black" ? "white" : "black";
    let flip = 0n;
    let bit = 1n << BigInt(pos); // 着手した位置にビットを立てる
    // 8方向チェック
    for (let dir = 0; dir < 8; dir++) {
      let temp = 0n;
      let mask = flipStoneInDirection(bit, dir);
      while (mask !== 0n && (mask & board[opponent]) !== 0n) {
        temp |= mask;
        mask = flipStoneInDirection(mask, dir);
      }
      if ((mask & board[player]) !== 0n) {
        flip |= temp;
      }
    }

    board[player] ^= bit | flip;
    board[opponent] ^= flip;
    board.moveCount += 1;
    displayBoard("Flip:", flip);
    displayBoard("Player:", board[player]);
    displayBoard("Opponent:", board[opponent]);
    return board;
  };

  const flipStoneInDirection = (bit, dir) => {
    switch (dir) {
      case 0: //左
        return (BigInt(bit) << 1n) & 0xfefefefefefefefen;
      case 1: //右
        return (BigInt(bit) >> 1n) & 0x7f7f7f7f7f7f7f7fn;
      case 2: //上
        return (BigInt(bit) << 8n) & 0xffffffffffffff00n;
      case 3: //下
        return (BigInt(bit) >> 8n) & 0x00ffffffffffffffn;
      case 4: //左上
        return (BigInt(bit) << 9n) & 0xfefefefefefefe00n;
      case 5: //右下
        return (BigInt(bit) >> 9n) & 0x007f7f7f7f7f7f7fn;
      case 6: //左下
        return (BigInt(bit) >> 7n) & 0x00fefefefefefefen;
      case 7: //右上
        return (BigInt(bit) << 7n) & 0x7f7f7f7f7f7f7f00n;
      default:
        return 0n;
    }
  };

  const checkValidMove = (rowIndex, colIndex) => {
    const pos = BigInt(rowIndex * boardSize + colIndex);
    // 石を置ける場所の取得
    const validMoves = getValidMoves(boardState, currentPlayer);
    // rowIndex, colIndexの位置が石を置ける場所に含まれているかどうかを判定
    return (validMoves >> pos) & 1n;
  };

  /**
   * マス目がクリックされた時の処理を行います。
   *
   * @param {number} rowIndex - クリックされたマス目の行インデックス
   * @param {number} colIndex - クリックされたマス目の列インデックス
   */
  const handleCellClick = (rowIndex, colIndex) => {
    // クリックされたマス目に石が置けるかどうかの判定
    const isValidMove = checkValidMove(rowIndex, colIndex);

    if (isValidMove) {
      // 石を置く処理を実行
      const pos = rowIndex * boardSize + colIndex;
      const newBoard = flipStone(pos, currentPlayer, boardState);
      //makeMove(boardState, rowIndex, colIndex, currentPlayer);
      //recordGame(rowIndex, colIndex);
      setBoardState(newBoard);
      // プレーヤーの手番を切り替える
      //setIsComputerTurn(true);
      setCurrentPlayer(currentPlayer === "black" ? "white" : "black");
    } else {
      // 石を置けない場合の処理
      // 例えば、エラーメッセージを表示するなど
      console.log("Invalid move");
    }
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

  const renderIndices = () => {
    const validMoves = getValidMoves(boardState, currentPlayer);
    const columnIndices = Array.from({ length: boardSize }, (_, i) =>
      String.fromCharCode(97 + i)
    );
    return (
      <div className="board-indices">
        {/* 列のインデックスを表示 */}
        <div className="board-row">
          <div className="corner-index-cell"></div>
          {columnIndices.map((columnIndex, colIndex) => (
            <div key={colIndex} className="col-index-cell">
              {columnIndex}
            </div>
          ))}
        </div>
        {/* 行のインデックスとゲームボードを表示 */}
        {Array.from({ length: boardSize }, (_, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {/* 行のインデックスを表示 */}
            <div className="row-index-cell">{rowIndex + 1}</div>
            {/* ゲームボードのセルを表示 */}{" "}
            {Array.from({ length: boardSize }, (_, colIndex) => {
              const position = rowIndex * boardSize + colIndex;
              const isValidMove = (validMoves >> BigInt(position)) & 1n;
              const blackStone = (boardState.black >> BigInt(position)) & 1n;
              const whiteStone = (boardState.white >> BigInt(position)) & 1n;
              let cell = null;
              if (blackStone) {
                cell = "black";
              } else if (whiteStone) {
                cell = "white";
              }
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

  const displayBoard = (str, board) => {
    console.log(str);
    const boardString = board.toString(2).padStart(64, "0");
    for (let i = 0; i < 64; i += 8) {
      console.log(boardString.slice(i, i + 8));
    }
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
      </div>
    </div>
  );
};

export default Board;
