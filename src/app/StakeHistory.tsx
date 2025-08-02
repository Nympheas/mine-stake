'use client';

import { useEffect, useState } from 'react';
import {
  createPublicClient,
  http,
  parseAbiItem,
  getAddress,
  formatEther,
} from 'viem';
import { sepolia } from 'viem/chains';

const STAKE_CONTRACT = '0x182a15726dC2a30e6b3fe395e3Ea83D786cf4888'; // ← 替换为你的合约地址
const ETH_DECIMALS = 18;
const BLOCK_RANGE = 5000; // 查询最近 N 个区块

// 支持替换 RPC
const RPC_ENDPOINT = 'https://ethereum-sepolia.publicnode.com'; // or Alchemy endpoint

const client = createPublicClient({
  chain: sepolia,
  transport: http(RPC_ENDPOINT),
});

type StakeLog = {
  user: string;
  amount: string;
  block: bigint;
};

export function StakeHistory() {
  const [logs, setLogs] = useState<StakeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStakeEvents() {
      try {
        setLoading(true);
        const latestBlock = await client.getBlockNumber();

        const logs = await client.getLogs({
          address: STAKE_CONTRACT,
          event: parseAbiItem('event Staked(address indexed user, uint256 amount)'),
          fromBlock: latestBlock - BigInt(BLOCK_RANGE),
          toBlock: 'latest',
        });

        const parsed = logs.map((log) => {
          const user = getAddress(log.args.user as string);
          const amount = formatEther(log.args.amount as bigint);
          return {
            user,
            amount,
            block: log.blockNumber,
          };
        });

        setLogs(parsed.reverse()); // 最近的放前面
        setError(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || '获取质押记录失败');
      } finally {
        setLoading(false);
      }
    }

    fetchStakeEvents();
  }, []);

  return (
    <div className="bg-gray-900 p-4 rounded mt-6 w-full max-w-xl">
      <h3 className="text-white font-bold mb-2">📜 最近质押记录（近 {BLOCK_RANGE} 区块）</h3>

      {loading && <p className="text-yellow-400">读取中...</p>}
      {error && <p className="text-red-500">错误：{error}</p>}
      {!loading && logs.length === 0 && <p className="text-gray-400">暂无记录</p>}

      <ul className="text-sm text-gray-300 space-y-1">
        {logs.map((log, i) => (
          <li key={i}>
            {log.user.slice(0, 6)}... → 质押 {log.amount} ETH | 区块 {log.block.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
