function hashAlgo(input, collection) {
  const justNums = input.toLowerCase().replace(/[a-z\-]/g, '');
  return Math.floor(justNums * 13) % collection.length;
}

function generateItemFromHash(siteId, collection) {
  const hashIdx = hashAlgo(siteId, collection);

  return collection[hashIdx];
}

export {
  hashAlgo,
  generateItemFromHash
}
