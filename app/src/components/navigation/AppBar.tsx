import {
  useConnect,
  useConnection,
  useProfileModal,
} from '@project-kardeshev/ao-wallet-kit';
import { User, Wallet } from 'lucide-react';

export function AppBar() {
  const { connected } = useConnection();
  const connect = useConnect();
  const { setOpen, open } = useProfileModal();

  function handleClick() {
    if (connected) {
      setOpen(!open);
    } else {
      connect();
    }
  }

  return (
    <div className="flex flex-row justify-center items-center px-4 py-6">
      <button
        onClick={handleClick}
        className="text-white rounded-full bg-foreground p-6"
      >
        {connected ? <User size={24} /> : <Wallet size={24} />}
      </button>
    </div>
  );
}
