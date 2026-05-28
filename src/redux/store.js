import { configureStore } from '@reduxjs/toolkit';
import problemReducer from './problemSlice';
export const store = configureStore({ reducer: { problem: problemReducer } });