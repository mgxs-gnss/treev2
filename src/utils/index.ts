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

const allGNSS = Array.from(Array(9676).keys());

export const randomArray = (elements: any[], maxCount?: number) => {
  var rr;
  if (typeof elements === "number") {
    rr = [];
    for (var i = elements - 1; i >= 0; i--) rr.push(i);
  } else {
    rr = elements;
  }

  for (i = rr.length; i--; )
    rr.push(rr.splice(Math.floor(Math.random() * (i + 1)), 1)[0]);

  if (maxCount) {
    rr = rr.slice(0, maxCount);
  }
  return rr;
};

export const getRandomGNSS = () => randomArray(allGNSS, 100);

export const intervals = [4000, 3000, 10500];

export const isMobile = () => {
  const userAgent = navigator.userAgent;
  const mobileRegex =
    /(Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone)/i;
  const isMobile = mobileRegex.test(userAgent);

  return isMobile;
};
