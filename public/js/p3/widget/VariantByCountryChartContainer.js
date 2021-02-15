define([
  'dojo/_base/declare', 'dojo/_base/lang', 'dojo/_base/Deferred',
  'dojo/dom-construct', 'dojo/when', 'dojo/request',
  'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'dijit/form/Select',
  './D3VerticalBarChart', './D3StackedAreaChart'
], function (
  declare, lang, Deferred,
  domConstruct, when, xhr,
  BorderContainer, ContentPane, Select,
  VBarChart, StackedAreaChart
) {

  return declare([BorderContainer], {
    gutters: false,
    state: null,
    apiServer: window.App.dataServiceURL,
    visible: true,
    constructor: function () {
    },

    _setStateAttr: function (state) {
      this.inherited(arguments);
      if (!state || !state.search) {
        return;
      }

      // update bar chart
      when(this.processBarChartData(state), lang.hitch(this, function (data){
        if (data) {
          this.vbar_chart.render(data)
        }
      }));

      // update line chart
      when(this.processLineChartData(state), lang.hitch(this, function (result) {

        const rawData = result['rawData']
        const yearRange = new Set(rawData.map((el) => el.year))
        const grouped = {}
        rawData.forEach((el) => {
          if (grouped.hasOwnProperty(el.name)) {
            grouped[el.name].push(el)
          } else {
            grouped[el.name] = [el]
          }
        })
        Object.entries(grouped).forEach(([key, values]) => {
          if (values.length == yearRange.size) {
            // pass
          } else {
            const years = new Set( yearRange )
            values.forEach((el) => {
              years.delete(el.year)
            })
            years.forEach((el) => {
              // impute for the missing data point.
              rawData.push({name: key, n: 0, year: el})
            })
          }
        })
        rawData.sort((a,b) => {
          if (a.name === b.name) {
            if (a.year > b.year) {
              return 1
            } else {
              return -1
            }
          } else if (a.name > b.name) {
            return 1
          } else {
            return -1
          }
        })
        // console.log(rawData)
        if (rawData.length > 8) {
          this.line_chart.render(rawData, result['keyLabels'], result['keyIndexes']);
        } else {
          this.line_chart.hide();
        }
      }))
    },

    startup: function () {
      if (this._started) { return; }

      this._buildFilterPanel()

      this.bc_viewer = new ContentPane({
        region: 'left'
      });
      this.lc_viewer = new ContentPane({
        region: 'right'
      })

      this.addChild(this.bc_viewer);
      this.addChild(this.lc_viewer);

      this.vbar_chart = new VBarChart(this.bc_viewer.domNode, `variant_country_barchart`, {
        top_n: 18,
        title: 'AA Variant Prevalence',
        width: 700,
        margin: {
          top: 60,
          right: 50,
          bottom: 10,
          left: 80
        },
        tooltip: function(d) {
          return `AA Variant: ${d.label}<br/>Sequence Prevalence: ${d.value}`
        }
      });

      this.line_chart = new StackedAreaChart(this.lc_viewer.domNode, 'variant_country_linechart', {
        title: 'Top 10 AA variant prevalence by month',
        width: 800
      });

      this.inherited(arguments);
      this._started = true;
    },
    _buildFilterPanel: function() {

      this.filterPanel = new ContentPane({
        region: 'top',
        style: 'height: 20px'
      })
      this.addChild(this.filterPanel)

      xhr.post(window.App.dataServiceURL + '/spike_variant/', {
        data: 'ne(country,All)&facet((field,country),(mincount,1))&json(nl,map)&limit(1)',
        headers: {
          accept: 'application/solr+json',
          'content-type': 'application/rqlquery+x-www-form-urlencoded',
          'X-Requested-With': null,
          Authorization: (window.App.authorizationToken || '')
        },
        handleAs: 'json'
      }).then(lang.hitch(this, function(res) {

        var list = Object.keys(res.facet_counts.facet_fields.country).sort();

        var filterPanel = this.filterPanel;

        var select_country = new Select({
          name: 'selectCountry',
          options: [{label: '&nbsp;', value:''}].concat(list.map(function(c) { return {label: c, value: c}; })),
          style: 'width: 100px; margin: 5px 0'
        });
        select_country.attr('value', 'USA')

        select_country.on('change', lang.hitch(this, function(value) {
          if (value == '') return;
          this.set('state', lang.mixin(this.state, {
            search: 'eq(country,' + encodeURIComponent( `"${value}"` ) + ')'
          }))
        }))
        var label_select_country = domConstruct.create('label', {
          style: 'margin-left: 10px;',
          innerHTML: 'Please select a country: '
        });
        domConstruct.place(label_select_country, filterPanel.containerNode, 'last');
        domConstruct.place(select_country.domNode, filterPanel.containerNode, 'last');
      }))
    },

    postCreate: function () {
      this.inherited(arguments);
    },

    processBarChartData: function (state) {
      return xhr.post(window.App.dataServiceURL + '/spike_variant/', {
        data: state.search + '&ne(aa_variant,D614G)&eq(region,All)&eq(month,All)&select(aa_variant,prevalence)&sort(-prevalence)&limit(18)',
        headers: {
          accept: 'application/json',
          'content-type': 'application/rqlquery+x-www-form-urlencoded',
          'X-Requested-With': null,
          Authorization: (window.App.authorizationToken || '')
        },
        handleAs: 'json'
      }).then(function(data) {

        return data.map(function(el, i) {
          el.label = el.aa_variant;
          el.value = el.prevalence;
          el.rank = i;

          delete el.aa_variant;
          delete el.prevalence;

          return el;
        })
      })
    },

    processLineChartData: function (state) {
      const def = new Deferred();

      xhr.post(window.App.dataServiceURL + '/spike_variant/', {
        data: state.search + '&ne(month,All)&facet((field,month),(mincount,1))&limit(1)&json(nl,map)',
        headers: {
          accept: 'application/solr+json',
          'content-type': 'application/rqlquery+x-www-form-urlencoded',
          'X-Requested-With': null,
          Authorization: (window.App.authorizationToken || '')
        },
        handleAs: 'json'
      }).then(function(res1) {
        // console.log(res1)
        const latest_month = Object.keys(res1.facet_counts.facet_fields.month).sort((a, b) => b - a)[0]

        xhr.post(window.App.dataServiceURL + '/spike_variant/', {
          data: state.search + `&ne(aa_variant,D614G)&eq(region,All)&eq(month,${latest_month})&sort(-prevalence)&select(aa_variant,prevalence)&limit(10)`,
          headers: {
            accept: 'application/json',
            'content-type': 'application/rqlquery+x-www-form-urlencoded',
            'X-Requested-With': null,
            Authorization: (window.App.authorizationToken || '')
          },
          handleAs: 'json'
        }).then(function(res2) {
          if (res2.length == 0) return;
          // console.log(res2)
          const keyLabels = res2.map((el) => el.aa_variant);
          const subq = '&in(aa_variant,(' + res2.map((el) => encodeURIComponent(`${el.aa_variant}`)).join(',') + '))'

          xhr.post(window.App.dataServiceURL + '/spike_variant/', {
            data: state.search + subq + '&ne(aa_variant,D614G)&eq(region,All)&ne(month,All)&eq(month,*)&select(aa_variant,prevalence,month)&limit(25000)',
            headers: {
              accept: 'application/json',
              'content-type': 'application/rqlquery+x-www-form-urlencoded',
              'X-Requested-With': null,
              Authorization: (window.App.authorizationToken || '')
            },
            handleAs: 'json'
          }).then(function(data) {
            // console.log(data)
            var rawData = data.map(function(el) {
              el.name = el.aa_variant;
              el.n = el.prevalence;
              el.year = `${el.month.substring(0,4)}.${el.month.substring(4,6)}`;

              delete el.aa_variant;
              delete el.month;
              delete el.prevalence;
              delete el.lineage_count

              return el;
            })

            const result = {
              'keyLabels': keyLabels.sort(),
              'keyIndexes': Object.keys(keyLabels).map((el) => parseInt(el)),
              'rawData': rawData
            }
            def.resolve(result)
          })
        })
      })
      return def.promise;
    }
  });
});
