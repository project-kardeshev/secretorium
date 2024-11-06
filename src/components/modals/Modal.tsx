import { menuSound } from '@src/utils/sounds';
import { motion } from 'framer-motion';
import { Howl } from 'howler';
import { CSSProperties, ReactNode, useEffect, useRef } from 'react';

function Modal({
  children,
  modalClasses = `border-2 border-foreground shadow-secondaryThin rounded-lg bg-secondaryThin p-4`,
  containerClasses,
  visible,
  onClickOutside,
  sound = menuSound,
  modalStyle,
  containerStyle,
}: {
  children?: ReactNode;
  modalClasses?: string;
  containerClasses?: string;
  visible: boolean;
  onClickOutside?: (e: MouseEvent) => void;
  sound?: Howl;
  modalStyle?: CSSProperties;
  containerStyle?: CSSProperties;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        event.target &&
        modalRef.current &&
        !modalRef.current.contains(event.target as any) &&
        onClickOutside
      ) {
        onClickOutside(event);
      }
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalRef]);

  return (
    <motion.div
      animate={{
        opacity: visible ? 1 : 0,
        width: visible ? '100%' : '0%',
        padding: visible ? '1rem' : '0',
      }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onAnimationStart={() => sound?.play()}
      className={`modal-container ${containerClasses}`}
      style={containerStyle}
    >
      <motion.div
        animate={{
          y: visible ? 0 : 10000,
          x: visible ? 0 : 100,
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0 }}
        className={`${modalClasses}`}
        ref={modalRef}
        style={modalStyle}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default Modal;
