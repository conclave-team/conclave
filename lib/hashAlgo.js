export default function hashAlgo(input, collection) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const filteredInputArray = input.toLowerCase().replace(/[a-z\-]/g, '').split('');
  const sum = filteredInputArray.reduce((acc, num) => acc + Number(num), 0);

  return Math.floor((sum * 13) / 7) % collection.length;
}
