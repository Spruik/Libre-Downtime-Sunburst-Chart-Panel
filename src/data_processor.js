
/**
 * Expecting the restructured datalist
 * Return an array with distinct categories  --> ['category-1', 'category-2', ...]
 * @param {*} data
 */
export function getCategories (data) {
  const categories = data.reduce((arr, d) => {
    if (d.category !== null && d.category !== undefined) {
      arr.push(d.category)
    }
    return arr
  }, [])

  return Array.from(new Set(categories))
}

/**
 * Expecting columns names, and rows values
 * Return {col-1 : value-1, col-2 : value-2 .....}
 * @param {*} rowCols
 * @param {*} rows
 */
export function restructuredData (rowCols, rows) {
  const data = []
  const cols = rowCols.reduce((arr, c) => {
    const col = c.text.toLowerCase()
    arr.push(col)
    return arr
  }, [])
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const serise = {}
    for (let k = 0; k < cols.length; k++) {
      const col = cols[k]
      serise[col] = row[k]
    }
    data.push(serise)
  }

  return data
}

export function getSunburstData (data) {
  const cate = data.filter(d => d.category !== null && d.category !== undefined)
  const categories = findDistinct(cate, 'categories')

  const root = []

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]
    // calculate the total duration for this category
    let totalDuration = calcDuration(category, data)
    totalDuration = toHrsAndMins(totalDuration)
    // console.log(totalDuration);

    const obj = {
      name: category,
      children: [],
      value: getCategoryFrequency(data, category),
      info: {
        category: category,
        type: 'Category',
        parent: null,
        duration: totalDuration
      }
    }
    root.push(obj)
  }

  return getParentReasons(root, data)
}

function getParentReasons (root, data) {
  const reasonsCounts = countReasons(data)

  for (let i = 0; i < root.length; i++) {
    const category = root[i]
    // filter parent reaons that are from this category
    let parentReasons = data.filter(d => d.category === category.name && d.parentreason !== null)
    // find distinct reasons
    parentReasons = findDistinct(parentReasons, 'p_reasons')
    // for each distinct reason
    for (let k = 0; k < parentReasons.length; k++) {
      const parentReason = parentReasons[k]

      let totalDuration = calcDurationForReason(category.name, data, parentReason)
      totalDuration = toHrsAndMins(totalDuration)
      // console.log(totalDuration);

      let obj = {
        name: parentReason,
        children: [],
        value: reasonsCounts[parentReason],
        info: {
          category: category.name,
          reason: parentReason,
          type: 'Reason',
          parent: category.name,
          duration: totalDuration
        }
      }
      obj = addSubReasons(obj, category, data, reasonsCounts)
      root[i].children.push(obj)
    }
  }

  return root
}

function addSubReasons (node, category, data, reasonsCounts) {
  const allReasons = data.filter(d => d.reason !== null & d.reason !== undefined)
  let realIndex

  let subReasons = allReasons.filter(d => {
    const reasons = d.reason.split(' | ')
    const index = reasons.indexOf(node.name)
    if (index !== -1) {
      realIndex = index
    }
    return index !== -1 && index !== reasons.length - 1
  })

  let duration = 0.00
  for (let i = 0; i < subReasons.length; i++) {
    const r = subReasons[i]
    duration += r.durationint
  }
  duration = toHrsAndMins(duration)

  subReasons = findDisctinctSubReasons(subReasons, realIndex)

  // ---------------------------------------------------------------------------------------------------------------------
  // continue to add duration to sub-reason
  // ---------------------------------------------------------------------------------------------------------------------

  if (subReasons.length > 0) {
    for (let i = 0; i < subReasons.length; i++) {
      const subReason = subReasons[i]

      let child = {
        name: subReason,
        children: [],
        value: reasonsCounts[subReason],
        info: {
          category: category.name,
          reasons: subReason,
          type: 'Sub Reason',
          parent: node.name,
          duration: duration
        }
      }
      child = addSubReasons(child, category, data, reasonsCounts)
      node.children[i] = child
    }
  } else {

  }

  return node
}

function countReasons (data) {
  const reasonsArray = data.reduce((arr, d) => {
    if (d.reason) {
      const reasons = d.reason.split(' | ')
      for (let i = 0; i < reasons.length; i++) {
        const reason = reasons[i]
        arr.push(reason)
      }
    }
    return arr
  }, [])

  const counts = {}
  reasonsArray.forEach(
    (x) => { counts[x] = (counts[x] || 0) + 1 }
  )

  return counts
}

function findDistinct (data, key) {
  return Array.from(new Set(data.reduce((arr, record) => {
    if (key === 'categories') {
      arr.push(record.category)
    } else if (key === 'p_reasons') {
      arr.push(record.parentreason)
    }
    return arr
  }, [])))
}

function getCategoryFrequency (data, category) {
  const categories = data.filter(d => d.category === category)
  return categories.length
}

function findDisctinctSubReasons (subReasons, index) {
  return Array.from(new Set(subReasons.reduce((arr, d) => {
    const reasons = d.reason.split(' | ')
    arr.push(reasons[index + 1])
    return arr
  }, [])))
}

function calcDuration (category, data) {
  let duration = 0.00
  data.forEach((d) => {
    if (d.category === category) {
      duration += d.durationint
    }
  })
  return duration
}

function calcDurationForReason (category, data, parentReason) {
  let duration = 0.00
  data.forEach(d => {
    if (d.category === category && d.parentreason === parentReason) {
      duration += d.durationint
    }
  })
  return duration
}

/**
 * Expecting a duration int value, return (string) hours and mins like 2:35 meaning 2 hours and 35 mins
 * if val is under 1 hour,  return (string) mins like 55-mins
 * @param {*} val
 */
function toHrsAndMins (difference) {
  const daysDiff = Math.floor(difference / 1000 / 60 / 60 / 24)
  difference -= daysDiff * 1000 * 60 * 60 * 24

  let hrsDiff = Math.floor(difference / 1000 / 60 / 60)
  difference -= hrsDiff * 1000 * 60 * 60

  const minsDiff = Math.floor(difference / 1000 / 60)
  difference -= minsDiff * 1000 * 60

  const secsDiff = Math.floor(difference / 1000)
  difference -= minsDiff * 1000

  const timeToAdd = daysDiff * 24
  hrsDiff = hrsDiff + timeToAdd

  if (hrsDiff === 0 && minsDiff === 0) {
    return secsDiff + ' Seconds'
  } else if (hrsDiff === 0 && minsDiff !== 0) {
    return minsDiff + ' Minutes'
  }

  return hrsDiff + ' Hrs & ' + minsDiff + ' Mins'
}

export function getTotalDuration (data) {
  let dur = 0.00
  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    if (d.durationint) {
      dur += d.durationint
    }
  }
  return toHrsAndMins(dur)
}
