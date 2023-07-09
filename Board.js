import React, { useEffect } from "react";

/* global BigInt */

const BOARD_SIZE = 8;
let boardDir = 1;

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
    finalMove: 0, // 最後に置かれた石の位置
  };

  const center = Math.floor(size / 2);

  // 黒石と白石の位置をビット演算で設定する
  board.black =
    (1n << BigInt((center - 1) * size + center)) |
    (1n << BigInt(center * size + center - 1));
  board.white =
    (1n << BigInt((center - 1) * size + center - 1)) |
    (1n << BigInt(center * size + center));
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
 * BigIntの数値で、最も下位に立っているビット（LSB）のインデックスを検索します。
 * @param {BigInt} num - 入力の数値。
 * @returns {number} - LSBのインデックス。ビットが立っている場合はそのインデックスを、立っているビットがない場合は-1を返します。
 */
const findLSB = (num) => {
  if (num === 0n) {
    return -1; // ビットが立っている位置がない場合
  }
  return Math.log2(Number(num & -num));
};

/**
 * 序盤で利用する初手からの定石
 *
 */
const openingBook = [
  { name: "1st", move: "F5", next: "2nd" }, // 初手は、これしかない

  { name: "2nd", move: "D6", next: "tate" }, // 縦取り
  { name: "2nd", move: "F6", next: "naname" }, // 斜め取り
  { name: "2nd", move: "F4", next: "narabi" }, // 並び取り：３手目で「ｅ３」が黒の絶好の中割りとなり形勢が白不利となる

  { name: "tate", move: "C3", next: "tora" }, // 虎   F5D6C3
  { name: "tate", move: "C5", next: "usagi" }, // 兎   F5D6C5
  { name: "tate", move: "C6", next: "nousagi" }, // 野兎 F5D6C6

  { name: "naname", move: "E6", next: "naname1" }, // F5F6E6

  { name: "narabi", move: "", next: null },

  //      F5D6C6F4E6 G5D3C4E3C5B3B4C3B5
  //      F5D6C6F4E6 G6G5F6G4C5
  //      F5D6C6F4E6 G6D3C4E3C5B3B4C3B5
  //      F5D6C6F4E6 c5b4b5c4b6a5d7a6e7

  { name: "tora", move: "D3", next: "tora1" },
  { name: "tora1", move: "C4", next: "tora2" },
  { name: "tora2", move: "F4", next: "tora3" },
  { name: "tora3", move: "C5", next: "tora4" },
  { name: "tora4", move: "B3", next: "roseville" },

  { name: "roseville", move: "C2", next: null },

  { name: "nousagi", move: "F4", next: "nousagi1" }, // F5D6C6F4
  { name: "nousagi1", move: "E6", next: "nousagi2" }, // F5D6C6F4E6
  { name: "nousagi2", move: "G5", next: "nousagi3" }, // F5D6C6F4E6G5
  { name: "nousagi3", move: "D3", next: "nousagi4" }, // F5D6C6F4E6G5D3
  { name: "nousagi4", move: "C4", next: "nousagi5" }, // F5D6C6F4E6G5D3C4
  { name: "nousagi5", move: "E3", next: "nousagi6" }, // F5D6C6F4E6G5D3C4E3
  { name: "nousagi6", move: "C5", next: "nousagi7" }, // F5D6C6F4E6G5D3C4E3C5
  { name: "nousagi7", move: "B3", next: "nousagi8" }, // F5D6C6F4E6G5D3C4E3C5B3
  { name: "nousagi8", move: "B4", next: "nousagi9" }, // F5D6C6F4E6G5D3C4E3C5B3B4
  { name: "nousagi9", move: "C3", next: "nousagi10" }, // F5D6C6F4E6G5D3C4E3C5B3B4C3
  { name: "nousagi10", move: "B5", next: null }, // F5D6C6F4E6G5D3C4E3C5B3B4C3B5

  //{ name: "usagi", move: "B4", next: "usagi_hazushi" }, // F5D6C5B4

  { name: "usagi", move: "F4", next: "usagi2" }, // F5D6C5F4
  { name: "usagi2", move: "E3", next: "usagi3" }, // F5D6C5F4E3
  { name: "usagi3", move: "C6", next: "usagi4" }, // F5D6C5F4E3C6
  { name: "usagi4", move: "D3", next: "usagi5" }, // F5D6C5F4E3C6D3
  { name: "usagi5", move: "F6", next: "usagi6" }, // F5D6C5F4E3C6D3F6
  { name: "usagi6", move: "E6", next: "rose" }, // F5D6C5F4E3C6D3F6E6

  { name: "rose", move: "D7", next: "rose2" }, // F5D6C5F4E3C6D3F6E6D7

  { name: "rose2", move: "G3", next: "Srose" }, // F5D6C5F4E3C6D3F6E6D7G3

  { name: "Srose", move: "C4", next: "Srose1" }, // F5D6C5F4E3C6D3F6E6D7G3C4
  { name: "Srose1", move: "B4", next: "Srose2" }, // F5D6C5F4E3C6D3F6E6D7G3C4B4
  { name: "Srose2", move: "B3", next: "Srose3" }, // F5D6C5F4E3C6D3F6E6D7G3C4B4B3
  { name: "Srose3", move: "B5", next: "Srose4" }, // F5D6C5F4E3C6D3F6E6D7G3C4B4B3B5
  { name: "Srose4", move: "A4", next: "Srose5" }, // F5D6C5F4E3C6D3F6E6D7G3C4B4B3B5A4
  { name: "Srose5", move: "A2", next: "Srose6" }, // F5D6C5F4E3C6D3F6E6D7G3C4B4B3B5A4A2
  { name: "Srose6", move: "A3", next: "Srose7" }, // F5D6C5F4E3C6D3F6E6D7G3C4B4B3B5A4A2A3
  { name: "Srose7", move: "A5", next: null }, // F5D6C5F4E3C6D3F6E6D7G3C4B4B3B5A4A2A3A5

  //{ name: "rose2", move: "G4", next: "Frose" }, // F5D6C5F4E3C6D3F6E6D7G4
  //{ name: "rose2", move: "E7", next: "tezuka" }, // F5D6C5F4E3C6D3F6E6D7E7

  { name: "naname1", move: "F4", next: "naname2" }, // F5F6E6F4
  { name: "naname2", move: "E3", next: "ushi" }, // F5F6E6F4E3
  //{ name: "naname2", move: "C3", next: "buffalo" }, // F5F6E6F4C3
  //{ name: "naname2", move: "G4", next: "tanuki" }, // F5F6E6F4G4
  //{ name: "naname2", move: "F3", next: "uratanuki" }, // F5F6E6F4F3

  { name: "ushi", move: "C5", next: null }, // F5F6E6F4E3C5
  //{ name: "ushi", move: "D6", next: null }, // F5F6E6F4E3D6 next:白大量
  //{ name: "ushi", move: "D2", next: null }, // F5F6E6F4E3D2 next:石橋流
  //{ name: "ushi", move: "D7", next: null }, // F5F6E6F4E3D7 next:ヨーグルトプリン

  //{ name: "ushi2", move: "C4", next: "ushi3" }, // F5F6E6F4E3C5C4

  //{ name: "ushi3", move: "E7", next: "ushi4" }, // F5F6E6F4E3C5C4E7
  //{ name: "ushi4", move: "C6", next: "ushi5" }, // F5F6E6F4E3C5C4E7C6
  //{ name: "ushi5", move: "E2", next: null }, // F5F6E6F4E3C5C4E7C6E2 next: 快速船
  //{ name: "ushi5", move: "D2", next: null }, // F5F6E6F4E3C5C4E7C6D2 next: 幽霊船

  //{ name: "ushi2", move: "G5", next: null }, // 闘牛 F5F6E6 F4G5
  //{ name: "ushi2", move: "G6", next: null }, // 蛇   F5F6E6 F4G6

  //{ name: "naname", move: "E" },

  //{ name: "naname", move: "C6", next: "naname2" }, //
  //{ name: "naname2", move: "", next: "naname3" },
  //{ name: "naname3", move: "", next: "ushi" },
  //{ name: "ushi", move: "", next: "" },
  //{ name: "tate", move: "", next: "usagi" },
  //{ name: "usagi", move: "", next: "usagi2" },
  //{ name: "usagi2", move: "", next: "" },
];

/**
 * 次の定石を取得する
 * @param {string} status - 現在の状態
 * @returns {Array} - 次の定石の配列
 */
const getNextBooks = (status) => {
  const nextBook = [];
  let found = false;

  for (let i = 0; i < openingBook.length; i++) {
    if (openingBook[i].name === status) {
      nextBook.push(openingBook[i]);
      found = true;
    } else if (found) {
      break;
    }
  }

  return nextBook;
};

/**
 * 定石の座標を盤面の位置に変換する
 * @param {string} bookPos - 定石の座標
 * @returns {number} - 盤面の位置
 */
const convertPosition = (bookPos) => {
  const column = bookPos.toUpperCase().charCodeAt(0) - 65;
  const row = parseInt(bookPos.charAt(1)) - 1;

  return row * BOARD_SIZE + column;
};

/**
 * 指定された石の位置を定石の座標系に変換する
 * @param {number} pos - 盤面の位置
 * @returns {string} - 定石の座標
 */
const convertBookCoordinate = (pos) => {
  let moveRow = Math.floor(pos / BOARD_SIZE);
  let moveColumn = pos - moveRow * BOARD_SIZE;

  switch (boardDir) {
    case 2:
      // E6 -> F5
      moveColumn = moveRow;
      moveRow = moveColumn;
      break;
    case 3:
      // D3 -> F5
      moveColumn = 7 - moveColumn;
      moveRow = 7 - moveRow;
      break;
    case 4:
      // C4 -> F5
      moveColumn = 7 - moveRow;
      moveRow = 7 - moveColumn;
      break;
    default:
      break;
  }

  moveRow++;
  moveColumn++;

  const convertedColumn = String.fromCharCode(64 + moveColumn);
  const convertedRow = moveRow.toString();

  return convertedColumn + convertedRow;
};

/**
 * セルの評価値配列
 * @type {number[][]>} 評価値配列
 */
const cellValues = [
  [100, -40, 20, 5, 5, 20, -40, 100],
  [-40, -100, -1, -1, -1, -1, -100, -40],
  [20, -1, 5, 1, 1, 5, -1, 20],
  [5, -1, 1, 0, 0, 1, -1, 5],
  [5, -1, 1, 0, 0, 1, -1, 5],
  [20, -1, 5, 1, 1, 5, -1, 20],
  [-40, -100, -1, -1, -1, -1, -100, -40],
  [100, -40, 20, 5, 5, 20, -40, 100],
];

/**
 * 指定されたプレイヤーのビットボードと相手のビットボードから、配置可能な手の配列を取得します。
 *
 * @param {object} board - ゲームの盤面状態を示すオブジェクト
 * @param {string} player - プレイヤー
 * @returns {bigint}>} 配置可能な手にビットを立てた64bit整数
 */
const getValidMoves = (board, player) => {
  const playerBoard = board[player === 1 ? "black" : "white"];
  const opponentBoard = board[player === 1 ? "white" : "black"];

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
  // ・一度に返せる石は最大(BOARD_SIZE-2)

  //左
  let tmp = horizontalWatchBoard & (playerBoard << 1n); // 左に隣接する相手の石
  for (let i = 1; i < BOARD_SIZE - 2; i++) {
    tmp |= horizontalWatchBoard & (tmp << 1n); // 左に連続して隣接する相手の石
  }
  validMoves |= blankBoard & (tmp << 1n); // 合法手として追加

  //右
  tmp = horizontalWatchBoard & (playerBoard >> 1n); // 右に隣接する相手の石
  for (let i = 1; i < BOARD_SIZE - 2; i++) {
    tmp |= horizontalWatchBoard & (tmp >> 1n); // 右に連続して隣接する相手の石
  }
  validMoves |= blankBoard & (tmp >> 1n); // 合法手として追加

  //上
  tmp = verticalWatchBoard & (playerBoard << 8n); // 上に隣接する相手の石
  for (let i = 1; i < BOARD_SIZE - 2; i++) {
    tmp |= verticalWatchBoard & (tmp << 8n); // 上に連続して隣接する相手の石
  }
  validMoves |= blankBoard & (tmp << 8n); // 合法手として追加

  //下
  tmp = verticalWatchBoard & (playerBoard >> 8n); // 下に隣接する相手の石
  for (let i = 1; i < BOARD_SIZE - 2; i++) {
    tmp |= verticalWatchBoard & (tmp >> 8n); // 下に連続して隣接する相手の石
  }
  validMoves |= blankBoard & (tmp >> 8n);

  //左斜め上
  tmp = allSideWatchBoard & (playerBoard << 9n); // 左斜め上に隣接する相手の石
  for (let i = 1; i < BOARD_SIZE - 2; i++) {
    tmp |= allSideWatchBoard & (tmp << 9n); // 左斜め上に連続して隣接する相手の石
  }
  validMoves |= blankBoard & (tmp << 9n); // 合法手として追加

  //右斜め下
  tmp = allSideWatchBoard & (playerBoard >> 9n); // 右斜め下に隣接する相手の石
  for (let i = 1; i < BOARD_SIZE - 2; i++) {
    tmp |= allSideWatchBoard & (tmp >> 9n); // 右斜め下に連続して隣接する相手の石
  }
  validMoves |= blankBoard & (tmp >> 9n); // 合法手として追加

  //左斜め下
  tmp = allSideWatchBoard & (playerBoard >> 7n); // 左斜め下に隣接する相手の石
  for (let i = 1; i < BOARD_SIZE - 2; i++) {
    tmp |= allSideWatchBoard & (tmp >> 7n); // 左斜め下に連続して隣接する相手の石
  }
  validMoves |= blankBoard & (tmp >> 7n); // 合法手として追加

  //右斜め上
  tmp = allSideWatchBoard & (playerBoard << 7n); // 右斜め上に隣接する相手の石
  for (let i = 1; i < BOARD_SIZE - 2; i++) {
    tmp |= allSideWatchBoard & (tmp << 7n); // 右斜め上に連続して隣接する相手の石
  }
  validMoves |= blankBoard & (tmp << 7n);

  return validMoves;
};

/**
 * パスが必要かどうかを判定する
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @param {number} player - プレイヤーの識別子 (1: 黒, -1: 白)
 * @returns {boolean} - パスが必要な場合はtrue、そうでない場合はfalse
 */
const isPass = (board, player) => {
  const playerValidMoves = getValidMoves(board, player);
  const opponentValidMoves = getValidMoves(board, -player);

  // 自分だけが置けない場合は、パス
  return playerValidMoves === 0n && opponentValidMoves !== 0n;
};

/**
 * ゲームが終了したかどうかを判定する
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @param {number} player - プレイヤーの識別子 (1: 黒, -1: 白)
 * @returns {boolean} - ゲームが終了した場合はtrue、そうでない場合はfalse
 */
const isGameOver = (board, player) => {
  const playerValidMoves = getValidMoves(board, player);
  const opponentValidMoves = getValidMoves(board, -player);

  // 両手番とも置く場所がない場合
  return playerValidMoves === 0n && opponentValidMoves === 0n;
};

/**
 * 指定された位置に石を置き、盤面を反転させた結果を返します。
 *
 * @param {Board} board - 現在の盤面
 * @param {number} player - 石を置くプレイヤー（1: 黒, -1: 白）
 * @param {number} pos - 石を置く位置
 * @returns {Board} - 石を置き、反転が行われた後の盤面
 */
const flipStone = (board, player, pos) => {
  const workBoard = { ...board };
  let playerBoard = workBoard[player === 1 ? "black" : "white"];
  let opponentBoard = workBoard[player === 1 ? "white" : "black"];
  let flip = 0n;
  let bit = 1n << BigInt(pos); // 着手した位置にビットを立てる
  // 8方向チェック
  for (let dir = 0; dir < 8; dir++) {
    let temp = 0n;
    let mask = flipStoneInDirection(bit, dir);
    while (mask !== 0n && (mask & opponentBoard) !== 0n) {
      temp |= mask;
      mask = flipStoneInDirection(mask, dir);
    }
    if ((mask & playerBoard) !== 0n) {
      flip |= temp;
    }
  }

  playerBoard ^= bit | flip;
  opponentBoard ^= flip;
  workBoard[player === 1 ? "black" : "white"] = playerBoard;
  workBoard[player === 1 ? "white" : "black"] = opponentBoard;
  workBoard.moveCount += 1;
  return workBoard;
};

/**
 * 指定されたビットを指定された方向にシフトし、反転操作に利用するマスクを返します。
 *
 * @param {BigInt} bit - シフトするビット
 * @param {number} dir - シフトする方向（0: 左, 1: 右, 2: 上, 3: 下, 4: 左上, 5: 右下, 6: 左下, 7: 右上）
 * @returns {BigInt} - 反転操作に利用するマスク
 */
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

/**
 * Transposition Tableを管理するオブジェクト
 */
const transpositionTable = {
  table: new Map(),

  /**
   * ボードの状態をTransposition Tableに保存する
   * @param {Object} board - 盤面の状態を表すオブジェクト
   * @param {number} depth - 探索の深さ
   * @param {number} move - 手の位置
   * @param {number} score - 手の評価値
   */
  store(board, depth, move, score) {
    const key = generateKey(board);
    const entry = { depth, move, score };
    this.table.set(key, entry);
  },

  /**
   * 指定されたキーのエントリーをTransposition Tableから取得する
   * @param {string} key - ボードのハッシュキー
   * @returns {Object} - Transposition Tableのエントリー情報
   */
  lookup(key) {
    return this.table.get(key);
  },
};

/**
 * 盤面のハッシュキーを生成する関数
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @returns {string} - 盤面のハッシュキー
 */
function generateKey(board) {
  return board.toString();
}

/**
 * Transposition Tableから指定された手の評価値を取得する
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @param {number} move - 手の位置
 * @returns {number} - 手の評価値（Transposition Tableにエントリーがない場合はデフォルト値を返す）
 */
function getEvaluationFromTranspositionTable(board, move) {
  const key = generateKey(board);
  const entry = transpositionTable.lookup(key);
  if (entry && entry.move === move) {
    return entry.score;
  }
  return 0; // Transposition Tableにエントリーがない場合はデフォルト値を返す
}

/**
 * 手の順序付けを行う
 * @param {number[]} moves - 手の配列
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @param {number} player - プレイヤーの識別子 (1: 黒, -1: 白)
 * @returns {number[]} - 順序付けされた手の配列
 */
function orderMoves(moves, board, player) {
  const orderedMoves = [...moves];

  // Transposition Tableから手の評価値を参照し、手の順序付けを行う
  orderedMoves.sort((moveA, moveB) => {
    const evalA = getEvaluationFromTranspositionTable(board, moveA);
    const evalB = getEvaluationFromTranspositionTable(board, moveB);
    return evalB - evalA; // 評価値が高い順にソート
  });

  return orderedMoves;
}

/**
 * 最適な手を見つけます。
 *
 * @param {Board} board - 現在の盤面
 * @param {number} player - 現在のプレイヤー（1: 黒, -1: 白）
 * @param {number} depth - 探索の深さ
 * @param {string} gamePhase - ゲームのフェーズ（"early": 初盤面, "mid": 中盤面, "end": 終盤面）
 * @returns {number} - 最適な手の位置
 */
const findBestMove = (board, player, depth, gamePhase) => {
  let bestMove = 0;

  const availableMoves = getValidMoves(board, player);
  const num = countStones(availableMoves);
  if (num === 0) {
    return -1; // skip
  } else if (num === 1) {
    // 置ける場所が１つしかないので、その場所を返す
    // （最下位ビットの位置）
    return Math.log2(Number(availableMoves));
  }

  // 序盤、中盤は石の配置等で評価
  let evalfunc = midEval;

  if (gamePhase === "end1") {
    // 終盤初期は必勝読み評価
    evalfunc = forceWinEval;
  } else if (gamePhase === "end2") {
    // 終盤後期は完全読み評価
    evalfunc = perfectEval;
  }

  const validMoves = getValidMovesArray(availableMoves);
  console.log("validMoves:", validMoves);
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let dp = 1; dp < depth; dp++) {
    bestScore = Number.NEGATIVE_INFINITY;

    // 手の順序付けを行う
    // dp-1 の時の結果を参考に順序付けを行う
    const orderedMoves = orderMoves(validMoves, board, player);
    console.log("orderdMoves:", orderedMoves);

    for (let move of orderedMoves) {
      let newBoard = flipStone(board, player, move);
      console.log("dp: %d, move:%s\n", dp, convertBookCoordinate(move));
      displayBoard(newBoard);
      // 全滅チェック
      if (isSelfDefeatingMove(newBoard, player)) {
        // 相手の次の１手で全滅になる手は避ける
        console.log("complete avoidance");
        continue;
      }

      let score = -negascout(
        newBoard,
        -player,
        evalfunc,
        dp - 1,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY
      );
      console.log("score:", score);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      // 評価結果をTransposition Tableに保存し、orderMoves で利用する。
      transpositionTable.store(newBoard, dp, bestMove, bestScore);
    }
  }
  console.log(
    "Best Move:%s, Best Score: %d",
    convertBookCoordinate(bestMove),
    bestScore
  );
  return bestMove;
};

/**
 * NegaScoutアルゴリズムを使用して盤面を探索し、最適なスコアを計算します。
 *
 * @param {Board} board - 現在の盤面
 * @param {number} player - 現在のプレイヤー（1: 黒, -1: 白）
 * @param {function} evalfunc - 盤面の評価関数
 * @param {number} depth - 探索の深さ
 * @param {number} alpha - アルファ値（最良のスコア下界）
 * @param {number} beta - ベータ値（最良のスコア上界）
 * @returns {number} - 最適なスコア
 */
const negascout = (board, player, evalfunc, depth, alpha, beta) => {
  // 手を列挙する
  const validMoves = getValidMovesArray(getValidMoves(board, player));

  if (depth === 0 || validMoves.length === 0 || isGameOver(board, player)) {
    // 終端ノードなので現在のノードを評価する
    return evalfunc(board, player);
  }

  // 手のを並べ替える move ordering
  const orderedMoves = orderMoves(validMoves, board, player);

  const newBoard = flipStone(board, player, orderedMoves[0]);

  // 最善候補を通常の窓で探索する
  let score = -negascout(newBoard, -player, evalfunc, depth - 1, -beta, -alpha);

  let move = orderedMoves[0];
  if (beta <= score) {
    // cut
    // 評価結果をTransposition Tableに保存し、orderMoves で利用する。
    transpositionTable.store(board, depth, move, score);
    return score;
  }
  if (alpha < score) {
    alpha = score;
  }
  let bestScore = score;

  for (let i = 1; i < orderedMoves.length; i++) {
    move = orderedMoves[i];
    const newBoard = flipStone(board, player, move);
    // Null Window Search
    // move ordering が上手くいっていれば、早々にカットできる
    score = -negascout(
      newBoard,
      -player,
      evalfunc,
      depth - 1,
      -alpha - 1,
      -alpha
    );
    if (beta <= score) {
      // cut
      // 評価結果をTransposition Tableに保存し、orderMoves で利用する。
      transpositionTable.store(board, depth, move, score);
      return score;
    }

    // move ordering が上手くいっていないと、余計な探索が増える
    if (alpha < score) {
      alpha = score;
      // 通常の窓で再探索
      score = -negascout(newBoard, -player, evalfunc, depth - 1, -beta, -alpha);
      if (beta <= score) {
        // cut
        // 評価結果をTransposition Tableに保存し、orderMoves で利用する。
        transpositionTable.store(board, depth, move, score);
        return score;
      }
      if (alpha < score) {
        alpha = score;
      }
    }
    if (bestScore < score) {
      bestScore = score;
    }
  }
  // 子ノードの最大値を返す (fail-soft)
  // 評価結果をTransposition Tableに保存し、orderMoves で利用する。
  transpositionTable.store(board, depth, move, bestScore);
  return bestScore;
};

/**
 * 中盤用の評価関数。盤面の評価値を計算します。
 *
 * @param {Object} board - ゲームの盤面状態を示すオブジェクト
 * @param {number} player - 現在のプレイヤー (1: 黒, -1: 白)
 * @returns {number} 盤面の評価値
 */
const midEval = (board, player) => {
  const playerBoard = board[player === 1 ? "black" : "white"];
  const opponentBoard = board[player === 1 ? "white" : "black"];
  let playerCount = countStones(getValidMoves(board, player)) << 2; // 着手可能な手が多い方が有利
  let opponentCount = countStones(getValidMoves(board, -player)) << 2;

  // 盤面を走査して各セルの価値を評価に加算
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const move = row * BOARD_SIZE + col;
      if ((playerBoard >> BigInt(move)) & 1n) {
        playerCount += cellValues[row][col];
      }
      if ((opponentBoard >> BigInt(move)) & 1n) {
        opponentCount += cellValues[row][col];
      }
    }
  }

  return playerCount - opponentCount;
};

/**
 * 必勝読みの評価関数
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @param {number} player - プレイヤーの識別子 (1: 黒, -1: 白)
 * @returns {number} - 評価値 (1: 勝利, 0: 引き分け, -1: 敗北)
 */
const forceWinEval = (board, player) => {
  const playerBoard = board[player === 1 ? "black" : "white"];
  const opponentBoard = board[player === 1 ? "white" : "black"];
  const playerCount = countStones(playerBoard);
  const opponentCount = countStones(opponentBoard);
  const discDiff = playerCount - opponentCount;
  const WIN = 1;
  const DRAW = 0;
  const LOSE = -1;

  if (discDiff > 0) {
    return WIN;
  } else if (discDiff < 0) {
    return LOSE;
  } else {
    return DRAW;
  }
};

/**
 * 完全読みの評価関数
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @param {number} player - プレイヤーの識別子 (1: 黒, -1: 白)
 * @returns {number} - 評価値
 */
const perfectEval = (board, player) => {
  const playerBoard = board[player === 1 ? "black" : "white"];
  const opponentBoard = board[player === 1 ? "white" : "black"];

  let playerCount = countStones(playerBoard);
  let opponentCount = countStones(opponentBoard);

  return playerCount - opponentCount;
};

/**
 * 自滅する手かどうかを判定する
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @param {number} player - プレイヤーの識別子 (1: 黒, -1: 白)
 * @returns {boolean} - 自滅する手かどうかの判定結果 (true: 自滅する手, false: 自滅しない手)
 */
const isSelfDefeatingMove = (board, player) => {
  // 相手の手を列挙する
  const opponentMoves = getValidMovesArray(getValidMoves(board, -player));

  // 相手の手を試してみて、自滅する手があるかどうかを確認する
  for (let i = 0; i < opponentMoves.length; i++) {
    const opponentMove = opponentMoves[i];
    const tempBoardAfterOpponentMove = flipStone(board, -player, opponentMove);
    const playerStoneCount = countStones(
      tempBoardAfterOpponentMove[player === 1 ? "black" : "white"]
    );

    // プレイヤーの石が全滅するかどうかをチェック
    if (playerStoneCount === 0) {
      // 全滅する場合、避けるべき手として扱う
      return true;
    }
  }

  return false;
};

/**
 * 盤面の表示を行う
 * @param {Object} board - 盤面の状態を表すオブジェクト
 */
const displayBoard = (board) => {
  console.log("move count:", board.moveCount);
  for (let row = 0; row < BOARD_SIZE; row++) {
    let line = "";
    for (let col = 0; col < BOARD_SIZE; col++) {
      const pos = row * BOARD_SIZE + col;
      const bit = 1n << BigInt(pos);
      if (board.black & bit) {
        line += "B ";
      } else if (board.white & bit) {
        line += "W ";
      } else if (board.black & board.white & bit) {
        line += "X "; // overlapping stones
      } else {
        line += "- "; // empty cell
      }
    }
    console.log(line);
  }
};

/**
 * ゲームのフェーズを決定する
 *
 * ・一定手数の経過
 * ・ある場所に石が置かれたとき
 *
 *  お互い長所と短所があるので、この二つを組み合わせることにより、次のような方法で序盤、中盤、終盤の判定を行う。
 *  (1) ⇒ 終盤2
 * 　　４４手以降は終盤2に移行する。１点でも多く勝つため、完全読みへ。
 *
 *  (2) 序盤⇒中盤
 * 　　中盤の戦略として端を確保することが重要なので、Bの場所に石が置かれたら中盤に移行する。
 *
 *  S - B B B B - S
 *  - - - - - - - -
 *  B - - - - - - B
 *  B - - - - - - B
 *  B - - - - - - B
 *  B - - - - - - B
 *  - - - - - - - -
 *  S - B B B B - S
 *
 *  (3) 中盤⇒終盤１
 * 　　隅２箇所に石があれば、ほぼ決着がついてしまうので、勝てるなら確実に勝ちにいく
 *
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @param {string} gamePhase - 現在のゲームの進行フェーズ
 * @param {string|null} bookStatus - 定石の状態
 * @returns {string} - 判定されたゲームの進行フェーズ
 */
const determineGamePhase = (board, gamePhase, bookStatus) => {
  const B_MASK = 0x3c0081818181003cn;
  const S_MASK = 0x8100000000000081n;

  if (board.moveCount >= 42) {
    return "end2";
  }

  if (gamePhase === "early") {
    // Bの場所に石が置かれる
    if ((board.black | board.white) & B_MASK && bookStatus === null) {
      return "mid";
    }
  }

  if (gamePhase === "mid") {
    // 30手以降で、2つ以上の隅に同じ色の石が置かれている
    if (
      board.moveCount >= 30 &&
      (countStones(board.black & S_MASK) >= 2 ||
        countStones(board.white & S_MASK) >= 2)
    ) {
      return "end1";
    }
  }

  return gamePhase;
};

/**
 * １手先のすべての局面を表示する
 * @param {Object} board - 盤面の状態を表すオブジェクト
 * @param {number} player - プレイヤーの識別子 (1: 黒, -1: 白)
 */
const printNextMove = (board, player) => {
  const availableMoves = getValidMoves(board, player);

  if (!availableMoves) {
    console.log("No valid moves. Skipping turn.");
    return;
  }

  const validMoves = getValidMovesArray(availableMoves);
  for (let move of validMoves) {
    console.log("move:", move);
    // 手を実際に打って局面を更新
    const newBoard = flipStone(board, player, move);

    // 更新された局面を表示
    console.log("New board state:");
    displayBoard(newBoard);
  }
};

/**
 * 有効な手の配列を取得します。
 * @param {BigInt} availableMoves - 使用可能な手を表すビット列。
 * @returns {number[]} - 有効な手の配列。
 */
const getValidMovesArray = (availableMoves) => {
  const validMoves = [];
  for (let move = 0; move < BOARD_SIZE * BOARD_SIZE; move++) {
    if (((availableMoves >> BigInt(move)) & 1n) !== 0n) {
      validMoves.push(move);
    }
  }
  return validMoves;
};

/**
 * ゲームボードコンポーネント
 * @returns {JSX.Element} ゲームボードの表示要素
 */
const Board = () => {
  // const [BOARD_SIZE, setBOARD_SIZE] = React.useState(8); // ゲームの盤面サイズ
  const initialBoard = getDefaultBoardState(BOARD_SIZE);
  const [boardState, setBoardState] = React.useState(initialBoard); // 盤面の初期状態を設定する
  const [currentPlayer, setCurrentPlayer] = React.useState(1); // 1:black -1:white
  const [isComputerTurn, setIsComputerTurn] = React.useState(false);
  const [blackCount, setBlackCount] = React.useState(2);
  const [whiteCount, setWhiteCount] = React.useState(2);
  const [gamePhase, setGamePhase] = React.useState("early");
  const [bookStatus, setBookStatus] = React.useState("1st");

  /**
   * 盤面の状態を監視し、各プレイヤーの石の数を更新し、ゲーム終了時の処理を実行します。
   */
  useEffect(() => {
    setBlackCount(countStones(boardState.black));
    setWhiteCount(countStones(boardState.white));
    setGamePhase(determineGamePhase(boardState, gamePhase, bookStatus));
    setTimeout(function () {
      if (isGameOver(boardState, currentPlayer)) {
        alert("Game Over");
        setBoardState(getDefaultBoardState(8));
        setCurrentPlayer(1);
        setIsComputerTurn(false);
        setGamePhase("early");
      }
    }, 100);
  }, [boardState]);

  useEffect(() => {
    if (isComputerTurn) {
      let move = -1;
      let newBoard = { ...boardState };
      let depth = 6;
      if (gamePhase === "end1" || gamePhase === "end2") {
        depth = Number.POSITIVE_INFINITY;
      }
      do {
        // printNextMove(boardState, currentPlayer);
        if (gamePhase === "early") {
          // 序盤定石
          const nextBooks = getNextBooks(bookStatus);
          const nextBook = selectBookOne(nextBooks);
          if (nextBook) {
            move = convertPosition(nextBook.move);
            setBookStatus(nextBook.next);
          } else {
            // 定石がないため、中盤に移行
            setGamePhase("mid");
            move = findBestMove(newBoard, currentPlayer, depth, gamePhase);
          }
        } else {
          move = findBestMove(newBoard, currentPlayer, depth, gamePhase);
        }

        if (move >= 0) {
          newBoard = flipStone(newBoard, currentPlayer, move);
          setBoardState(newBoard);
        }
      } while (!getValidMoves(newBoard, -currentPlayer) && move >= 0);
      setIsComputerTurn(false);
      setCurrentPlayer(-currentPlayer);
    }
  }, [isComputerTurn, currentPlayer]);

  const checkValidMove = (rowIndex, colIndex) => {
    const pos = BigInt(rowIndex * BOARD_SIZE + colIndex);
    // 石を置ける場所の取得
    const validMoves = getValidMoves(boardState, currentPlayer);
    // rowIndex, colIndexの位置が石を置ける場所に含まれているかどうかを判定
    return (validMoves >> pos) & 1n;
  };

  const selectBookOne = (books) => {
    const randomIndex = Math.floor(Math.random() * books.length);
    return books[randomIndex];
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
      const move = rowIndex * BOARD_SIZE + colIndex;
      const newBoard = flipStone(boardState, currentPlayer, move);
      setBoardState(newBoard);

      // 初手を F5 とするボードの向きを得る
      if (newBoard.moveCount === 1) {
        if (rowIndex === 4 && colIndex === 5) {
          // F5
          boardDir = 1;
        } else if (rowIndex === 5 && colIndex === 4) {
          // E6
          boardDir = 2;
        } else if (rowIndex === 2 && colIndex === 3) {
          // D3
          boardDir = 3;
        } else if (rowIndex === 3 && colIndex === 2) {
          // C4
          boardDir = 4;
        }
        setBookStatus("2nd");
      } else {
        const nextBooks = getNextBooks(bookStatus);
        const bookMove = convertBookCoordinate(move);
        let nextBookStatus = null;
        for (let i = 0; i < nextBooks.length; i++) {
          if (nextBooks[i].move === bookMove) {
            nextBookStatus = nextBooks[i].next;
          }
        }
        if (nextBookStatus === null) {
          setGamePhase("mid");
        }
        setBookStatus(nextBookStatus);
      }

      // プレーヤーの手番を切り替える
      setIsComputerTurn(true);
      setCurrentPlayer(-currentPlayer);
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
    const columnIndices = Array.from({ length: BOARD_SIZE }, (_, i) =>
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
        {Array.from({ length: BOARD_SIZE }, (_, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {/* 行のインデックスを表示 */}
            <div className="row-index-cell">{rowIndex + 1}</div>
            {/* ゲームボードのセルを表示 */}{" "}
            {Array.from({ length: BOARD_SIZE }, (_, colIndex) => {
              const position = rowIndex * BOARD_SIZE + colIndex;
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

  return (
    <div className="game-board">
      <div className="board-container">
        <div className="board">{renderIndices()}</div>
      </div>
      <div className="score-container">
        <div>Player: {currentPlayer === 1 ? "black" : "white"}</div>
        <div>Game Phase: {gamePhase} </div>
        {/* 石の数の表示部分 */}
        <div>Black Stones: {blackCount}</div>
        <div>White Stones: {whiteCount}</div>
        <div>Move History</div>
        {/* １手先の局面の表示部分
        <div>Next Moves:</div>
        <div className="next-moves">
        {availableMoves && availableMoves.map((move) => (
          <div key={move}>
            <div>Move: {move}</div>
            <div className="next-board">{renderNextBoard(board, player, move)}</div>
          </div>
        ))}
      </div>
        */}
      </div>
    </div>
  );
};

export default Board;
