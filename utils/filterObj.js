const filterObj = (obj, ...allwedFields) => {
  const newObj = {}
  for (const key in obj) {
    if (allwedFields.includes(key)) {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

module.exports = filterObj
