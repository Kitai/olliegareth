function SepNWith(sep, main, n) {
    this.args = [sep,main];

    this.run = function(arrays) {
        assert(arrays.length == 2, "Wrong number of arguments (or bad argument) to SepNWith");
        var sep = arrays[0];
        var main = arrays[1];

        if (main.length <= 1)
            return main
        else {
            var newArray = [];
            var i;
            var m = 0;
            for (i = 0; i < main.length - 1; ++i) {
                newArray.push(main[i]);
                m++;
                if (m>=n) {
                    for (var j = 0; j < sep.length; ++j) {
                        newArray.push(sep[j]);
                    }
                    m = 0;
                }
            }
            newArray.push(main[i]);

            return newArray;
        }
    }
}
function sepNWith(sep, main, n) { return new SepNWith(sep, main, n); }