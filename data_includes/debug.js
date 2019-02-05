var debug = info => {
    let keys = Object.keys(info);
    let height = keys.length * 20;
    let canvas = newCanvas("debug", 200, height);
    for (i = 0; i < keys.length; i++)
        canvas
            .settings.add(   0, 20 * i, newText("debug-"+i, keys[i]).settings.bold() )
            .settings.add( 100, 20 * i, newText("debug-"+i+"-value").settings.text( info[keys[i]] ).settings.italic() )
    return [
        newFunction("remove canvas", ()=>$(".PennController-debug-container").remove() )
            .call()
        ,
        canvas
            .print( $("#bod") )
            .settings.css({position: "absolute", top: 20, left: 20})
    ];
};