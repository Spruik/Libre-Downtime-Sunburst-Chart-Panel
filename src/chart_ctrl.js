import _ from 'lodash'
import $ from 'jquery'
import * as dp from './data_processor'
import * as pie from './pie_chart_option'
import echarts from './libs/echarts.min'
import { MetricsPanelCtrl } from 'app/plugins/sdk'
import * as utils from './utils'
import moment from 'moment'

const panelDefaults = {
  targets: [{}],
  pageSize: null,
  showHeader: true,
  styles: [],
  columns: [],
  fontSize: '100%'
}

export class ChartCtrl extends MetricsPanelCtrl {
  constructor ($scope, $injector, templateSrv, annotationsSrv, $sanitize, variableSrv) {
    super($scope, $injector)

    this.pageIndex = 0

    if (this.panel.styles === void 0) {
      this.panel.styles = this.panel.columns
      this.panel.columns = this.panel.fields
      delete this.panel.columns
      delete this.panel.fields
    }

    _.defaults(this.panel, panelDefaults)

    this.events.on('data-received', this.onDataReceived.bind(this))
    this.events.on('data-error', this.onDataError.bind(this))
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this))

    this.hasData = false
  }

  issueQueries (datasource) {
    this.pageIndex = 0

    if (this.panel.transform === 'annotations') {
      this.setTimeQueryStart()
      return this.annotationsSrv
        .getAnnotations({
          dashboard: this.dashboard,
          panel: this.panel,
          range: this.range
        })
        .then(annotations => {
          return { data: annotations }
        })
    }

    return super.issueQueries(datasource)
  }

  onDataError () {
    this.dataRaw = []
    this.render()
  }

  onDataReceived (dataList) {
    if (dataList.length === 0 || dataList === null || dataList === undefined) {
      this.hasData = false
      return
    } else {
      this.hasData = true
    }

    if (dataList[0].type !== 'table') {
      utils.alert('warning', 'Warning', 'To show the pie chart, please format data as a TABLE in the Metrics Setting')
      return
    }

    // dataList data is messy and with lots of unwanted data, so we need to filter out data that we want -
    let data = dp.restructuredData(dataList[0].columns, dataList[0].rows)

    if (dp.getCategories(data).length === 0) {
      this.hasData = false
      return
    }

    data = this.calcDurationInt(data)

    this.render(data)
  }

  calcDurationInt (data) {
    if (!data[0].durationint) {
      const _to = this.range.to.isAfter(moment()) ? moment() : this.range.to
      let _prevTime = null
      for (let i = data.length - 1; i >= 0; i--) {
        const item = data[i]
        if (i === data.length - 1) {
          // first one
          const diff = _to.diff(moment(item.time))
          const duration = moment.duration(diff)
          item.durationint = duration.valueOf()
        } else {
          const diff = _prevTime.diff(item.time)
          const duration = moment.duration(diff)
          item.durationint = duration.valueOf()
        }
        _prevTime = moment(item.time)
      }
    }
    return data
  }

  rendering () {
    this.render(this.globe_data)
  }

  link (scope, elem, attrs, ctrl) {
    const $panelContainer = elem.find('#reason-codes-sunburst-chart')[0]
    const myChart = echarts.init($panelContainer)

    function renderPanel (data) {
      if (!myChart || !data) { return }
      const option = pie.getOption(data)
      myChart.off('click')
      // after the json parsing, newOption's formatter will be removed due to it being a function, so assign it back
      myChart.setOption(option)
      setTimeout(() => {
        $('#reason-codes-sunburst-chart').height(ctrl.height - 51)
        myChart.resize()
        window.onresize = () => {
          myChart.resize()
        }
      }, 500)
      myChart.on('click', params => {
        if (params.data.type === 'Category') {
          const reasonsData = dp.getReasonsData(params.data.name, data)
          option.series[1].data = reasonsData
          myChart.setOption(option)
        }
      })
    }

    ctrl.events.on('panel-size-changed', () => {
      if (myChart) {
        const height = ctrl.height - 51
        if (height >= 280) {
          $('#reason-codes-sunburst-chart').height(height)
        }
        myChart.resize()
      }
    })

    ctrl.events.on('render', data => {
      renderPanel(data)
      ctrl.renderingCompleted()
    })
  }
}

ChartCtrl.templateUrl = 'public/plugins/libre-downtime-sunburst-chart-panel/partials/module.html'
