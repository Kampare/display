angular.element(document).ready(function () {
  angular.bootstrap(document, ['app']);
});

angular.module('app', [])
  .directive('history', history);

function history() {
  return {
    link: function (scope, element, attr) {
      d3.json('timeline.json', function (err, data) {
        // console.log(data);
        var meta = _.union.apply(null, data.map(function (event) {
          return [
            event.time.start.start,
            event.time.start.end,
            event.time.end.start,
            event.time.end.end
          ];
        })).sort(function (a, b) {
          return a - b;
        });

        var el = d3.select(element[0]);
        var axis = el.append('div');

        el.style('position', 'relative');

        axis.selectAll('div')
          .data(meta)
          .enter().append('div')
          .style('height', '60px')
          .text(function (d) {
            return moment.unix(d).utc().format('YYYY');
          });

        var tags = _.union.apply(null, data.map(function (event) {
          return event.tags;
        }));

        var scale = chroma.scale(['red', 'green', 'blue'])
          .mode('lab')
          .correctLightness(true)
          .domain([0, tags.length]);

        console.log(tags);

        //=========
        data = preprocess(data);

        var cols = multiSplit(data);
        cols.forEach(function (col, index) {
          drawCol(el.append('div'), col, 50 + index * 200, meta, scale, tags);
        });

      });
    }
  };
}

function drawCol(parent, data, offset, meta, scale, tags) {
  var block = parent.selectAll('div')
    .data(data)
    .enter().append('div').classed('block', true)
    .style('left', offset + 'px')
    .style('width', '200px')
    .style('top', function (d) {
      var index = meta.indexOf(d.time.start.start);
      return 60 * index + 'px';
    })
    .style('height', function (d) {
      var end = meta.indexOf(d.time.end.end);
      var start = meta.indexOf(d.time.start.start);
      return 60 * (end - start) + 'px';
    });

  block.append('div').classed('title', true)
    .text(function (d) {
      return d.tags[0] + ' | '
        + moment.unix(d.time.start.start).format('YYYY')
        + ', '
        + moment.unix(d.time.end.end).format('YYYY');
    });

  block.append('div').classed('text', true)
    .style('background', function (d) {
      return scale(tags.indexOf(d.tags[0])).alpha(0.2).css();
    })
    .text(function (d) {
      return d.description;
    });
}

function splitOverlaps(data) {
  return data.reduce(function (prev, current) {
    var start = moment.unix(current.time.start.start);
    var end = moment.unix(current.time.end.end);

    var rangeCurrent = moment.twix(start, end);

    if (_.find(prev.pure, function (el) {
      var start = moment.unix(el.time.start.start);
      var end = moment.unix(el.time.end.end);

      return rangeCurrent.overlaps(moment.twix(start, end));

    })) {
      prev.other.push(current);
      return prev;
    }

    prev.pure.push(current);
    return prev;

  }, {
    pure: [],
    other: []
  });
}

function multiSplit(data) {
  var results = [];

  var result = splitOverlaps(data);
  results.push(result.pure);

  while (result.other.length !== 0) {
    result = splitOverlaps(result.other);
    results.push(result.pure);
  }

  return results;
}

function preprocess(data) {
  return _.union.apply(null, _.toArray(_.groupBy(data, function (ev) {
    return ev.tags[0];
  }))).sort(function (a, b) {
    return (b.time.end.end - b.time.start.start) - (a.time.end.end - a.time.start.start);
  });
}
