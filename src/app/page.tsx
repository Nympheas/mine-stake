'use client';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useWatchContractEvent
} from 'wagmi';
import { STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI } from '../lib/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { parseEther } from 'viem';
import { StakeHistory } from './StakeHistory'; 
import { MyStakeHistory } from './MyStakeHistory';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const { data: stakedBalance, refetch } = useReadContract({
    address: STAKE_CONTRACT_ADDRESS,
    abi: STAKE_CONTRACT_ABI,
    functionName: 'getMyBalance',
    account: address,
  });
  useWatchContractEvent({
    address: STAKE_CONTRACT_ADDRESS,
    abi: STAKE_CONTRACT_ABI,
    eventName: 'Staked',
    onLogs(logs) {
      console.log('📥 监听到质押事件：', logs);
    },
  });

  const [stakeEvents, setStakeEvents] = useState<any[]>([]);

useWatchContractEvent({
  address: STAKE_CONTRACT_ADDRESS,
  abi: STAKE_CONTRACT_ABI,
  eventName: 'Staked',
  onLogs(logs) {
    setStakeEvents((prev) => [
      ...prev,
      ...logs.map((log: any) => ({
        address: log.args?.user,
        amount: log.args?.amount ? Number(log.args.amount) / 1e18 : 0,
        time: new Date().toLocaleTimeString(),
      })),
    ]);
  },
});


  const handleStake = () => {
    const value = parseEther(amount);
    writeContract({
      address: STAKE_CONTRACT_ADDRESS,
      abi: STAKE_CONTRACT_ABI,
      functionName: 'stake',
      value,
    });
    setTxHash(hash);
  };

  const handleWithdraw = () => {
    writeContract({
      address: STAKE_CONTRACT_ADDRESS,
      abi: STAKE_CONTRACT_ABI,
      functionName: 'withdraw',
    });
    setTxHash(hash);
  };

  const { data: totalStaked } = useReadContract({
    address: STAKE_CONTRACT_ADDRESS,
    abi: STAKE_CONTRACT_ABI,
    functionName: 'getContractBalance',
  });

  return (
    <main className="flex flex-col items-center justify-center min-h-screen space-y-6 p-10">
      <ConnectButton />
      {isConnected && (
        <>
          <div className="text-center">
            <p className="text-lg">当前质押余额：</p>
            <p className="text-xl text-green-400">
              {Number(stakedBalance) / 1e18} ETH
            </p>
            <p className="text-sm text-white">
              🔒 合约总质押：{Number(totalStaked) / 1e18} ETH
            </p>
          </div>

          <input
            type="number"
            placeholder="输入质押金额（ETH）"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border px-4 py-2 rounded text-black"
          />

          <button
            onClick={handleStake}
            disabled={!amount || isPending}
            className="bg-blue-500 text-white px-6 py-2 rounded"
          >
            {isPending ? '质押中...' : '质押'}
          </button>

          <button
            onClick={handleWithdraw}
            disabled={isPending}
            className="bg-red-500 text-white px-6 py-2 rounded"
          >
            提取质押
          </button>

          <StakeHistory />
          <MyStakeHistory />


          {isConfirming && <p className="text-yellow-400">等待区块确认中...</p>}
          {isSuccess && (
            <p className="text-green-400">✅ 操作成功！</p>
          )}
          {error && (
            <p className="text-red-400">❌ 操作失败：{error.message}</p>
          )}
        </>
      )}
    </main>
  );
}

