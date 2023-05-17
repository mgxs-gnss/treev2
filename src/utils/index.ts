export const compressAddress = (address?: string) => {
  if (!address) return;
  if (address.startsWith("0x")) {
    address = address.slice(2);
  } else {
    return address;
  }
  return `0x${address.slice(0, 5)}...${address.slice(-5)}`;
};

let COLUMNS = 12;
export const setColumns = (total: number) =>
  (COLUMNS = Math.ceil(Math.sqrt(total)) + 1);
export const getColumns = () => COLUMNS;
