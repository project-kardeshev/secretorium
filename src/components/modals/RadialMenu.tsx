import { useGlobalState } from '@src/services/useGlobalState';
import { ReactNode, useState } from 'react';

import Modal from './Modal';

export function RadialMenuModal({
  items,
  visible,
  radius = 130,
  innerRadius = 80,
}: {
  items: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    className?: string;
  }[];
  visible: boolean;
  radius?: number;
  innerRadius?: number;
}) {
  const setShowMenu = useGlobalState((s) => s.setShowMenu);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  return (
    <Modal
      visible={visible}
      modalClasses={`
        relative 
        rounded-full 
        w-[350px] 
        h-[350px] 
        flex 
        justify-center 
        items-center 
        border border-secondary 
        shadow-3xl
      `}
      modalStyle={{
        background: `radial-gradient(circle, transparent ${
          innerRadius - 5
        }px, rgba(0, 0, 0, 0.7) ${innerRadius - 5}px, rgba(0, 0, 0, 0.5) ${
          innerRadius + 5
        }px, rgba(0, 0, 0, 0.5) 100%)`,
      }}
      onClickOutside={() => setShowMenu(false)}
    >
      {/* Central label display when hovering over an item */}
      {hoveredLabel && (
        <div className="absolute text-center text-white font-semibold">
          {hoveredLabel}
        </div>
      )}

      {items.map((item, index) => {
        const angle = (360 / items.length) * index;
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const y = radius * Math.sin((angle * Math.PI) / 180);

        return (
          <button
            key={index}
            className={`absolute ${item.className || ''}`}
            onClick={item.onClick}
            onMouseEnter={() => setHoveredLabel(item.label)}
            onMouseLeave={() => setHoveredLabel(null)}
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            {item.icon || item.label}
          </button>
        );
      })}
    </Modal>
  );
}
