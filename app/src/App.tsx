import { Home, Layout, NotFound } from '@pages/index';
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
