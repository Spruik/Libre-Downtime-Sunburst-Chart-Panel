
/**
 * Expecting the restructured datalist
 * Return an array with distinct categories  --> ['category-1', 'category-2', ...]
 * @param {*} data 
 */
export function getCategories(data) {
  
  let categories = data.reduce((arr, d) => {
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
  let data = []
  let cols = rowCols.reduce((arr, c) => {
    const col = c.text.toLowerCase()
    arr.push(col)
    return arr
  }, [])
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    let serise = {}
    for (let k = 0; k < cols.length; k++) {
      const col = cols[k]
      serise[col] = row[k]
    }
    data.push(serise)
  }

  return data
}

export function getSunburstData(data){

  const cate = data.filter(d => d.category !== null && d.category !== undefined)
  const categories = findDistinct(cate, 'categories')

  let root = []

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    //calculate the total duration for this category
    let totalDuration = calcDuration(category, data)
    totalDuration = toHrsAndMins(totalDuration)
    console.log(totalDuration);

    let obj = {
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

function getParentReasons(root, data) {

  const reasonsCounts = countReasons(data)

  for (let i = 0; i < root.length; i++) {
    const category = root[i];
    //filter parent reaons that are from this category
    let p_reasons = data.filter(d => d.category === category.name && d.parentreason !== null)
    //find distinct reasons    
    p_reasons = findDistinct(p_reasons, 'p_reasons')
    //for each distinct reason
    for (let k = 0; k < p_reasons.length; k++) {
      const p_reason = p_reasons[k];

      let totalDuration = calcDurationForReason(category.name, data, p_reason)
      totalDuration = toHrsAndMins(totalDuration)
      console.log(totalDuration);
      
      let obj = {
        name: p_reason,
        children: [],
        value: reasonsCounts[p_reason],
        info: {
          category: category.name,
          reason: p_reason,
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

function addSubReasons(node, category, data, reasonsCounts) {
  
  const allReasons = data.filter(d => d.reason !== null & d.reason !== undefined)
  let real_index

  let sub_reasons = allReasons.filter(d => {

    const reasons = d.reason.split(' | ')
    let index = reasons.indexOf(node.name)
    if (index !== -1) {
      real_index = index
    }
    return index !== -1 && index !== reasons.length - 1

  })

  let duration = 0.00
  for (let i = 0; i < sub_reasons.length; i++) {
    const r = sub_reasons[i];
    duration += r.durationint
  }
  duration = toHrsAndMins(duration)

  sub_reasons = findDisctinctSubReasons(sub_reasons, real_index)
  
  //---------------------------------------------------------------------------------------------------------------------
  //continue to add duration to sub-reason
  //---------------------------------------------------------------------------------------------------------------------

  if (sub_reasons.length > 0) {
    
    for (let i = 0; i < sub_reasons.length; i++) {
      let sub_reason = sub_reasons[i];

      let child = {
        name: sub_reason ,
        children: [],
        value: reasonsCounts[sub_reason],
        info: {
          category: category.name,
          reasons: sub_reason,
          type: 'Sub Reason',
          parent: node.name,
          duration: duration
        }
      }
      child = addSubReasons(child, category, data, reasonsCounts)
      node.children[i] = child
    }
  }else {

  }

  return node
}

function countReasons(data){

  const reasons_arr = data.reduce((arr, d) => {
    if (d.reason) {
      const reasons = d.reason.split(' | ')
      for (let i = 0; i < reasons.length; i++) {
        const reason = reasons[i];
        arr.push(reason)
      }
    }
    return arr
  }, [])

  let counts = {}
  reasons_arr.forEach( x => counts[x] = (counts[x] || 0) + 1)

  return counts
}

function findDistinct(data, key){
  return Array.from(new Set(data.reduce((arr, record) => {
    if (key === 'categories') {
      arr.push(record.category)
    }else if (key === 'p_reasons') {
      arr.push(record.parentreason)
    }
    return arr
  }, [])))
}

function getCategoryFrequency(data, category){
  const categories = data.filter(d => d.category === category)
  return categories.length
}

function findDisctinctSubReasons(sub_reasons, index){
  return Array.from(new Set(sub_reasons.reduce((arr, d)=>{
    const reasons = d.reason.split(' | ')
    arr.push(reasons[index + 1])
    return arr
  }, [])))
}

function calcDuration(category, data) {
  let duration = 0.00
  data.forEach((d) => {
      if (d.category === category) {
        duration += d.durationint
      }
  })
  return duration
}

function calcDurationForReason(category, data, p_reason) {
  let duration = 0.00
  data.forEach(d => {
    if (d.category === category && d.parentreason === p_reason) {
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
function toHrsAndMins(difference){  
  const daysDiff = Math.floor(difference/1000/60/60/24)
  difference -= daysDiff*1000*60*60*24

  let hrsDiff = Math.floor(difference/1000/60/60)
  difference -= hrsDiff*1000*60*60

  const minsDiff = Math.floor(difference/1000/60)
  difference -= minsDiff*1000*60

  const secsDiff = Math.floor(difference/1000)
  difference -= minsDiff*1000

  let timeToAdd = daysDiff * 24
  hrsDiff = hrsDiff + timeToAdd
  
  if (hrsDiff === 0 && minsDiff === 0) {
    return secsDiff + ' Seconds'
  }else if (hrsDiff === 0 && minsDiff !== 0) {
    return minsDiff + ' Minutes'
  }

  return hrsDiff + ' Hrs & ' + minsDiff + ' Mins'
}

export function getTotalDuration(data){
  let dur = 0.00
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    if (d.durationint) {
      dur += d.durationint
    }
  }
  return toHrsAndMins(dur)
}