import { useEffect, useState } from 'react';

export function useAppPathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string, options?: { replace?: boolean }) => {
    if ((window.location.pathname || '/') === to) {
      setPathname(to);
      return;
    }

    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }

    setPathname(to);
  };

  return {
    pathname,
    navigate,
    isAdminRoute: pathname === '/admin' || pathname.startsWith('/admin/')
  };
}
