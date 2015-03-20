$(document).ready(function() {
    // Return the number of currently known values.
    // Any value above 4 most likely indicates an error, as the player
    // can only reveal four values.
    function known() {
        return $('.scratch text').length
    }


    // Get the sums and MGP payouts from the DOM.
    // This allows the values in the HTML file to function as the single
    // data store.
    function get_payouts_from_dom() {
        // Sanity check: Have we already cached this?
        // Getting this from the DOM is semi-expensive and it will not
        // change, so only bother to do it once, then save the result
        // to the function object.
        if (typeof arguments.callee.retval !== 'object') {
            // Get the information from the DOM.
            var payouts = {}
            $('.legend-mgp').each(function() {
                var sum = parseInt($(this).attr('data-sum'))
                var payout = parseInt($(this).text().replace(',', ''))
                payouts[sum] = payout
            })

            // Write the response to our cache, then return it.
            arguments.callee.retval = payouts
        }
        return arguments.callee.retval
    }


    // Convert the on-page values into a matrix, to be sent to the
    // `calculate()` function.
    //
    // Each choice (row, col, and diagonal) has a value equal to a
    // power of 2, and each cell has a value of the bitwise disjunction of
    // each choice including that cell.
    //
    // Returns a dictionary mapping current known digits (as keys) to cell
    // values (as values).
    function get_matrix_from_dom() {
        var matrix = {}
        $('.scratch text').each(function() {
            var value = parseInt($(this).text())
            var cell = parseInt($(this).parent('g').attr('data-cell'))
            matrix[value] = cell
        })
        return matrix
    }


    // Get a list of possible permutations.
    // This is a recursive function that takes a known list of variable
    // length (between 0 and 3 elements) as well as a list of available
    // digits and returns a list of all possible permutations.
    function get_permutations(known, available) {
        // Sanity check: If the known list includes 3 elements, we are done.
        if (known.length >= 3) {
            return [known]
        }

        // Since we have fewer than three elements, add one of the available
        // options to our known list, then call this function to get all
        // of those permutations.
        var answer = []
        for (var i = 0; i < available.length; i += 1) {
            answer = answer.concat(get_permutations(
                known.concat([available[i]]),
                // It might seem like this code should be:
                //   [].concat(available.slice(0, i), available.slice(i + 1))
                // 
                // The reason it is not is to avoid duplication; there is no
                // difference between the possibility of {1,2,3} and {1,3,2};
                // furthermoer, the average expected values will always be the
                // same because each equivalent possibility will be
                // represented the same number of times.
                //
                // Therefore, we save ourselves work and make debugging easier
                // by not processing equivalent possiblities more than once.
                [].concat(available.slice(i + 1))
            ))
        }

        // Done.
        return answer
    }


    // Given available permutations, determine the expected value of
    // all of them and return it.
    function get_expected_value(permutations) {
        var payouts = get_payouts_from_dom()

        // Get each possible payout available.
        var possibilities = []
        for (var i = 0; i < permutations.length; i += 1) {
            var permutation = permutations[i]
            var sum = 0
            for (var j = 0; j < permutation.length; j += 1) {
                sum += permutation[j]
            }
            possibilities.push(payouts[sum])
        }

        // Take the average of all of the possibilities.
        var answer = 0
        for (var i = 0; i < possibilities.length; i += 1) {
            answer += possibilities[i]
        }
        answer /= possibilities.length
        return Math.round(answer)
    }


    // This is where the magic happens.
    // This function reads out the current known elements on the board,
    // calculates the expected value for each of the eight possible choices,
    // and makes an appropriate recommendation.
    function calculate(matrix) {
        var choices = [1, 2, 4, 8, 16, 32, 64, 128]
        var matrix = get_matrix_from_dom()
        var payouts = get_payouts_from_dom()

        // Populate a list of values that are still available on the card.
        var available = []
        for (var i = 1; i <= 9; i += 1) {
            if (typeof matrix[i] === 'undefined') {
                available.push(i)
            }
        }

        // Iterate over each choice and determine the current expected
        // value for that choice.
        var expected_values = {}
        for (var choice = 1; choice <= 128; choice *= 2) {
            // What values are known to be included in this choice?
            var included = []
            $.each(matrix, function(digit, cell) {
                if (choice & cell) {
                    included.push(parseInt(digit))
                }
            })

            // What permutations are still available for this choice?
            var perms = get_permutations(included, available)

            // Get the expected value for the available permutations.
            var xv = get_expected_value(perms)

            // Write the expected value to the list of expected values.
            expected_values[choice] = xv
        }

        // Done; return the dictionary of expected values.
        return expected_values
    }


    // Function to create an SVG tag and return a jQuery element.
    // Necessary because using $('<circle />') or the like does not work.
    function $svg(tag) {
        return $(document.createElementNS('http://www.w3.org/2000/svg', tag))
    }


    // Clear a scratch of any text value and additional white circle.
    // Return true if a value was cleared, false for a no-op.
    function clear_scratch($scratch) {
        // Get rid of any circles that are not the scratch circle.
        while ($scratch.find('circle').length > 1) {
            $scratch.find('circle').eq(1).remove()
        }

        // Get rid of any text.
        if ($scratch.find('text').length > 0) {
            $scratch.find('text').remove()
            return true
        }

        return false
    }


    // Output expected values to the DOM.
    function output_expected_values(expected_values) {
        // What is the best expected value?
        var best = 0
        $.each(expected_values, function(choice, xv) {
            if (xv > best) {
                best = xv
            }
        })

        // Output the expected values
        $.each(expected_values, function(choice, xv) {
            // Find the choice element that needs to display this particular
            // expected value.
            var $choice = $('g.choice[data-bitval="' + choice + '"]')

            // Remove any expected value that may already be there.
            $choice.find('text').remove()

            // Make the best option brighter than the rest.
            var color = '#008000'
            if (best === xv) {
                color = '#00ff00'
            }

            // Display the new value.
            $svg('text').attr({'y': '50', 'text-anchor': 'middle',
                               'fill': color, 'font-size': '36' })
                        .text(xv.toLocaleString())
                        .appendTo($choice)
        })
    }


    // If a circle is clicked (or tapped), offer an opportunity to add
    // a number, or clear out a number if it is already there.
    $('.scratch').click(function() {
        var $scratch = $(this)

        // If there is already a value on this scratch area,
        // then remove it and be done.
        if (clear_scratch($scratch)) {
            var expected_values = calculate()
            output_expected_values(expected_values)
            return
        }

        // Sanity check: If the number of known values is >= 4, we are
        // unable to add another.
        if (known() >= 4) {
            return
        }

        // Okay, there is no value. Highlight the scratch being modified
        // and provide an opportunity for user input.
        $circle = $scratch.find('circle').eq(0)
        $svg('circle').attr({'cx': '150', 'cy': '150', 'r': '120',
                             'fill': 'rgba(255, 255, 255, 0.8)'})
                      .appendTo($scratch)

        // Focus the "standard in receiver" input element.
        $('#stdin').one('keyup', function() {
            var $stdin = $(this)
            var val = $stdin.val()

            // If this was a duplicate scratch value, clear the old one.
            $('.scratch text').each(function() {
                if ($(this).text() == val) {
                    clear_scratch($(this).parent('.scratch'))
                }
            })

            // Add the scratch value to the DOM.
            $svg('text').attr({'x': '150', 'y': '220', 'text-anchor': 'middle',
                               'fill': '#b00000', 'font-size': '200',
                               'font-family': 'Arial Narrow'})
                        .text(val)
                        .appendTo($scratch)
            $stdin.blur()

            // Perform the magic.
            var expected_values = calculate()
            output_expected_values(expected_values)
        })
        $('#stdin').val('').focus()
    })
});
