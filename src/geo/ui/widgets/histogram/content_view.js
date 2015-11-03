/**
 *  Default widget content view:
 *
 *
 */

cdb.geo.ui.Widget.Histogram.Content = cdb.geo.ui.Widget.Content.extend({

  defaults: {
    chartHeight: 48 + 20 + 4
  },

  events: {
    'click .js-clear': '_clear',
    'click .js-zoom': '_zoom'
  },

  _TEMPLATE: ' ' +
   '<div class="Widget-header">'+
      '<div class="Widget-title Widget-contentSpaced">'+
        '<h3 class="Widget-textBig"><%= title %></h3>'+
      '</div>'+
     '<dl class="Widget-info Widget-textSmaller Widget-textSmaller--upper">'+
       '<dt class="Widget-infoItem js-null">0 NULL ROWS</dt>'+
       '<dt class="Widget-infoItem js-min">0 MIN</dt>'+
       '<dt class="Widget-infoItem js-avg">0 AVG</dt>'+
       '<dt class="Widget-infoItem js-max">0 MAX</dt>'+
     '</dl>'+
   '</div>'+
    '<div class="Widget-content js-content">'+
   '<div class="Widget-chartTooltip js-tooltip"></div>'+
   '  <div class="Widget-filter Widget-contentSpaced js-filter is-hidden">'+
   '    <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--upper js-val"></p>'+
   '    <div class="Widget-filterButtons">'+
   '      <button class="Widget-link Widget-filterButton js-zoom">zoom</button>'+
   '      <button class="Widget-link Widget-filterButton js-clear">clear</button>'+
   '    </div>'+
   '  </div>'+
   '  <svg class="Widget-chart js-chart"></svg>',

  _PLACEHOLDER: ' ' +
    '<ul class="Widget-chart Widget-chart--fake">' +
      '<% for (var i = 0; i < 18; i++) { %>' +
      '<li class="Widget-chartItem Widget-chartItem--<%- _.sample(["small", "medium", "big"], 1)[0] %> Widget-chartItem--fake"></li>' +
      '<% } %>' +
    '</ul>',

  initialize: function() {
    this.dataModel = this.options.dataModel;
    this.viewModel = new cdb.core.Model();
    cdb.geo.ui.Widget.Content.prototype.initialize.call(this);
  },

  _initViews: function() {
    this.$('.js-chart').show();
    this._setupDimensions();
    this._generateCanvas();
    this._renderMainChart();
    this._renderMiniChart();
  },

  _initBinds: function() {
    this.dataModel.bind('change:data', this._onFirstLoad, this);
    this.add_related_model(this.dataModel);
  },

  _onFirstLoad: function() {
    this.render();
    this.dataModel.unbind('change:data', this._onFirstLoad, this);
    this.dataModel.bind('change:data', this._onChangeData, this);
  },

  _onChangeData: function() {
    var data = this._getData(true);
    this.chart.replaceData(data);
  },

  render: function() {

    this.clearSubViews();

    _.bindAll(this, '_onWindowResize');

    $(window).bind('resize', this._onWindowResize);

    var template = _.template(this._TEMPLATE);
    var data = this.dataModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    this.originalDataModel = _.clone(this.dataModel.getData());

    window.viewModel = this.viewModel; // TODO: remove
    window.dataModel = this.dataModel; // TODO: remove
    window.originalDataModel = this.originalDataModel; // TODO: remove
    window.filter = this.filter; // TODO: remove

    this.$el.html(
      template({
        title: this.dataModel.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    } else {
      this._setupBindings();
      this._initViews();
    }

    return this;
  },

  _onWindowResize: function() {
    this._setupDimensions();
    this.chart.resize(this.canvasWidth);
    this.miniChart.resize(this.canvasWidth);
  },

  _renderMainChart: function() {
    this.chart = new cdb.geo.ui.Widget.Histogram.Chart(({
      el: this.$('.js-chart'),
      y: 0,
      margin: { top: 4, right: 4, bottom: 20, left: 4 },
      handles: true,
      width: this.canvasWidth,
      height: this.defaults.chartHeight,
      data: this._getData()
    }));

    this.chart.bind('range_updated', this._onRangeUpdated, this);
    this.chart.bind('on_brush_end', this._onBrushEnd, this);
    this.chart.bind('hover', this._onValueHover, this);
    this.chart.render().show();

    window.chart = this.chart; // TODO: remove

    this._updateStats();
  },

  _renderMiniChart: function() {
    this.miniChart = new cdb.geo.ui.Widget.Histogram.Chart(({
      className: 'mini',
      el: this.$('.js-chart'),
      handles: false,
      width: this.canvasWidth,
      margin: { top: 0, right: 0, bottom: 0, left: 4 },
      y: 0,
      height: 20,
      data: this._getData()
    }));

    this.miniChart.bind('on_brush_end', this._onMiniRangeUpdated, this);
    this.miniChart.render().hide();
    window.miniChart = this.miniChart; // TODO: remove
  },

  _setupBindings: function() {
    this.viewModel.bind('change:zoomed', this._onChangeZoomed, this);
    this.viewModel.bind('change:zoom_enabled', this._onChangeZoomEnabled, this);
    this.viewModel.bind('change:filter_enabled', this._onChangeFilterEnabled, this);
    this.viewModel.bind('change:total', this._onChangeTotal, this);
    this.viewModel.bind('change:max',   this._onChangeMax, this);
    this.viewModel.bind('change:min',   this._onChangeMin, this);
    this.viewModel.bind('change:avg',   this._onChangeAvg, this);
  },

  _setupDimensions: function() {
    this.margin = { top: 0, right: 24, bottom: 0, left: 24 };

    this.canvasWidth  = this.$el.width() - this.margin.left - this.margin.right;
    this.canvasHeight = this.defaults.chartHeight - this.margin.top - this.margin.bottom;
  },

  _onValueHover: function(info) {
    var $tooltip = this.$(".js-tooltip");
    var value;

    if (info.index !== undefined) {

      if (this.chart.isLocked()) {
        value = originalDataModel.toJSON()[info.index].freq;
      } else {
        value = dataModel.getData().toJSON()[info.index].freq;
      }

      if (value !== undefined) {
        $tooltip.css({ top: info.top, left: info.left });
        $tooltip.text(value);
        $tooltip.fadeIn(70);
      } else {
        $tooltip.stop().fadeOut(50);
      }
    } else {
      $tooltip.stop().fadeOut(50);
    }
  },

  _onMiniRangeUpdated: function(loBarIndex, hiBarIndex) {
    this.viewModel.set({ lo_index: loBarIndex, hi_index: hiBarIndex });

    var data = this._getOriginalData();
    var min = data[loBarIndex].min;
    var max = data[hiBarIndex - 1].max;

    this.filter.setRange({ min: min, max: max });
    this._updateStats();
  },

  _onBrushEnd: function(loBarIndex, hiBarIndex) {
    this.chart.lock();

    if (this.viewModel.get('zoomed')) {
      this.viewModel.set({ filter_enabled: true, lo_index: loBarIndex, hi_index: hiBarIndex });
    } else {
      this.viewModel.set({ zoom_enabled: true, filter_enabled: true, lo_index: loBarIndex, hi_index: hiBarIndex });
    }

    var data = this._getData();
    var min = data[0].min;
    var max = data[data.length - 1].max;

    this.filter.setRange({ min: min, max: max });
  },

  _onRangeUpdated: function(loBarIndex, hiBarIndex) {
    if (this.viewModel.get('zoomed')) {
      this.viewModel.set({ zoom_enabled: false, lo_index: loBarIndex, hi_index: hiBarIndex });
    } else {
      this.viewModel.set({ lo_index: loBarIndex, hi_index: hiBarIndex });
    }

    this._updateStats();
  },

  _onChangeFilterEnabled: function() {
    this.$(".js-filter").toggleClass('is-hidden', !this.viewModel.get('filter_enabled'));
  },

  _onChangeZoomEnabled: function() {
    this.$(".js-zoom").toggleClass('is-hidden', !this.viewModel.get('zoom_enabled'));
  },

  _onChangeTotal: function() {
    this._animateValue('.js-val', 'total', ' SELECTED');
  },

  _onChangeMax: function() {
    this._animateValue('.js-max', 'max', 'MAX');
  },

  _onChangeMin: function() {
    this._animateValue('.js-min', 'min', 'MIN');
  },

  _onChangeAvg: function() {
    this._animateValue('.js-avg', 'avg', 'AVG');
  },

  _animateValue: function(className, what, unit) {
    var self = this;
    var format = d3.format("0,000");

    var from = this.viewModel.previous(what) || 0;
    var to = this.viewModel.get(what);

    $(className).prop('counter', from).stop().animate({ counter: to }, {
      duration: 500,
      easing: 'swing',
      step: function (i) {
        if (i === isNaN) {
          i = 0;
        }
        var v = Math.floor(i);
        $(this).text(format(v) + ' ' + unit);
      }
    });
  },

  _getOriginalData: function() {
    return this.originalDataModel.toJSON();
  },

  _getData: function(full) {
    var data = this.dataModel.getData().toJSON();

    if (full || (!this.viewModel.get('lo_index') && !this.viewModel.get('hi_index'))) {
      return data;
    }

    return data.slice(this.viewModel.get('lo_index'), this.viewModel.get('hi_index'));
  },

  _updateStats: function() {
    var data = this._getOriginalData();

    var loBarIndex = this.viewModel.get('lo_index') || 0;
    var hiBarIndex = this.viewModel.get('hi_index') ?  this.viewModel.get('hi_index') - 1 : data.length - 1;

    var sum = _.reduce(data.slice(loBarIndex, hiBarIndex + 1), function(memo, d) {
      return _.isEmpty(d) ? memo : d.freq + memo;
    }, 0);

    var avg = Math.round(d3.mean(data, function(d) { return _.isEmpty(d) ? 0 : d.freq; }));
    var min = data && data.length && data[loBarIndex].min;
    var max = data && data.length && data[hiBarIndex].max;

    this.viewModel.set({ total: sum, min: min, max: max, avg: avg });
  },

  _onChangeZoomed: function() {
    if (this.viewModel.get('zoomed')) {

      this.chart.unlock();
      this._expand();

      var data = this._getOriginalData();

      var loBarIndex = this.viewModel.get('lo_index');
      var hiBarIndex = this.viewModel.get('hi_index');

      var min = data[loBarIndex].min;
      var max = data[hiBarIndex - 1].max;

      this.miniChart.selectRange(loBarIndex, hiBarIndex);
      this.miniChart.show();

      this.filter.setRange({ min: min, max: max });
      this.chart.refresh();
    } else {
      this.viewModel.set({ zoom_enabled: false, filter_enabled: false, lo_index: null, hi_index: null });
      this.chart.replaceData(this.originalDataModel.toJSON());

      this._contract();

      this.chart.resetIndexes();

      this.filter.unsetRange();

      this.miniChart.hide();

      this.chart.removeSelection();
    }
  },

  _zoom: function() {
    this.viewModel.set({ zoomed: true, zoom_enabled: false });
  },

  _clear: function() {
    if (!this.viewModel.get('zoomed')) {
      this.viewModel.trigger('change:zoomed');
    } else {
      this.viewModel.set({ zoomed: false, zoom_enabled: true });
    }
  },

  _contract: function() {
    this.canvas
    .attr('height', this.canvasHeight);
    this.chart.contract();
  },

  _expand: function() {
    this.canvas
    .attr('height', this.canvasHeight + 60);
    this.miniChart.show();
    this.chart.expand();
  },

  _generateCanvas: function() {
    this.canvas = d3.select(this.$el.find('.js-chart')[0])
    .attr('width',  this.canvasWidth)
    .attr('height', this.canvasHeight);

    this.canvas
    .append('g')
    .attr('class', 'Canvas');
  },

  clean: function() {
    $(window).unbind('resize', this._onWindowResize);
    cdb.core.View.prototype.clean.call(this);
  }
});