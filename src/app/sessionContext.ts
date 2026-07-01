import { createContext, useContext } from 'react';

export const SessionContext = createContext<any>(null);

export const useSession = () => useContext(SessionContext);
