"use client";

import { useContext } from 'react';
import { AuthContext, AuthContextType } from './auth-context';

export const useAuth = (): AuthContextType => useContext(AuthContext);
