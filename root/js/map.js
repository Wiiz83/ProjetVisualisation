var width = 1200;
var height = 600;
var centered = null;
var currentyear = 2005;
var map;
var dataset;
var stats =[] ;
var isos = new Set();
// Chargement des données
d3.json("json/output.json", function (data) {
  dataset = data;
  dataset.forEach(e => {
    if (e.country_iso.includes("NF__")) {
      return;
    }
    isos.add(e.country_iso);
    if (!stats[e.iyear]) {
      stats[e.iyear]=[];
    }
    if (!stats[e.iyear][e.country_iso]) {
      stats[e.iyear][e.country_iso] = {
        n:0,
        success:0,
        nwound:0,
        nkill:0,
        iso : e.country_iso,
        fillKey: "UNKNOWN"
      }
    }
    stats[e.iyear][e.country_iso].n ++;
    stats[e.iyear][e.country_iso].success += parseInt(e.success);
    stats[e.iyear][e.country_iso].nwound += isNaN(parseInt(e.nwound)) ? 0 : parseInt(e.nwound) ;
    stats[e.iyear][e.country_iso].nkill += isNaN(parseInt(e.nkill)) ? 0 : parseInt(e.nkill) ;
    stats[e.iyear][e.country_iso].fillKey =getCountryColorFromKillNumber(stats[e.iyear][e.country_iso].nkill,stats[e.iyear][e.country_iso].n);
  });
  isos.forEach(iso => stats.forEach(yearstat =>  {
    if (!yearstat[iso]) {
      yearstat[iso] = {fillKey: "UNKNOWN", n:0};
    }
  }));
  map =  new Datamap({
    scope: "world",
    responsive: true,
    element: document.getElementById("map"),
    projection: "mercator",
    height: height,
    width: width,
    geographyConfig: {
      popupTemplate: countryTemplate
    },
    fills: {
      UNKNOWN: "#D8D8D8",
      LOW: "#ff9090",
      MEDIUM: "#ff0000",
      HIGH: "#a30000",
      SUCCESS: "#7A9A01",
      FAILURE: "#C91212",
      defaultFill: "#D8D8D8"
    },
    done: function (datamap) {
      datamap.updateChoropleth(stats[currentyear]);
      $("#slider").on("input change", function () {      
        currentyear = currentYearChanged();
        datamap.updateChoropleth(stats[currentyear]);
        updateMap(datamap, centered, currentyear, true);
      });
      datamap.svg.selectAll(".datamaps-subunit").on("click", function (geography) {
        datamap.updateChoropleth(stats[currentyear]);
        updateMap(datamap, geography, currentyear, false);
      });
    }
  }).legend();
});

$(document).ready(function () {
  currentyear = currentYearChanged();
});


function currentYearChanged() {
  var slider = document.getElementById("slider");
  var output = document.getElementById("output");
  output.innerHTML = slider.value; // Display the default slider value

  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function () {
    output.innerHTML = this.value;
  };

  // Filtrer les données avec l'année choisie
  return slider.value;
}

function getGlyphoAttackType(attacktype){
  var urlImg = "";
  switch (attacktype) {
    // Assassination
    case "1":
      urlImg = "/img/glypho/assassination.svg";
      break;
    // Armed Assault
    case "2":
      urlImg = "/img/glypho/armed.svg";
      break;
    // Bombing/Explosion
    case "3":
      urlImg = "/img/glypho/bombing.svg";
      break;
    // Hijacking = avion
    case "4":
      urlImg = "/img/glypho/highjack.svg";
      break;
    // Hostage Taking (Barricade Incident)
    case "5":
      urlImg = "/img/glypho/hostage.png";
      break;
    // Hostage Taking (Kidnapping)
    case "6":
      urlImg = "/img/glypho/kidnapping.svg";
      break;
    // Facility/Infrastructure Attack
    case "7":
      urlImg = "/img/glypho/building.svg";
      break;
    // Unarmed Assault
    case "8":
      urlImg = "/img/glypho/unarmed.svg";
      break;
    // Unknown
    case "9":
      urlImg = "/img/glypho/unknown.svg";
      break;
    default :
      urlImg = "/img/glypho/unknown.svg";
      break;
  }
  return urlImg;
}

function updateMap(datamap, geography, year, yearchange = false) {
  currentyear = year;
  if (!yearchange)
    if (centered == geography) {
      datamap.bubbles([]);
      zoomToWorld(datamap);
      centered = null;
    } else {
      centered = geography;
      datamap.bubbles(getCountryBubbles(datamap, geography, year), {
        popupTemplate: bubbleTemplate
      });
      zoomToCountry(datamap, geography);
    }
  if (yearchange)
    if (centered == null) {
      datamap.bubbles([]);
      zoomToWorld(datamap);
    } else {
      centered = geography;
      datamap.bubbles(getCountryBubbles(datamap, geography, year), {
        popupTemplate: bubbleTemplate
      });
      zoomToCountry(datamap, geography,year);
    }
}

function zoomToWorld(map) {
  map.svg
    .selectAll(".datamaps-subunits")
    .transition()
    .duration(750)
    .style("stroke-width", "1.5px")
    .attr("transform", "");
}

function zoomToCountry(map, geography,year) {
  var path = d3.geo.path().projection(map.projection);
  var bounds = path.bounds(geography),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = 0.9 / Math.max(dx / width, dy / height),
    translate = [width / 2 - scale * x, height / 2 - scale * y];

  map.svg
    .selectAll("g")
    .transition()
    .duration(400)
    .style("stroke-width", 1.5 / scale + "px")
    .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
}

function getCountryColorFromKillNumber(l,n) {
  if (l==null || l==undefined || n==0 ) {
    return"UNKNOWN";
  }
  else
  if (l <= 5) {
    return "LOW";
  } else if (l < 50) {
    return "MEDIUM";
  } else {
    return "HIGH";
  }
}



function countryTemplate(geography, data) {
  return (
    "<div class='hoverinfo'>Pays: " +
    geography.properties.name +
    ( (stats[currentyear][geography.id]!=null && stats[currentyear][geography.id].n >0) ? 
      " <br>Nombre d'attaques: " +
      stats[currentyear][geography.id].n +
      " <br>Réussies: " +
      stats[currentyear][geography.id].success +
      " <br>Tués: " +
      stats[currentyear][geography.id].nkill +
      " <br>Blessés: " +
      stats[currentyear][geography.id].nwound 
       : "<br>Aucune donnée")
       +
           "</div>"
  );
}

function getCountryBubbles(geo, data, year = currentyear) {
  function getColorFromKillNumber(l) {
    if (l <= 1) {
      return "LOW";
    } else if (l < 10) {
      return "MEDIUM";
    } else {
      return "HIGH";
    }
  }
  function getColorFromSuccess(l) {
    if (l == 1) {
      return "SUCCESS";
    } else if (l == 0) {
      return "FAILURE";
    } 
  }
  function getBorderFromKillAndWoundNumber(w, k) {
    var total = Number(w) + Number(k);
    if (total == 0) {
      return 0;
    } else if (total <= 20){
      return 1;
    } else if (total <= 40){
      return 2;
    } else if (total <= 80){
      return 3;
    } else if (total <= 160){
      return 4;
    } else {
      return 5;
    }
  }
  return dataset
    .filter(u => u.iyear == year && u.country_iso==data.id)
    .map(u => ({
      event: u,
      latitude: u.latitude,
      longitude: u.longitude,
      borderWidth: getBorderFromKillAndWoundNumber(u.nwound, u.nkill),
      borderOpacity: 1,
      radius: 0.8,
      fillOpacity: 0.8,
      fillKey: getColorFromSuccess(u.success),
      borderColor: "#000000"
    }));
}

function bubbleTemplate(geo, data) {
  function armedAttackTypes(event) {
    str = "";
    if (event.attacktype2_txt !== "") {
      str += ", " + event.attacktype2_txt;
    }
    if (event.attacktype3_txt !== "") {
      str += ", " + event.attacktype2_txt;
    }
    return str;
  }

  function weapons(event) {
    str = event.weaptype1_txt;
    if (event.weaptype2_txt !== "") {
      str += ", " + event.weaptype2_txt;
    }
    if (event.weaptype3_txt !== "") {
      str += ", " + event.weaptype3_txt;
    }
    if (event.weaptype4_txt !== "") {
      str += ", " + event.weaptype4_txt;
    }
    return str;
  }

  function target(event) {
    str = event.targtype1_txt;
    if (event.targtype2_txt !== "") {
      str += ", " + event.targtype2_txt;
    }
    if (event.targtype3_txt !== "") {
      str += ", " + event.targtype3_txt;
    }
    return str;
  }
  return (
    "<div class='hoverinfo'> " +
    "Succès: " + (data.event.success == 1 ? 'Oui' : 'Non') +

    "<br> Ville: " + data.event.city +
    "<br> Date: " + data.event.iday + '/' + data.event.imonth + '/' + data.event.iyear +
    "<br> Cibles(s): " + target(data.event) +

    "<br> Tués: " + data.event.nkill +
    ' <br> Blessés:  ' + (data.event.nwound == null ? 'N/D' : data.event.nwound) +
    "<br> Type(s) d'attaque: " +
    '<br> <img style="width:42px;height:42px;border:0;" src="'+ getGlyphoAttackType(data.event.attacktype1) +'">' +
    '<img style="width:42px;height:42px;border:0;" src="'+ getGlyphoAttackType(data.event.attacktype2) +'">' +
    '<img style="width:42px;height:42px;border:0;" src="'+ getGlyphoAttackType(data.event.attacktype3) +'">' +
    "<br> Type(s) d'armes: " + weapons(data.event) +
    "<br> Description: " + data.event.summary +
    "</div>"
  );
}