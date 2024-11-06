import { useAddress } from '@project-kardeshev/ao-wallet-kit';
import { errorEmitter, notificationEmitter } from '@src/utils/events';
import { errorSound, menuSound } from '@src/utils/sounds';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const notifyError = (e: Error) =>
  toast(e.message, {
    className:
      'bg-errorThin shadow-errorThin border-2 border-error text-secondary p-4',
    icon: <AlertCircle className="text-5xl text-error" />,
    style: {
      backgroundColor: 'rgba(255, 0, 0, 0.40)',
      color: 'white',
    },
  });

const notifySuccess = (msg: string) =>
  toast(msg, {
    className:
      'bg-matrixThin shadow-matrixThin border-2 border-matrix text-secondary p-4',
    icon: <CheckCircle className="text-2xl text-success" />,
    style: {
      backgroundColor: 'rgba(3, 160, 98, 0.40)',
      color: 'white',
      width: 'fit-content',
      display: 'flex',
    },
  });

function Notifications() {
  const address = useAddress();
  useEffect(() => {
    notificationEmitter.on('notification', (notification) => {
      menuSound.play();
      notifySuccess(notification);
    });

    errorEmitter.on('error', (error) => {
      errorSound.play();
      menuSound.play();
      console.error(error);
      notifyError(error);
    });

    return () => {
      notificationEmitter.removeAllListeners();
      errorEmitter.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (address) {
      notificationEmitter.emit(
        'notification',
        `Connected to ${address.slice(0, 6)}...${address.slice(-6)}`,
      );
    }
  }, [address]);

  return (
    <>
      <Toaster position="bottom-left" />
    </>
  );
}

export default Notifications;
