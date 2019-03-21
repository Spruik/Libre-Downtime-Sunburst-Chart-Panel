'use strict';

System.register([], function (_export, _context) {
  "use strict";

  /**
   * Expecting the restructured datalist
   * Return an array with distinct categories  --> ['category-1', 'category-2', ...]
   * @param {*} data 
   */
  function getCategories(data) {

    var categories = data.reduce(function (arr, d) {
      if (d.category !== null && d.category !== undefined) {
        arr.push(d.category);
      }
      return arr;
    }, []);

    return Array.from(new Set(categories));
  }

  /**
   * Expecting columns names, and rows values
   * Return {col-1 : value-1, col-2 : value-2 .....}
   * @param {*} rowCols 
   * @param {*} rows 
   */

  _export('getCategories', getCategories);

  function restructuredData(rowCols, rows) {
    var data = [];
    var cols = rowCols.reduce(function (arr, c) {
      var col = c.text.toLowerCase();
      arr.push(col);
      return arr;
    }, []);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var serise = {};
      for (var k = 0; k < cols.length; k++) {
        var col = cols[k];
        serise[col] = row[k];
      }
      data.push(serise);
    }

    return data;
  }
  _export('restructuredData', restructuredData);

  function getSunburstData(data) {

    var cate = data.filter(function (d) {
      return d.category !== null && d.category !== undefined;
    });
    var categories = findDistinct(cate, 'categories');

    var root = [];

    for (var i = 0; i < categories.length; i++) {
      var category = categories[i];
      //calculate the total duration for this category
      var totalDuration = calcDuration(category, data);
      totalDuration = toHrsAndMins(totalDuration);
      console.log(totalDuration);

      var obj = {
        name: category,
        children: [],
        value: getCategoryFrequency(data, category),
        info: {
          category: category,
          type: 'Category',
          parent: null,
          duration: totalDuration
        }
      };
      root.push(obj);
    }

    return getParentReasons(root, data);
  }
  _export('getSunburstData', getSunburstData);

  function getParentReasons(root, data) {

    var reasonsCounts = countReasons(data);

    var _loop = function _loop(i) {
      var category = root[i];
      //filter parent reaons that are from this category
      var p_reasons = data.filter(function (d) {
        return d.category === category.name && d.parentreason !== null;
      });
      //find distinct reasons    
      p_reasons = findDistinct(p_reasons, 'p_reasons');
      //for each distinct reason
      for (var k = 0; k < p_reasons.length; k++) {
        var p_reason = p_reasons[k];

        var totalDuration = calcDurationForReason(category.name, data, p_reason);
        totalDuration = toHrsAndMins(totalDuration);
        console.log(totalDuration);

        var obj = {
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
        };
        obj = addSubReasons(obj, category, data, reasonsCounts);
        root[i].children.push(obj);
      }
    };

    for (var i = 0; i < root.length; i++) {
      _loop(i);
    }

    return root;
  }function addSubReasons(node, category, data, reasonsCounts) {

    var allReasons = data.filter(function (d) {
      return d.reason !== null & d.reason !== undefined;
    });
    var real_index = void 0;

    var sub_reasons = allReasons.filter(function (d) {

      var reasons = d.reason.split(' | ');
      var index = reasons.indexOf(node.name);
      if (index !== -1) {
        real_index = index;
      }
      return index !== -1 && index !== reasons.length - 1;
    });

    var duration = 0.00;
    for (var i = 0; i < sub_reasons.length; i++) {
      var r = sub_reasons[i];
      duration += r.durationint;
    }
    duration = toHrsAndMins(duration);

    sub_reasons = findDisctinctSubReasons(sub_reasons, real_index);

    //---------------------------------------------------------------------------------------------------------------------
    //continue to add duration to sub-reason
    //---------------------------------------------------------------------------------------------------------------------

    if (sub_reasons.length > 0) {

      for (var _i = 0; _i < sub_reasons.length; _i++) {
        var sub_reason = sub_reasons[_i];

        var child = {
          name: sub_reason,
          children: [],
          value: reasonsCounts[sub_reason],
          info: {
            category: category.name,
            reasons: sub_reason,
            type: 'Sub Reason',
            parent: node.name,
            duration: duration
          }
        };
        child = addSubReasons(child, category, data, reasonsCounts);
        node.children[_i] = child;
      }
    } else {}

    return node;
  }function countReasons(data) {

    var reasons_arr = data.reduce(function (arr, d) {
      if (d.reason) {
        var reasons = d.reason.split(' | ');
        for (var i = 0; i < reasons.length; i++) {
          var reason = reasons[i];
          arr.push(reason);
        }
      }
      return arr;
    }, []);

    var counts = {};
    reasons_arr.forEach(function (x) {
      return counts[x] = (counts[x] || 0) + 1;
    });

    return counts;
  }function findDistinct(data, key) {
    return Array.from(new Set(data.reduce(function (arr, record) {
      if (key === 'categories') {
        arr.push(record.category);
      } else if (key === 'p_reasons') {
        arr.push(record.parentreason);
      }
      return arr;
    }, [])));
  }function getCategoryFrequency(data, category) {
    var categories = data.filter(function (d) {
      return d.category === category;
    });
    return categories.length;
  }function findDisctinctSubReasons(sub_reasons, index) {
    return Array.from(new Set(sub_reasons.reduce(function (arr, d) {
      var reasons = d.reason.split(' | ');
      arr.push(reasons[index + 1]);
      return arr;
    }, [])));
  }function calcDuration(category, data) {
    var duration = 0.00;
    data.forEach(function (d) {
      if (d.category === category) {
        duration += d.durationint;
      }
    });
    return duration;
  }function calcDurationForReason(category, data, p_reason) {
    var duration = 0.00;
    data.forEach(function (d) {
      if (d.category === category && d.parentreason === p_reason) {
        duration += d.durationint;
      }
    });
    return duration;
  }

  /**
   * Expecting a duration int value, return (string) hours and mins like 2:35 meaning 2 hours and 35 mins
   * if val is under 1 hour,  return (string) mins like 55-mins 
   * @param {*} val 
   */
  function toHrsAndMins(difference) {
    var daysDiff = Math.floor(difference / 1000 / 60 / 60 / 24);
    difference -= daysDiff * 1000 * 60 * 60 * 24;

    var hrsDiff = Math.floor(difference / 1000 / 60 / 60);
    difference -= hrsDiff * 1000 * 60 * 60;

    var minsDiff = Math.floor(difference / 1000 / 60);
    difference -= minsDiff * 1000 * 60;

    var secsDiff = Math.floor(difference / 1000);
    difference -= minsDiff * 1000;

    var timeToAdd = daysDiff * 24;
    hrsDiff = hrsDiff + timeToAdd;

    if (hrsDiff === 0 && minsDiff === 0) {
      return secsDiff + ' Seconds';
    } else if (hrsDiff === 0 && minsDiff !== 0) {
      return minsDiff + ' Minutes';
    }

    return hrsDiff + ' Hrs & ' + minsDiff + ' Mins';
  }function getTotalDuration(data) {
    var dur = 0.00;
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      if (d.durationint) {
        dur += d.durationint;
      }
    }
    return toHrsAndMins(dur);
  }
  _export('getTotalDuration', getTotalDuration);

  return {
    setters: [],
    execute: function () {}
  };
});
//# sourceMappingURL=data_processor.js.map
