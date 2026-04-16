import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { connect, iAmReady, getStoreInfo } from "@tiendanube/nexo";
import nexo from "@/lib/nexoClient";

interface NexoContextType {
  isEmbedded: boolean;
  isConnected: boolean;
  storeInfo: {
    id: string;
    name: string;
    url: string;
    country: string;
    language: string;
    currency: string;
  } | null;
}

const NexoContext = createContext<NexoContextType>({
  isEmbedded: false,
  isConnected: false,
  storeInfo: null,
});

export const useNexo = () => useContext(NexoContext);

export function NexoProvider({ children }: { children: ReactNode }) {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [storeInfo, setStoreInfo] = useState<NexoContextType["storeInfo"]>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Detect if running inside an iframe (embedded in Tiendanube admin)
    const inIframe = window.self !== window.top;

    if (!inIframe) {
      setChecked(true);
      return;
    }

    setIsEmbedded(true);

    connect(nexo, 5000)
      .then(async () => {
        setIsConnected(true);
        iAmReady(nexo);

        try {
          const info = await getStoreInfo(nexo);
          setStoreInfo(info);
        } catch (err) {
          console.error("Error getting store info from Nexo:", err);
        }
      })
      .catch((err) => {
        console.warn("Nexo connect failed (not embedded?):", err);
        setIsEmbedded(false);
      })
      .finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return null; // Wait until we know if embedded or not
  }

  return (
    <NexoContext.Provider value={{ isEmbedded, isConnected, storeInfo }}>
      {children}
    </NexoContext.Provider>
  );
}
