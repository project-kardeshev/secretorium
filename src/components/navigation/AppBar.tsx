import {
  useConnect,
  useConnection,
  useProfileModal,
} from '@project-kardeshev/ao-wallet-kit';
import { useGlobalState } from '@src/services/useGlobalState';
import { User, Wallet } from 'lucide-react';

export function AppBar() {
  const { connected } = useConnection();
  const connect = useConnect();
  const setShowMenu = useGlobalState((s) => s.setShowMenu);

  function handleClick() {
    if (connected) {
      setShowMenu(true);
    } else {
      connect();
    }
  }

  return (
    <div className="flex flex-row justify-center items-center px-4 py-6">
      {!connected ? (
        <button
          onClick={handleClick}
          className="text-white rounded-full bg-[rgb(0,0,0,0.5)]  hover:scale-110 transition-all p-6"
        >
          <Wallet size={24} />
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="text-white rounded-full bg-[rgb(0,0,0,0.5)] hover:scale-110 transition-all shadow-3xl"
        >
          <img
            width={'75px'}
            src={'/images/menu-icon.webp'}
            className="rounded-full"
          />
        </button>
      )}
    </div>
  );
}
