import { RadialMenuModal } from '@src/components/modals/RadialMenu';
import { AppBar } from '@src/components/navigation/AppBar';
import { useGlobalState } from '@src/services/useGlobalState';
import { Home, Sheet } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

export function Layout() {
  const showMenu = useGlobalState((s) => s.showMenu);
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full w-full bg-bronze-gradient">
      <Outlet />
      <AppBar />
      <RadialMenuModal
        visible={showMenu}
        items={[
          {
            label: 'Home',
            icon: <Home size={24} />,
            onClick: () => navigate('/'),
          },
          {
            label: 'about',
            icon: <Sheet size={24} />,
            onClick: () => navigate('/'),
          },
          {
            label: 'about',
            icon: <Sheet size={24} />,
            onClick: () => navigate('/'),
          },
        ].map((item, index) => ({
          ...item,
          className:
            'text-white hover:text-primary hover:bg-[rgb(0,0,0,0.7)] rounded-full flex justify-center items-center transition-all p-4 text-xs hover:shadow-3xl',
        }))}
      />
    </div>
  );
}
