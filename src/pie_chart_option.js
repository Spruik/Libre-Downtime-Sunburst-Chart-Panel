import * as dp from './data_processor'

export function getOption (data) {
  const sunburst_data = dp.getSunburstData(data)
  const totalDuration = dp.getTotalDuration(data)

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.data.name === undefined || params.data.name === null) {
          let tooltip = '<p style="text-align:center;margin:0px;color:#999">Root</p>'
          tooltip += '<div style="margin:5px 0px 5px 0px; width:100%; height:1px; background: #999"></div>'
          tooltip += '<p style="margin:0px;color:' + params.color + '"><strong style="font-size:large">Total Frequency :</strong> &nbsp;' + params.data.value + '</p> '
          tooltip += '<p style="margin:0px;color:' + params.color + '"><strong style="font-size:large">Total Duration :</strong> &nbsp;' + totalDuration + '</p> '
          return tooltip
        }
        let tooltip = '<p style="text-align:center;margin:0px;color:#999">' + params.data.info.type + ' - ' + params.data.name + '</p>'
        tooltip += '<div style="margin:5px 0px 5px 0px; width:100%; height:1px; background: #999"></div>'
        tooltip += '<p style="margin:0px;color:' + params.color + '"><strong style="font-size:large">Frequency :</strong> &nbsp;' + params.data.value + '</p> '
        tooltip += '<p style="margin:0px;color:' + params.color + '"><strong style="font-size:large">Duration :</strong> &nbsp;' + params.data.info.duration + '</p> '
        return tooltip
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
  }
}
