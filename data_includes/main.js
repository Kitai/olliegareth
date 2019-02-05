PennController.ResetPrefix(null)

PennController.PreloadZip("http://files.lab.florianschwarz.net/ibexfiles/Ollie/Ollie_stims.zip")

// PennController.Debug()
    
// Sequence of trials: increase the counter, repeat block of Training trials three times, then one block of Test trials
PennController.Sequence(
    "consent" , "instructions" , 
    sepNWith( "check" , randomize("Training") , 4 ) , "check" , sepNWith( "check" , randomize("Training") , 4 ) , // Run each training trial twice
    "transition" ,
    randomize("Test") , // Run each test trial once (re-uses 12 training trials + 12 all-new test trials)
    "final"
    )



// The consent form screen
PennController( "consent" , newHtml("content", "consent.html").print() , newButton("consent", "I consent").print().wait() ).setOption("hideProgressBar",true)
    
// The home/instructions screen
PennController( "instructions" , newHtml("content", "instructions.html").print() , newButton("Proceed", "Proceed").print().wait() )

// Check that the pictures for the Training trials are preloaded, or proceed after 2min
PennController.CheckPreloaded("Training", 120000).label("instructions")
    
// The transition screen    
PennController( "transition" , newButton("Proceed", "Proceed to the test phase").print().wait() )

// The feedback screen    
PennController( "final" , 
    newHtml("content", "feedback.html")
        .settings.log()
        .print()
    ,
    newButton("submit", "Submit")
        .print()
        .wait( getHtml("content").test.complete().failure(
            getHtml("content").warn() , getButton("submit").settings.enable()
        ))
);

PennController.SendResults( "final" )

// The completion URL screen
PennController( "final" , newHtml("content", "completion.html").print() , newTimer("forever", 100).wait() )


// We'll store the image + correct answer for each series of 4 trials and use them in the attention-check trials
let checkPairs = []


// We will use this function to generate both training and test trials
//
var newTrial = (row,type) => PennController( type ,
    // Debug block (comment out when running actual experiment)
    //
    /*
    newVar( type + " count", 0)                     // Keep track of trials of this type
        .settings.global()
        .set( v=>v+1 )
    ,
    debug({                                         // The 'debug' function is defined in debug.js
        Trial: getVar( type + " count"),
        Type: type,
        Group: row.Group,
        Correct: (row["Ask for singular or plural?"]=="Singular"?row.Sg:row.Pl),
        ItemID: row.ItemID,
        SgPl: row["Ask for singular or plural?"],
        Reminder: "Grapes = sg; Fries = pl"
    })
    ,
    */
    //
    // end Debug block
    //
    defaultText
        .settings.center()
        .settings.size(200, "auto")                 // 200px wide text boxes under each 200px wide picture
    ,
    PennController.group = row.Group
    ,
    ///
    // Images + Sentences block
    //
    //newImage("one animal", row.SgPic)
    newImage("one animal", row.SgPicZip)
        .settings.size(200, 200)
    ,
    //newImage("two animals", row.PlPic)
    newImage("two animals", row.PlPicZip)
        .settings.size(200, 200)
    ,
    newText("sg text", "There is one " +            // Show the form if Training, or if asked about other
        (type=="Training"||row["Ask for singular or plural?"]=="Plural" ? row.Sg : "___" ) )
    ,
    newText("pl text", "There are two " +           // Show the form if Training, or if asked about other
        (type=="Training"||row["Ask for singular or plural?"]=="Singular" ? row.Pl : "___" ) )
    ,
    newCanvas("singular", 200, 300)
        .settings.add( 0,  20, getImage("one animal") )
        .settings.add( 0, 250, getText("sg text")     )
    ,
    newCanvas("plural", 200, 300)
        .settings.add( 0,  20, getImage("two animals") )
        .settings.add( 0, 250, getText("pl text")      )
    ,
    newCanvas("pictures", 800, 300)
        .settings.add( 100, 0, getCanvas("singular") )
        .settings.add( 500, 0, getCanvas("plural")   )
        .settings.cssContainer("border", "dashed 2px gray") // Border makes it salient even when hidden
        .print()
    ,
    newSelector("singular-plural")                          // Add singular and plural to a Selector group
        .settings.add( getCanvas("singular") , getCanvas("plural") )
        .settings.disable()                                 // Not really selectable
        .shuffle()                                          // Selector used to shuffle positions
    //
    // end Images + Sentences block
    //
    ,
    newText("blank spacing", " ")
        .print()
    ,
    //
    // Training-only block
    //
    type=="Training" ? [
        newText("instructions", "<p>Click on the pictures to proceed</p>")
            .print()
        ,
        newSelector("click on pictures")
            .settings.add(getCanvas("pictures"))
            .settings.frame("none")                         // Click on 'pictures' Canvas adds no frame
            .settings.once()
            .settings.log()                                 // Records when click happens
            .wait()
        ,
        getText("instructions")
            .remove()
        ,
        getText("sg text").remove(),                          // Mask the labels
        getText("pl text").remove(),
        newText("sentence", row["Ask for singular or plural?"]=="Singular"?"<p>There is one ___</p>":"<p>There are two ___</p>")
            .settings.css("font-size", "large")
            .print()
    ] : null
    //
    // end Training-only block
    //
    ,
    newSelector("choice")
        .settings.log()                                     // We want to save the final choice in the results file
        .settings.once()
        .settings.frame("2px dotted black")
    ,
    defaultText
        .settings.center()
        .settings.size(100, "auto")
    ,
    newCanvas("options", 400, 125)
        .settings.center()
        .settings.add(   0,  25, newText(row.opt1, row.opt1).settings.selector("choice") )  // Both label and text of element
        .settings.add(   0,  75, newText(row.opt2, row.opt2).settings.selector("choice") )  // Both label and text of element
        .settings.add( 100,  25, newText(row.opt3, row.opt3).settings.selector("choice") )  // Both label and text of element
        .settings.add( 100,  75, newText(row.opt4, row.opt4).settings.selector("choice") )  // Both label and text of element
        .settings.add( 200,  25, newText(row.opt5, row.opt5).settings.selector("choice") )  // Both label and text of element
        .settings.add( 200,  75, newText(row.opt6, row.opt6).settings.selector("choice") )  // Both label and text of element
        .settings.add( 300,  25, newText(row.opt7, row.opt7).settings.selector("choice") )  // Both label and text of element
        .settings.add( 300,  75, newText(row.opt8, row.opt8).settings.selector("choice") )  // Both label and text of element
        .settings.log()                                     // Records when the options become visible
        .print()
    ,
    getSelector("choice")
        .shuffle()
        .wait()
    ,
    getCanvas("pictures")
        .settings.visible()
    ,
    //
    // Training-only block
    //
    type=="Training" ? [
        getSelector("choice")              // FEEDBACK
            .test.selected( getText(row["Ask for singular or plural?"]=="Singular"?row.Sg:row.Pl) )
            .success(
                newText("good", "Well done").settings.color("green").settings.bold().print()
            )
            .failure(
                newText("bad", "No").settings.color("red").settings.bold().print()
            )
        ,
        newFunction( "check" , ()=>{       // STORE CORRECT ANSWER
            if (row["Ask for singular or plural?"]=="Singular")
                checkPairs.push( [ getImage("one animal") , getText(row.Sg) ] );
            else
                checkPairs.push( [ getImage("two animals") , getText(row.Pl) ] );
        }).call()
    ] : null
    //
    // end Training-only block
    //
    ,
    newText("continue", "Press any key to continue")
        .print()
    ,
    newKey("any", "")
        .settings.log()                                   // Records when keypress occurs
        .wait()
    ,
    // Blank 250ms delay 
    clear()
    ,
    newTimer("toNext", 250)
        .start()
        .wait()
)
.log("Participant", PennController.GetURLParameter("PROLIFIC_PID"))
.log("Type", type)
.log("About", row["Ask for singular or plural?"])
.log("Singular", row.Sg)
.log("Plural", row.Pl)
.log("Item", row.ItemID)
.log("Group", row.Group)
.log("Correct", row["Ask for singular or plural?"]=="Singular"?row.Sg:row.Pl )



// Training trials generated using spreadsheet's "Training & Test" rows
PennController.Template( PennController.GetTable("spreadsheet.csv").filter("Type","Training & Test"),
    row => newTrial( row , "Training" )
)

// Test trials generated using all of the spreadsheet's rows (no filtering)
PennController.Template( PennController.GetTable("spreadsheet.csv") ,
    row => newTrial( row, "Test" )
)



// An attention-check trial will be inserted every 4 training trials
// It shows the last 4 correct answers (stored in checkPairs) and randomly picks one to guess
PennController( "check" ,
    // Randomly shuffle the last four answers
    newFunction( "getImageWord" , ()=> {
        fisherYates( checkPairs );
    }).call()
    ,
    // Pointers to the Text elements
    newVar( "opt1" ).set( v=>checkPairs[0][1] ),
    newVar( "opt2" ).set( v=>checkPairs[1][1] ),
    newVar( "opt3" ).set( v=>checkPairs[2][1] ),
    newVar( "opt4" ).set( v=>checkPairs[3][1] )
    ,
    // Pointer to the Image element whose word is to guess
    newVar( "image" , "" ).set( v=>checkPairs[0][0] )
    ,
    // Show the Image element above the Text elements
    newCanvas( "the_image" , 200 , 200 )
        .settings.add( 0 , 0 , getVar("image") )
        .print()
    ,
    newCanvas( "options" , 200 , 150 )
        .settings.add(   0 ,  50 , getVar("opt1") )
        .settings.add( 100 ,  50 , getVar("opt2") )
        .settings.add(   0 , 100 , getVar("opt3") )
        .settings.add( 100 , 100 , getVar("opt4") )
        .print()
    ,   
    // Save the correct answer and the fillers
    newVar( "correct" ).settings.log("final").set( v=>checkPairs[0][1]._element.id ),
    newVar( "filler1" ).settings.log("final").set( v=>checkPairs[1][1]._element.id ),
    newVar( "filler2" ).settings.log("final").set( v=>checkPairs[2][1]._element.id ),
    newVar( "filler3" ).settings.log("final").set( v=>checkPairs[3][1]._element.id )
    ,
    // DEBUG
    //newFunction("bolden", ()=>checkPairs[0][1]._element.jQueryElement.css('font-weight','bold') ).call()
    //,
    // END DEBUG
    newSelector( "choice" )
        .settings.add( getVar("opt1") , getVar("opt2") , getVar("opt3") , getVar("opt4") )
        .settings.log()
        .shuffle()
        .wait()
    ,
    getSelector( "choice" )
        .test.selected( getVar("opt1") )
        .success( newText("success", "Yes, good job").settings.color("green").settings.center().print() )
        .failure( newText("failure", "Sorry that's incorrect").settings.color("red").settings.center().print() )
    ,
    newText("continue", "Press any key to continue")
        .settings.center()
        .print()
    ,
    newKey("any", "")
        .wait()
    ,
    // Empty the array for the next 4 trials        
    newFunction( "clearImageWord" , ()=> checkPairs = [] ).call()
)
.log("Participant", PennController.GetURLParameter("PROLIFIC_PID"))
