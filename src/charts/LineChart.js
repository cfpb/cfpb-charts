'use strict';

var d3 = require( 'd3' );
var CFPBChart = require( './CFPBChart' );
var getMonth = d3.utcFormat( '%b' );
var getYear =  d3.utcFormat( '%Y' );

LineChart.prototype = new CFPBChart();
LineChart.prototype.constructor = LineChart;

var lineSets = [],
    rawData = [],
    yAxisTickFactor,
    yAxisLabel,
    yAxisUnit,
    labels = {};
    
function sortByDateAscending( a, b ) {
    return a.x - b.x;
}

function findBestYTickFactor( ymin, ymax, factor ) {
  var multipliers = [ 2, 4, 5, 10, 15, 20, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000 ];
  var divisors = [ .5, .25, .2, .1, .05, .025, .01 ];
  var count = Math.ceil( ( ymax - ymin ) / factor );
  var newFactor = factor;
  var coeff = 1;

  if ( count > 9 ) {
    for (var x = 0; count > 9; x++ ) {
      coeff = multipliers[x];
      newFactor = factor * coeff;
      count = Math.ceil( ( ymax - ymin ) / newFactor );
    }

  } else if ( count < 5 ) {
    for (var x = 0; count < 5; x++ ) {
      coeff = divisors[x];
      newFactor = factor * coeff;
      count = Math.ceil( ( ymax - ymin ) / newFactor );
    }

  }

  return { 
    factor: newFactor,
    multiplier: coeff
  };
}

function LineChart( properties ) {
  this.selector = properties.selector;
  this.type = 'LineChart';
  this.data = {};
  rawData = properties.data;
  labels = properties.labels || {};
  lineSets = properties.lineSets || undefined;
  yAxisTickFactor = properties.yAxisTickFactor || 1;
  yAxisLabel = properties.labels.yAxisLabel || '';
  yAxisUnit = properties.labels.yAxisUnit || '';


  this.drawGraph = function( options ) {
    var data = this.data = this.getDataBySets();

    // variables from options
    var baseWidth = options.baseWidth || 200,
        baseHeight = options.baseHeight || 100,
        paddingDecimal = options.paddingDecimal || .1,
        margin = options.margin || {top: 20, right: 20, bottom: 20, left: 20};

    // calculated variables
    var width = baseWidth - margin.left - margin.right,
        height = baseHeight - margin.top - margin.bottom;

    // @todo: the x-axis is not always time intervals 
    var x = d3.scaleTime()
        .range( [ 0, width ] );

    var y = d3.scaleLinear()
        .range( [ height, 0 ] );

    var xmin = d3.min( rawData, function(d) { return d.x } ),
        xmax = d3.max( rawData, function(d) { return d.x; } ),
        ymin = d3.min( rawData, function(d) { return d.y } ),
        ymax = d3.max( rawData, function(d) { return d.y; } );

    // ymin should be 0 or less
    ymin = Math.min( ymin, 0 );

    // check if the yAxisTickFactor is ideal
    var tickFactor = findBestYTickFactor( ymin, ymax, yAxisTickFactor ).factor;
    var tickMultiplier = findBestYTickFactor( ymin, ymax, yAxisTickFactor ).multiplier;

    // ymax should be rounded up to the nearest yAxisTickFactor
    ymax = Math.ceil( ymax / tickFactor ) * tickFactor;

    x.domain( [ xmin, xmax ] );
    y.domain( [ ymin, ymax ] );

    var svg = d3.select( this.selector ) 
      .append( 'svg' )
        .attr( 'width', width + margin.left + margin.right)
        .attr( 'height', height + margin.top + margin.bottom)
      .append( 'g' )
        .attr( 'transform', 
              'translate( ' + margin.left + ',' + margin.top + ' )' );  

    // line function
    var line = d3.line()
          .x( function( d ) {
            return x( d.x );
          } )
          .y( function( d ) {
            return Math.floor( y( d.y ) );
          } );

    // Add the X Axis
    // Add the X Axis
    var xAxis = svg.append('g')
      .classed('axis axis__x', true)
      .attr('transform', 'translate(0,' + height + ')')
      .call( d3.axisBottom( x )
         .tickFormat( function( d ) { return ''; }  )
      );

    xAxis.selectAll( 'g' )
        .append( 'text' )
          .style( 'text-anchor', 'middle' )
          .attr( 'y', 25 )
          .text( function( d) { return getMonth( d ); } )
          .attr( 'width', width / 15 );

    xAxis.selectAll( 'g' )
        .append( 'text' )
          .style( 'text-anchor', 'middle' )
          .attr( 'y', 45 )
          .text( function( d ) { return getYear( d ); } )
          .attr( 'width', width / 15 );


    // Add the Y Axis
    svg.append( 'g' )
      .classed( 'axis axis__y', true )
      .call(
        d3.axisLeft( y )
          .ticks( Math.ceil( ( ymax - ymin ) / tickFactor ) )
          .tickSize( -width )
          .tickFormat(function( d ) {
            if ( tickMultiplier < 1 ) {
              var ticker = Math.floor( d / tickFactor * tickMultiplier * 10 ) / 10;
              return ticker.toString() + yAxisUnit; 
            }
            return Math.ceil( d / tickFactor * tickMultiplier ) + yAxisUnit;
          } )
        )
      .selectAll( 'text' )
        .attr( 'text-anchor', 'right' );

    // Iterate all lines:
    for ( var key in data ) {
      svg.append( 'path' )
          .attr( 'd', line( data[key] ) )
          .classed( lineSets[key].classes, true);      
    }

    // text label for the y axis
    svg.append( 'text' )             
      .classed( 'axis-label' , true)
      .attr( 'transform', 'rotate(-90)' )
      .attr( 'text-anchor', 'end' )
      .attr( 'x', -20 )
      .attr( 'y', -60 )
      .text( labels.yAxisLabel );

    // add the legend
    var legendPositions = [
      [ -70, -65 ],
      [ -70, -45 ], 
      [ width / 4, -55 ], 
      [ width / 4, -35 ]     
    ];
    for ( var key in lineSets ) {
      if ( lineSets[key].showInLegend !== false ) {
        var pos = legendPositions[0];
        svg.append( 'line' )
          .classed( lineSets[key].classes, true)
          .style( 'stroke-width', '10px' )
          .attr( 'x1', pos[0] )
          .attr( 'x2', pos[0] + 10 )
          .attr( 'y1', pos[1] )
          .attr( 'y2', pos[1] );

        svg.append( 'text' )
          .attr( 'text-anchor', 'start' )
          .attr( 'x', pos[0] + 20 )
          .attr( 'y', pos[1] + 5 )
          .attr( 'class', 'gray-text' )
          .text( lineSets[key].legendLabel || key );

        // Drop the first position so the next entry will
        // use the next position, etc
        legendPositions = legendPositions.splice( 1 );
      }
    }

    return {
      chart: svg,
      x: x,
      y: y
    };
  };

  this.getDataBySets = function() {
    var obj = {};
    // create an object property for each set
    for ( var key in lineSets ) {
      obj[key] = [];
    }

    for (var x = 0; x < rawData.length; x++ ) {
      obj[rawData[x].set].push( rawData[x] );
    }

    for ( var key in lineSets ) {
      obj[key] = obj[key].sort( sortByDateAscending );
    }

    return obj;
  }
}

module.exports = LineChart;
