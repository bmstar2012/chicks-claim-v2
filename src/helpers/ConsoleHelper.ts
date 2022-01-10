/* eslint-disable @typescript-eslint/no-explicit-any,no-console */
const ConsoleHelper = (...args: any[]) => {
  if (process.env.NODE_ENV === 'production') return;
  console.log(...args);
};

export default ConsoleHelper;
