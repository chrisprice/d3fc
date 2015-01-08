(function(d3, fc) {
    'use strict';

    var data = fc.utilities.dataGenerator()
        .seedDate(new Date(2014, 1, 1))
        .randomSeed('12345')
        .generate(50);

    var chart = d3.select('#bar'),
        chartLayout = fc.utilities.chartLayout();

    chart.call(chartLayout);

    // Calculate the scale domain
    var day = 8.64e7, // One day in milliseconds
        dateFrom = new Date(d3.min(data, function(d) { return d.date; }).getTime() - day),
        dateTo = new Date(d3.max(data, function(d) { return d.date; }).getTime() + day),
        priceFrom = d3.min(data, function(d) { return d.low; }),
        priceTo = d3.max(data, function(d) { return d.high; });

    // Create scale for x axis
    var dateScale = fc.scale.dateTime()
        .alignPixels(true)
        .domain([dateFrom, dateTo])
        .range([0, chartLayout.getPlotAreaWidth()])
        .nice();

    // Create scale for y axis
    var priceScale = fc.scale.linear()
        .alignPixels(true)
        .domain([priceFrom, priceTo])
        .range([chartLayout.getPlotAreaHeight(), 0])
        .nice();

    // Create the axes
    var dateAxis = d3.svg.axis()
        .scale(dateScale)
        .orient('bottom')
        .ticks(5);

    var priceAxis = d3.svg.axis()
        .scale(priceScale)
        .orient('right')
        .ticks(5);

    // Add the axes to the chart
    chartLayout.getAxisContainer('bottom').call(dateAxis);
    chartLayout.getAxisContainer('right').call(priceAxis);

    // Create the bar series
    var bar = fc.series.bar()
        .xScale(dateScale)
        .yScale(priceScale)
        .yValue(fc.utilities.valueAccessor('close'))
        .classForBar(function(d) {
            return 'bar-' + d.date.getDay();
        })
        .barWidth(9);

    // Add the primary bar series
    chartLayout.getPlotArea().append('g')
        .attr('class', 'series')
        .datum(data)
        .call(bar);

    // Create the Bollinger bands component
    var bollinger = fc.indicators.bollingerBands()
        .xScale(dateScale)
        .yScale(priceScale)
        .movingAverage(4)
        .standardDeviations(2);

    // Add it to the chart
    chartLayout.getPlotArea().append('g')
        .attr('class', 'bollinger-band')
        .datum(data)
        .call(bollinger);

    function pointSnap(xScale, yScale, xValue, yValue, data) {
        return function(xPixel, yPixel) {
            var x = xScale.invert(xPixel),
                y = yScale.invert(yPixel),
                nearest = null,
                minDiff = Number.MAX_VALUE;
            for (var i = 0, l = data.length; i < l; i++) {
                var d = data[i],
                    dx = x - xValue(d),
                    dy = y - yValue(d),
                    diff = Math.sqrt(dx * dx + dy * dy);

                if (diff < minDiff) {
                    minDiff = diff;
                    nearest = d;
                } else {
                    break;
                }
            }

            return {
                datum: nearest,
                x: nearest ? xScale(xValue(nearest)) : xPixel,
                y: nearest ? yScale(yValue(nearest)) : yPixel
            };
        };
    }

    function seriesPointSnap(series, data) {
        var xScale = series.xScale(),
            yScale = series.yScale(),
            xValue = series.xValue ? series.xValue() : function(d) { return d.date; },
            yValue = series.yValue();
        return pointSnap(xScale, yScale, xValue, yValue, data);
    }

    // Create a measure tool
    var measure = fc.tools.crosshairs()
        .xScale(dateScale)
        .yScale(priceScale)
        .snap(seriesPointSnap(bar, data))
        .on('trackingstart', function() { console.log('trackingstart', this, arguments); })
        .on('trackingmove', function() { console.log('trackingmove', this, arguments); })
        .on('freeze', function() { console.log('freeze', this, arguments); })
        .on('unfreeze', function() { console.log('unfreeze', this, arguments); })
        .on('trackingend', function() { console.log('trackingend', this, arguments); });

    // Add it to the chart
    chartLayout.getPlotArea()
        .call(measure);

})(d3, fc);
