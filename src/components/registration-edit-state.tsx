"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const EditContext = createContext({
  dirty: false,
  setDirty: (_value: boolean) => {
    void _value;
  },
  errors: {} as Record<string, string>,
  setErrors: (_value: Record<string, string>) => {
    void _value;
  },
});

export function RegistrationEditState({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <EditContext.Provider value={{ dirty, setDirty, errors, setErrors }}>
      {children}
    </EditContext.Provider>
  );
}

export const useRegistrationEditState = () => useContext(EditContext);
