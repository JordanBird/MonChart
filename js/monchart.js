var MonChart = (function () {
    //Consts
    var header = 75;
    var margin = 20;
    var footer = 40;

    //Selectors
    var canvasSelector = "canvas";

    //Click event trackers
    var selected = {};
    var updatedThisMouseDown = {};

    //Cached calculated values during a render
    var currentPokemon = null;

    var keyHeight = 0;

    var totalXOffset = 0;
    var totalYOffset = 0;

    var graphicWidth = 0;
    var graphicHeight = 0;

    var options = null;

    var selectedColor = null;

    //Misc
    var cachedPokemon = [];

    var onPokemonChangedCallback;

    function init(existingPokemon, pokemonChangedCallback) {
        if (pokemonChangedCallback) {
            onPokemonChangedCallback = pokemonChangedCallback;
        }

        if (existingPokemon) {
            //TODO: Preload pokemon
        }

        $(canvasSelector).on('mousedown', function (e) {
            onMouseMove(e);

            $(canvasSelector).on('mousemove', onMouseMove);
        });

        $('body').on('mouseup', function (e) {
            $(canvasSelector).off('mousemove');
            updatedThisMouseDown = {};
            selectedColor = null;
        });
    }

    function onMouseMove(e) {
        var coords = getCursorPosition(e.target, e);

        if (coords.x < totalXOffset || coords.x > (graphicWidth - totalXOffset)) {
            return;
        }

        if (coords.y < totalYOffset || coords.y > totalYOffset + graphicHeight) {
            return;
        }

        var xWithExternal = (coords.x - totalXOffset);
        var yWithExternal = (coords.y - totalYOffset);

        var x = Math.floor(xWithExternal / options.imageWidth);
        var y = Math.floor(yWithExternal / options.imageHeight);

        var index = (y * options.perRow) + x;
        var indexByNumber = (currentPokemon[index].number).toString();

        if (updatedThisMouseDown[index]) {
            return;
        }

        if (selected[indexByNumber] != null) {
            selected[indexByNumber]++;
        }

        if (selected[indexByNumber] == null) {
            selected[indexByNumber] = 1;
        }

        if (selected[indexByNumber] > keyCount - 1) {
            selected[indexByNumber] = 0;
        }

        if (selectedColor == null) {
            selectedColor = selected[indexByNumber];
        }

        setSelectedColor(indexByNumber, selectedColor);

        pokemonChangedCallback();
    }

    function setSelectedColor(number, selectedColor) {
        updatedThisMouseDown[number] = true;

        selected[number.toString()] = selectedColor;

        if (transparentPresent()) {
            render();
        }
        else {
            var background = options.keys[selectedColor];

            var coords = getCoordinatesForNumber(number);
            renderBox(coords.x, coords.y, options.imageWidth, options.imageHeight, background.color, getImageURL(getPokemonByNumber(number)));
        }
    }

    function render(newOptions) {
        if (newOptions != null) {
            processNewOptions(newOptions);
        }

        getPokemon();

        preRenderSetupAndValidation();

        var canvas = $(canvasSelector)[0];
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        $(canvasSelector).css('border', options.borderColor + ' solid ' + (options.borderWidth / 2) + 'px ');

        //Background
        var my_gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        my_gradient.addColorStop(0, options.startGradient);
        my_gradient.addColorStop(1, options.endGradient);
        ctx.fillStyle = my_gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        //Text
        ctx.font = "30px Arial";
        ctx.fillStyle = options.titleColor;
        ctx.fillText(options.title, margin, 50);

        if (options.showKey) {
            renderKey(options);
        }

        var date = new Date();
        var createdDate = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
        ctx.font = "8px Arial";
        ctx.fillText("Created with MonChart (https://jordanbird.github.io/MonChart) on " + createdDate + ".", margin, graphicHeight - 22);
        ctx.fillText("MonChart created by Jordan Bird (jordanbird.co.uk).", margin, graphicHeight - 12);

        for (var i = 0; i < currentPokemon.length; i++) {
            var background = options.keys[0];
            if (selected[(currentPokemon[i].number).toString()] != null) {
                background = options.keys[selected[(currentPokemon[i].number).toString()]];
            }

            var coords = getCoordinatesForNumber(currentPokemon[i].number);

            renderBox(coords.x, coords.y, options.imageWidth, options.imageHeight, background.color, getImageURL(currentPokemon[i]));
        }
    }

    function renderKey() {
        var canvas = $(canvasSelector)[0];
        var ctx = canvas.getContext("2d");

        var xSpacing = Math.floor(options.perRow / options.keysPerRow);
        for (i = 0; i < options.keys.length; i++) {
            var x = i % options.keysPerRow;
            var y = (Math.floor(i / options.keysPerRow) * options.keySize) + (5 * Math.floor(i / options.keysPerRow));

            x = (margin + ((x * xSpacing) * options.imageWidth));
            y = header + y;

            renderBox(x, y, options.keySize, options.keySize, options.keys[i].color, null);

            ctx.font = "14px Arial";
            ctx.fillStyle = options.titleColor;
            ctx.fillText(options.keys[i].name, x + options.keySize + 5, y + (options.keySize / 2) + 4);
        }
    }

    function renderBox(x, y, width, height, color, src) {
        var canvas = $(canvasSelector)[0];
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);

        if (src) {
            loadAndDrawImage(x, y, width, height, src);
        }

        //Border
        ctx.beginPath();
        ctx.lineWidth = options.borderWidth;
        ctx.strokeStyle = options.borderColor;
        ctx.rect(x, y, width, height);
        ctx.stroke();
    }

    function getCursorPosition(canvas, event) {
        const rect = canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        return { x, y };
    }

    function preRenderSetupAndValidation() {
        //Calculate height for key
        if (options.showKey) {
            keyHeight = (Math.ceil(options.keys.length / parseInt(options.keysPerRow)) * (parseInt(options.keySize) + 5)) + 5;
        }
        else {
            keyHeight = 0;
        }

        //Set offsets for spacing
        totalXOffset = margin;
        totalYOffset = header + keyHeight;

        //Set selected Pokemon
        if (options.startingDexNumber == null) {
            options.startingDexNumber = 1;
        }

        if (options.endDexNumber == null || isNaN(options.endDexNumber)) {
            options.endDexNumber = cachedPokemon.length;
        }

        currentPokemon = cachedPokemon.slice(parseInt(options.startingDexNumber) - 1, parseInt(options.endDexNumber));

        //Set canvas size
        graphicWidth = (totalXOffset * 2) + options.perRow * options.imageWidth;
        graphicHeight = totalYOffset + footer + ((Math.ceil(currentPokemon.length / options.perRow)) * options.imageHeight);

        $(canvasSelector)[0].width = graphicWidth;
        $(canvasSelector)[0].height = graphicHeight;
        
        keyCount = options.keys.length;
    }

    function getPokemon() {
        var pokemon = Pokemon.getAll();

        cachedPokemon = [];

        for (var i = 0; i < pokemon.length; i++) {
            cachedPokemon.push({
                name: pokemon[i].name,
                slug: pokemon[i].slug,
                number: pokemon[i].number,
                source: pokemon[i].source,
            });
        }
    }

    function loadAndDrawImage(x, y, width, height, src) {
        var img = new Image();
        img.onload = function()
        {
            var canvas = $(canvasSelector)[0];
            var ctx = canvas.getContext("2d");

            ctx.drawImage(this, x, y, width, height);

            ctx.beginPath();
            ctx.lineWidth = options.borderWidth;
            ctx.strokeStyle = options.borderColor;
            ctx.rect(x, y, width, height);
            ctx.stroke();
        }
        img.src = src;
    }

    function getImageURL(pokemon) {
        var url = options.spriteSourceURL;

        if (options.shiny) {
            url = url.replace("normal", "shiny");
        }

        var source = "home";
        if (pokemon.source) {
            source = pokemon.source;
        }

        return url.replace("[NAME]", pokemon.name).replace("[NUMBER]", pokemon.number).replace("[SLUG]", pokemon.slug).replace("[SOURCE]", source);
    }

    function transparentPresent() {
        for (var i = 0; i < options.keys.length; i++) {
            if (options.keys[i].color.toLowerCase() == "transparent") {
                return true;
            }
        }

        return false;
    }

    function processNewOptions(newOptions) {
        options = newOptions;

        options.startingDexNumber = parseInt(options.startingDexNumber);

        if (options.endDexNumber == "") {
            options.endDexNumber = null;
        }
        else {
            options.endDexNumber = parseInt(options.endDexNumber);
        }

        options.keysPerRow = parseInt(options.keysPerRow);
        options.keySize = parseInt(options.keySize);
    }

    function pokemonChangedCallback() {
        if (!onPokemonChangedCallback) {
            return;
        }

        onPokemonChangedCallback(selected);
    }

    function setSelectedFromQueryString(queryString) {
        var pokemonBlocks = queryString.split(',');

        for (var i = 0; i < pokemonBlocks.length; i++) {
            if (pokemonBlocks[i] == "") {
                break;
            }

            if (pokemonBlocks[i].includes('-')) {
                var parts = pokemonBlocks[i].split('-');

                for (var j = parseInt(parts[0]); j <= parseInt(parts[1].split(':')[0]); j++) {
                    setSelectedColor(j, parseInt(parts[1].split(':')[1]));
                }
            }
            else {
                setSelectedColor(pokemonBlocks[i].split(':')[0], parseInt(pokemonBlocks[i].split(':')[1]));
            }
        }
    }

    function getCoordinatesForNumber(number) {
        var startNumber = 0;
        if (options.startingDexNumber) {
            startNumber = options.startingDexNumber;
        }

        var indexWithOffset = parseInt(number) - parseInt(startNumber);

        var x = totalXOffset + ((indexWithOffset % options.perRow) * options.imageWidth);
        var y = totalYOffset + (Math.floor(indexWithOffset / options.perRow)) * options.imageHeight;

        return { x: x, y: y};
    }

    function deleteKeyAtIndex(index) {
        for (var key in selected) {
            if (selected[key] == index) {
                selected[key] = 0;
            }

            if (selected[key] > index) {
                selected[key]--;
            }
          }
    }

    function getPokemonByNumber(number) {
        for (var i = 0; i < currentPokemon.length; i++) {
            if (currentPokemon[i].number == number) {
                return currentPokemon[i];
            }
        }

        return null;
    }

    return {
        init: init,
        render: render,
        setSelectedFromQueryString: setSelectedFromQueryString,
        deleteKeyAtIndex: deleteKeyAtIndex
    };
})();