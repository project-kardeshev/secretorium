import { Home, Layout, NotFound, Vault, Vaults } from '@pages/index';
import {
  Route,
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
} from 'react-router-dom';

function App() {
  const router = createHashRouter(
    createRoutesFromElements(
      <>
        <Route element={<Layout />} errorElement={<NotFound />}>
          <Route path="/" element={<Home />} />
          <Route path="/vaults" element={<Vaults />} />
          <Route path="/vault/:id" element={<Vault />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </>,
    ),
  );
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
