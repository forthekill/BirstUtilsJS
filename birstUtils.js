/*  BIRST UTILITY FUNCTIONS */

var birstUtils = {
  // FUNCTION: escapeParam
  // Replace single quotes in a string
  escapeParam : function (str){
    str = str.replace(/'/g, "\\'");
    return str;
  },
  // FUNCTION: indexOf
  // Lookup a particular object key in an array of objects
  indexOf : function (key, array){
    for (var i = 0; i < array.length; i++) {
        if (key === array[i].key) {
            return i; // returns index of matching object
        }
    }
    return -1; // no match found
  },
  // FUNCTION: textBetween
  // Returns the text from a string between the specified start and end characters
  textBetween : function (textString, startChar, endChar){
    var startPos = textString.indexOf(startChar) + 1;
    var endPos = textString.indexOf(endChar,startPos);
    return textString.substring(startPos,endPos);
  },
  // FUNCTION: getName
  // Returns the plain text name of either a measure, dimension, or saved expression
  getName : function (nameString){
    if (nameString.indexOf("Saved") >= 0){
      // it's a saved expression
      // get text between ' and '
      return textBetween(nameString,"'","'");
    }else{
      // it's a dimension or measures
      if (nameString.indexOf(":") >= 0){
        // it's a measure
        // check for second :
        var firstPos = nameString.indexOf(":");
        var secondPos = nameString.indexOf(":",firstPos + 1);
        if (secondPos >= 0){
          // second :
          return textBetween(nameString.substr(firstPos + 1),":","]");
        }
        // get text between : and ]
        return textBetween(nameString,":","]");
      }else{
        // it's a dimension
        // get text between . and ]
        return textBetween(nameString,".","]");
      }
    }
  },
  // FUNCTION: prepareFilters
  // Validates and prepares the filter state
  prepareFilters : function(state, apply) {
    if (apply == null) {
        console.debug("apply is null. All filters valid.");
        return state;
    }

    // apply is empty
    if (apply.length == 0) {
        console.debug("apply is empty. All filters valid.");
        return state;
    }

    var idx = indexOf("filters", apply)
    if (idx >= 0) {
        var value = apply[idx].value;
        console.debug("value:" + value);
    }

    switch (value) {
        case "ALL":
            console.log("apply is ALL. All filters valid.");
            return state;
            break;

        case "NONE":
            console.debug("apply is NONE. No filters valid.");
            state.length = 0;
            return state;
            break;

        case "VALID":
            for (var f = 0; f < state.length; f++) {

                console.debug("STATE[" + f + "]");
                console.debug(state[f]);
                console.debug(state[f].key);

                var test = indexOf(state[f].key, apply);
                console.debug("test: " + test);

                if (test < 0) {
                    // remove filter from state
                    state.splice(f, 1);
                    console.debug("Filter not listed as VALID. Removed.");
                }
            }
            return state;
            break;

        case "INVALID":
            for (var f = 0; f < state.length; f++) {

                console.debug(state[f]);
                console.debug(state[f].key);

                var test = indexOf(state[f].key, apply);

                if (test >= 0) {
                    // remove filter from state
                    state.splice(f, 1);
                    console.debug("Filter listed as INVALID. Removed.");
                }
            }
            return state;
            break;

        default:
            // apply is misconfigured, then ALL assumed
            console.debug("apply was misconfigured, leaving filter state as is");
            return state;
    }
  },
  // FUNCTION: addDefaultFilters
  // Adds default filters to the filter state
  addDefaultFilters : function(state, defaults) {
    for (var d = 0; d < defaults.length; d++) {

        var filt = defaults[d];

        // If filter does NOT exist in the current filter state
        if (indexOf(filt.key, state) < 0) {
            // Add filter to state
            console.debug("F" + d + ": Default filter not present. Add to filter state.")
            state.push(filt);
        } else {
            console.debug("F" + d + ": Default filter already exists. Ignore default filter.")
        }
    }
    return state;
  },
  // FUNCTION: createWhere
  // Creates WHERE clause based on filter state
  createWhere : function (state) {
    var clause = "";

    // Check to see if there are current filters
    if (state.length != 0) {
        clause += " WHERE ("; // Start WHERE

        // Get the filters from the filter state array and append them to the base query
        for (var i = 0; i < state.length; i++) {

            var filter = state[i];

            // Split multiple filter values into an array of filter values
            var values = String(filter.value).split(",");

            // IF NOT the first or only param, add an AND
            if (i != 0) {
                clause += " AND ";
            }

            // Start Filter
            clause += "(";

            // Loop through filter value array and append filter params to the query
            for (var q = 0; q < values.length; q++) {

                // For each filter value, set the key and the value
                if (q === values.length - 1) {
                    // Single or final filter value
                    clause += "[" + filter.key + "]" + filter.operator + "'" + escapeParam(values[q]) + "'";
                } else {
                    // OR for multiple filter values
                    clause += "[" + filter.key + "]" + filter.operator + "'" + escapeParam(values[q]) + "' OR ";
                }

            }

            // Close Filter
            clause += ")";
        }

        // Close WHERE
        clause += ")";

        console.log("Clause: " + clause);

    } else {
        console.debug("Filter state empty. No clause created.")
    }

    // Return the finalized WHERE clause
    return clause;
  },
  // FUNCTION: runQuery
  // Sets filters, creates and runs the query
  runQuery : function() {
    console.log("runQuery");

    // Test for applyFilters definition
    if (applyFilters == null) {
      console.log("Valid filters not set!");
    }

    // Test for defaultFilters definition
    if (defaultFilters == null) {
      console.log("Default filters not set!");
    }

    // Prepare filter state for WHERE clause construction
    var state = prepareFilters(filterState, applyFilters);
    state = addDefaultFilters(state, defaultFilters);

    // Create WHERE clause
    var clause = createWhere(state);

    // Append final query params
    var query = bql + clause + bqlSuffix;

    // Verify the final query
    console.log(query);

    // Execute the query
    BirstConfig.getData(query);
  }
};
