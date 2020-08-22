var options = getDefaultOptions();

function main() {
  getOptionsFromParamString();
  setFormFromOptions();

  init();
  MonChart.init(null, onPokemonChangedCallback);

  MonChart.render(options);
}

function init() {
  for (var key in options) {
    $('#' + key).on('change', onFormUpdate);
  }

  initKeys();

  window.onpopstate = function () {
    getOptionsFromParamString();
    setFormFromOptions();
    MonChart.render(options);
  }
}

function setFormFromOptions() {
  for (var key in options) {
    var formField = $('#' + key);

    if (formField == null || formField.length == 0) {
      continue;
    }

    if (formField[0].type == "checkbox") {
      $(formField).prop('checked', options[key]);
    }
    else {
      formField.val(options[key]);
    }
  }
}

function setOptionsFromForm() {
  for (var key in options) {
    var formField = $('#' + key);

    if (formField == null || formField.length == 0) {
      continue;
    }

    if (formField[0].type == "checkbox") {
      options[key] = $(formField).prop('checked');
    }
    else {
      options[key] = formField.val();
    }
  }

  options.keys = [];
  $('.keygroup').each(function () {
    options.keys.push({ name: $(this).children('.keyname').val(), color: $(this).children('.keycolor').val() });
  });

  return options;
}

function getDefaultOptions() {
  return {
    title: "MonChart",
    titleColor: "#000000",
    startGradient: "#9FDC95",
    endGradient: "#33C8A5",

    startingDexNumber: 1,
    endDexNumber: null,

    perRow: 20,
    imageWidth: 35,
    imageHeight: 35,

    borderWidth: 2,
    borderColor: "#000000",

    spriteSourceURL: "https://img.pokemondb.net/sprites/home/normal/[SLUG].png",

    showKey: false,
    keys: [
      { name: "Green", color: "#008000" },
      { name: "Orange", color: "#FFA500" },
      { name: "Red", color: "#FF0000" }
    ],
    keysPerRow: 2,
    keySize: 20
  };
}

function initKeys() {
  var keys = options.keys;

  $('.keyanchor').append('<div class="col-12"><label class="form-label">Keys</label></div>');

  for (var i = 0; i < keys.length; i++) {
    addKey(keys[i]);
  }

  $('.add-key').on('click', function () {
    addKey({ name: "New Key", color: "#"+((1<<24)*Math.random()|0).toString(16) });
  });
}

function addKey(existingKey) {
  var keyControls = $(
    '<div class="col-12 col-md-6">\
      <div class="form-group d-flex keygroup">\
        <input type="text" class="form-control keyname" />\
        <input type="color" class="form-control w-25 keycolor" />\
        <a href="#" class="btn btn-danger delete-key">X</a>\
      </div>\
    </div>\
    ');

    if (existingKey) {
      $(keyControls).find('.keyname').val(existingKey.name);
      $(keyControls).find('.keycolor').val(existingKey.color);
    }

  $('.keyanchor').append(keyControls);
  //onFormUpdate();

  $('.delete-key').off('click').on('click', function () {
    var index = 0;
    var deleteButtons = $('.delete-key');
    for (var i = 0; i < deleteButtons.length; i++) {
      if ($(deleteButtons[i]).siblings('.keycolor').val() == $(this).siblings('.keycolor').val() && $(deleteButtons[i]).siblings('.keyname').val() == $(this).siblings('.keyname').val()) {
        index = i;

        break;
      }
    }

    $(this).parent().parent().remove();
    MonChart.deleteKeyAtIndex(index);

    onFormUpdate();
  });

  $('.keyname').on('change', function () {
    onFormUpdate();
  });

  $('.keycolor').on('change', function () {
    onFormUpdate();
  });
}

function setQueryString() {
  var options = convertOptionsToParams();

  var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname.replace(/\/$/, "") + '?' + $.param(options);
  window.history.pushState({path:newurl},'',newurl);
}

function getOptionsFromParamString() {
  var params = $.deparam.querystring(true);
  
  if (params.t == null) {
    setFormFromOptions();
    
    return;
  }

  convertParamsToOptions(params);

  MonChart.render(options);
  
  if (options.selected) {
    MonChart.setSelectedFromQueryString(options.selected);
  }
}

function convertOptionsToParams() {
  return {
    t: options.title,
    tc: options.titleColor,
    sg: options.startGradient,
    eg: options.endGradient,

    sn: options.startingDexNumber,
    en: options.endDexNumber,

    p: options.perRow,
    w: options.imageWidth,
    h: options.imageHeight,

    bw: options.borderWidth,
    bc: options.borderColor,

    s: options.spriteSourceURL,

    hk: options.showKey,
    k: options.keys,
    kr: options.keysPerRow,
    ks: options.keySize,

    sl: options.selected
  };
}

function convertParamsToOptions(querystringOptions) {
  options.title = querystringOptions.t;
  options.titleColor = querystringOptions.tc;
  options.startGradient = querystringOptions.sg;
  options.endGradient = querystringOptions.eg;

  options.startingDexNumber = querystringOptions.sn;
  options.endDexNumber = querystringOptions.en;

  options.perRow = querystringOptions.p;
  options.imageWidth = querystringOptions.w;
  options.imageHeight = querystringOptions.h;

  options.borderWidth = querystringOptions.bw;
  options.borderColor = querystringOptions.bc;

  options.spriteSourceURL = querystringOptions.s;

  options.showKey = querystringOptions.hk;
  options.keys = querystringOptions.k;
  options.keysPerRow = querystringOptions.kr;
  options.keySize = querystringOptions.ks;

  options.selected = querystringOptions.sl;
}

function onPokemonChangedCallback(pokemon) {
  var keys = [];
  for (var key in pokemon) {
    keys.push(key);
  }

  keys = keys.sort();

  var output = "";
  var previousValue = "";
  for (var key in pokemon) {
    var previousKey = parseInt(key) - 1;

    var desiredAddition = key + ":" + pokemon[key] + ",";
    var sequenceTest = previousKey + ":" + pokemon[key] + ",";

    if (sequenceTest == previousValue) {
      output = output.replace(sequenceTest, previousKey + "-").replace("-" + previousKey + "-", "-");
    }

    output += desiredAddition;

    previousValue = desiredAddition;
  }

  options.selected = output;

  setQueryString();
}

function onFormUpdate() {
  setOptionsFromForm();
  setQueryString();

  MonChart.render(options);
}

$(document).ready(main);