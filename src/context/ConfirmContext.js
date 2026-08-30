// src/context/ConfirmContext.js
import { createContext, useCallback, useContext, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);

  const confirm = useCallback(({ title, message, confirmLabel = 'Delete', danger = true }) => {
    return new Promise((resolve) => {
      setRequest({ title, message, confirmLabel, danger, resolve });
    });
  }, []);

  const handleClose = (result) => {
    if (request) request.resolve(result);
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <ConfirmDialog
          title={request.title}
          message={request.message}
          confirmLabel={request.confirmLabel}
          danger={request.danger}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}