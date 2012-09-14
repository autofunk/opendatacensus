var dcjson="data/datacatalogs.geocoded.json";


var censusKeys = [
  'Timestamp',
  'Census Country',
  'Dataset',
  'Data Availability [Does the data exist?]',
  'Data Availability [Is it in digital form?]',
  'Data Availability [Is it machine readable? (E.g. spreadsheet not PDF)]',
  'Data Availability [Available in bulk?  (Can you get the whole dataset easily)]',
  'Data Availability [Is it publicly available, free of charge?]',
  'Data Availability [Is it openly licensed? (as per the http://OpenDefinition.org/)]',
  'Data Availability [Is it up to date?]',
  'Location of Data Online',
  'Date it became available',
  'Details and comments',
  'Your name (optional)',
  'Link for you (optional)'
  ];

function gdocsMunge(str) {
  return str.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase();
}



function init() {
  $.getJSON(dcjson,function(data) {
    var dataset=new recline.Model.Dataset({records: data});
    dataset.query({size: dataset.recordCount}).done(function () {
      $("div.loading").hide();
      var summary=getDcSummary(dataset);
      showDcSummary(summary);
      });
    });
  var url = 'https://docs.google.com/spreadsheet/ccc?key=0Aon3JiuouxLUdEVnbG5pUFlyUzBpVkFXbXJ2WWpGTUE#gid=0'; 
  var dataset = new recline.Model.Dataset({
      id: 'opendatacensus',
      url: url,
      backend: 'GDocs'
   });
  dataset.fetch().done(function() {
    dataset.query({size: dataset.recordCount}).done(function() {
     var data=dataset.records.toJSON();
     var summary = getSummaryData(data);
     summaryTop(summary);   
    });
  });
  
  $.getJSON("data/logd.json", function(data) {
    var nd=data
    nd.sort(function(a,b) {return b.datasets-a.datasets});
    var series=[];
    _.each(nd.slice(0,5), function(r) {
      series.push({label:r.name.replace("_"," "), value:r.datasets})
    });
    barplots($("#rank-datasets"),series)
    nd.sort(function(a,b) {return b.catalogs-a.catalogs});
    var series=[];
    _.each(nd.slice(0,5), function(r) {
      series.push({label:r.name.replace("_"," "), value:r.catalogs})
    });
    barplots($("#rank-catalogs"),series)

  });
  
  }
 
function summaryTop(summary) {
  $("#nc").html(summary.countries.length);
  $("#nr").html(summary.total);
  var nd=0;
  _.each(_.keys(summary.datasets), function (key) {
    var ds=summary.datasets[key]
    _.each(_.keys(ds), function(country) {
      if (ds[country].count>0) {
        nd++;
        }
        });
    });
  var free=0;
  _.each(_.keys(summary.datasets), function (key) {
    var ds=summary.datasets[key]
    _.each(_.keys(ds), function(country) {
      if (ds[country].count>0) {
        var r=get_latest_response(ds[country].responses)
        if (scoreOpenness(r)==6) {
          free++;
          }
          }

        });
    });
  $("#nds").html(nd);
  $("#nok").html(free);
  };

function scoreOpenness(response) {
  var score=0;
  _.each(censusKeys.slice(3,9), function(key) {
    if (response[gdocsMunge(key)]=='Yes') {
      score++;
      }})
  return score;    
  }

function getSummaryData(data) {
  var datasets = {};
  var countryNames = _.uniq(_.map(data, function(r) {
    return r['censuscountry'];
  }));
  function makeCountryDict () {
    var _out = {};
    _.each(countryNames, function(ds) {
      _out[ds] = {
        count: 0,
        responses: [],
        isopen: false
      };
    });
    return _out;
  }
  _.each(data, function(row) {
      datasets[row['dataset']] = makeCountryDict();
  });
  _.each(data, function(row) {
    var c = row['censuscountry'];
    var d = row['dataset'];
    count = datasets[d][c].count || 0;
    datasets[d][c]['count'] = count + 1;
    datasets[d][c].responses.push(row);
  });
  
  var out = {
      'datasets': datasets,
      'countries': countryNames,
      'total': data.length
      };
  return out;
}

function getDcSummary(data) {
  var summary={};
  summary.total=data.recordCount;
  summary.active=0;
  summary.local=0;
  summary.regional=0;
  summary.national=0;
  _.each(data.records.toJSON(), function(r) {
    if ($.inArray("level.local",r.tags)>=0) {
      summary.local++;
      }
    if ($.inArray("level.regional",r.tags)>=0) {
      summary.regional++;
      }
    if ($.inArray("level.national",r.tags)>=0) {
      summary.national++;
      }
    if (r.state=="active") {
      summary.active++;
    }
  });
  return summary;
};

function get_latest_response(responses) {
  ret=responses[0]
  _.each(responses,function(response) {
      if (ret.timestamp < response.timestamp) {
        ret=response;
        }
      }
      )
  return ret;
  }

function showDcSummary(summary) {
  $("#tds").html(summary.total);
  $("#localds").html(summary.local);
  $("#regionalds").html(summary.regional);
  $("#nationalds").html(summary.national);
  }

$(document).ready(init);  


  

















