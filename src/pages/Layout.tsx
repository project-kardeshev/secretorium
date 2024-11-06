import { useProfileModal } from '@project-kardeshev/ao-wallet-kit';
import { RadialMenuModal } from '@src/components/modals/RadialMenu';
import { AppBar } from '@src/components/navigation/AppBar';
import Notifications from '@src/components/navigation/Notifications';
import { useGlobalState } from '@src/services/useGlobalState';
import { Outlet, useNavigate } from 'react-router-dom';

export function Layout() {
  const { setOpen } = useProfileModal();
  const showMenu = useGlobalState((s) => s.showMenu);
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full w-full bg-temple bg-no-repeat bg-center">
      <div className="flex flex-col w-full h-full bg-[rgb(0,0,0,0.85)]">
        <Outlet />
        <AppBar />
        <RadialMenuModal
          visible={showMenu}
          items={[
            {
              label: 'Home',
              icon: (
                <img
                  alt="home"
                  className="rounded-full"
                  src={'/images/home-icon.webp'}
                />
              ),
              onClick: () => navigate('/'),
            },
            {
              label: 'Vaults',
              icon: (
                <img
                  alt="vaults"
                  className="rounded-full"
                  src={'/images/nav-icon.webp'}
                />
              ),
              onClick: () => navigate('/vaults'),
            },
            {
              label: 'Profile',
              icon: (
                <img
                  alt="profile"
                  className="rounded-full"
                  src={'/images/profile-icon.webp'}
                />
              ),
              onClick: () => {
                setOpen(true);
              },
            },
          ].map((item) => ({
            ...item,
            className:
              'text-white hover:text-primary hover:bg-[rgb(0,0,0,0.7)] rounded-full flex justify-center items-center transition-all p-2 max-w-[75px] text-xs hover:shadow-3xl',
          }))}
        />
      </div>
      <Notifications />
    </div>
  );
}
