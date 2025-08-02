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
import { useAccount } from 'wagmi';

const STAKE_CONTRACT = '0x182a15726dC2a30e6b3fe395e3Ea83D786cf4888'; // 替换为你的合约地址
const RPC_ENDPOINT = 'https://ethereum-sepolia.publicnode.com'; // 可替换为 Alchemy 连接
const BLOCK_RANGE = 5000;

const client = createPublicClient({
  chain: sepolia,
  transport: http(RPC_ENDPOINT),
});

type StakeLog = {
  user: string;
  amount: string;
  block: bigint;
};


export function MyStakeHistory() {
  const { address } = useAccount();
  const [logs, setLogs] = useState<StakeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    async function fetchMyLogs() {
      try {
        setLoading(true);
        const latestBlock = await client.getBlockNumber();

        const allLogs = await client.getLogs({
          address: STAKE_CONTRACT,
          event: parseAbiItem('event Staked(address indexed user, uint256 amount)'),
          fromBlock: latestBlock - BigInt(BLOCK_RANGE),
          toBlock: 'latest',
        });

        if (!address) {
          setLogs([]);
          return;
        }

        const userLogs = allLogs
          .filter((log) => getAddress(log.args.user as string).toLowerCase() === address.toLowerCase())
          .map((log) => ({
            user: address,
            amount: formatEther(log.args.amount as bigint),
            block: log.blockNumber,
          }))
          .reverse();

        setLogs(userLogs);
        setError(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || '读取失败');
      } finally {
        setLoading(false);
      }
    }

    fetchMyLogs();
  }, [address]);

  return (
    <div className="bg-gray-800 p-4 rounded mt-6 w-full max-w-xl">
      <h3 className="text-white font-bold mb-2">👤 我的质押记录</h3>

      {!address && <p className="text-gray-400">请连接钱包</p>}
      {loading && <p className="text-yellow-400">读取中...</p>}
      {error && <p className="text-red-400">错误：{error}</p>}
      {!loading && logs.length === 0 && <p className="text-gray-400">暂无记录</p>}

      <ul className="text-sm text-gray-200 space-y-1">
        {logs.map((log, i) => (
          <li key={i}>
            质押 {log.amount} ETH | 区块 {log.block.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
