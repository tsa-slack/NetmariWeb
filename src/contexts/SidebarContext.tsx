import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SidebarContextType {
  /** AdminLayout がサイドバー開閉ハンドラーを登録用 */
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** AdminLayout がアクティブかどうか（Header がどちらのメニューを開くか判断用） */
  hasSidebar: boolean;
  registerSidebar: () => void;
  unregisterSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isSidebarOpen: false,
  setSidebarOpen: () => {},
  hasSidebar: false,
  registerSidebar: () => {},
  unregisterSidebar: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [hasSidebar, setHasSidebar] = useState(false);

  const registerSidebar = useCallback(() => setHasSidebar(true), []);
  const unregisterSidebar = useCallback(() => {
    setHasSidebar(false);
    setSidebarOpen(false);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isSidebarOpen, setSidebarOpen, hasSidebar, registerSidebar, unregisterSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
