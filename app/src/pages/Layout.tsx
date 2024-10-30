import { AppBar } from '@src/components/navigation/AppBar';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="flex flex-col h-full w-full">
      <Outlet />
      <AppBar />
    </div>
  );
}
