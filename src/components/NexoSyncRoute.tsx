import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ACTION_NAVIGATE_SYNC,
  type NavigateSyncResponse,
} from "@tiendanube/nexo/actions";
import { syncPathname } from "@tiendanube/nexo/helpers";
import nexo from "@/lib/nexoClient";

const NexoSyncRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  // Send current path to the browser URL via Nexo
  useEffect(() => {
    const path = search ? `${pathname}${search}` : pathname;
    syncPathname(nexo, path);
  }, [pathname, search]);

  // Listen for navigation changes from Tiendanube admin
  useEffect(() => {
    const unsuscribe = nexo.suscribe(
      ACTION_NAVIGATE_SYNC,
      ({ path, replace }: NavigateSyncResponse) => {
        if (replace) {
          navigate(path, { replace: true });
        } else {
          navigate(path);
        }
      }
    );
    return unsuscribe;
  }, [navigate]);

  return <>{children}</>;
};

export default NexoSyncRoute;
