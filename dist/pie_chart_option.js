'use strict';

System.register(['./data_processor'], function (_export, _context) {
  "use strict";

  var dp;
  function getOption(data) {

    var sunburst_data = dp.getSunburstData(data);
    var totalDuration = dp.getTotalDuration(data);

    return {
      tooltip: {
        trigger: 'item',
        formatter: function formatter(params) {
          if (params.data.name === undefined || params.data.name === null) {
            var _tooltip = '<p style="text-align:center;margin:0px;color:#999">Root</p>';
            _tooltip += '<div style="margin:5px 0px 5px 0px; width:100%; height:1px; background: #999"></div>';
            _tooltip += '<p style="margin:0px;color:' + params.color + '"><strong style="font-size:large">Total Frequency :</strong> &nbsp;' + params.data.value + '</p> ';
            _tooltip += '<p style="margin:0px;color:' + params.color + '"><strong style="font-size:large">Total Duration :</strong> &nbsp;' + totalDuration + '</p> ';
            return _tooltip;
          }
          var tooltip = '<p style="text-align:center;margin:0px;color:#999">' + params.data.info.type + ' - ' + params.data.name + '</p>';
          tooltip += '<div style="margin:5px 0px 5px 0px; width:100%; height:1px; background: #999"></div>';
          tooltip += '<p style="margin:0px;color:' + params.color + '"><strong style="font-size:large">Frequency :</strong> &nbsp;' + params.data.value + '</p> ';
          tooltip += '<p style="margin:0px;color:' + params.color + '"><strong style="font-size:large">Duration :</strong> &nbsp;' + params.data.info.duration + '</p> ';
          return tooltip;
        },
        backgroundColor: '#eee',
        borderColor: '#aaa',
        borderWidth: 1,
        borderRadius: 4
      },
      series: {
        type: 'sunburst',
        // highlightPolicy: 'ancestor',
        data: sunburst_data,
        radius: [30, '100%'],
        label: {
          rotate: 'radial-'
        }
      }
    };
  }

  _export('getOption', getOption);

  return {
    setters: [function (_data_processor) {
      dp = _data_processor;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=pie_chart_option.js.map
