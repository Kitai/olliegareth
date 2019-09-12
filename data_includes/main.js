PennController.ResetPrefix(null)

PennController.PreloadZip("https://files.lab.florianschwarz.net/ibexfiles/Ollie/Ollie_stims.zip")

// PennController.DebugOff()
    
// Sequence of trials: consent form, instructions, repeat twice the block of Training trials interspersed with check trials, then the Test trials and "final" block
PennController.Sequence(
    "consent" , "instructions" , 
    sepNWith( "check" , randomize("Training") , 4 ) , "check" , sepNWith( "check" , randomize("Training") , 4 ) , // Run each training trial twice
    "transition" ,
    randomize("Test") , // Run each test trial once (re-uses 12 training trials + 12 all-new test trials, see Template below)
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

// First thing of the "final" block: sending the results
PennController.SendResults( "final" )

// The completion URL screen
PennController( "final" , newHtml("content", "completion.html").print() , newTimer("forever", 100).wait() )


// We'll store the image + correct answer for each series of 4 trials and use them in the attention-check trials
let checkPairs = []


// This returns a block of PennController commands that increment the score and highlight its display
var addScore = ()=>[
    getVar("score").set(v=>v+1)    // Increment score
    ,
    getText("scoreDisplay")        // Update content and highlight using CSS
        .settings.text( getVar("score") )
        .settings.cssContainer({'transition': 'background-color 2000ms linear','background-color':'lightgreen'})
        .print( "right at 90vw" , "top at 10vh" )  // Top-right corner
    ,
    newTimer(200)                  // Start reverting to a transparent background 200ms after set to lightgreen
        .settings.callback( getText("scoreDisplay").settings.cssContainer("background-color", "transparent") )
        .start()
];
    

// This returns a block of PennController commands that ask to click on the "pictures" Canvas to continue (only for type==Training)
// We also set PennController.group here (see completion.html) because we have access to row.Group
var clickToProceedTraining = (row,type) => {
    PennController.group = row.Group-1;
    if (type=="Training")
        return [
            newText("instructions", "<p>Click on the pictures to proceed</p>")
                .print()
            ,
            newSelector("click on pictures")
                .settings.add(getCanvas("pictures"))            // One-option selector: we're just expecting a click on "pictures"
                .settings.frame("none")                         // Clicks on 'pictures' will add no frame
                .settings.once()                                // Disable the selector after click happens
                .settings.log()                                 // Records when click happens
                .wait()
            ,
            getText("instructions")
                .remove()
            ,                                    
            getText("sg text").settings.hidden(),               // Hide the descriptions
            getText("pl text").settings.hidden()
            ,
            (row["Ask for singular or plural?"]=="Singular"?    // Show (again) the desired description, but with ____ instead of word
                getText("sg text").settings.text("There is one ____").settings.visible()
                :
                getText("pl text").settings.text("There are two ____").settings.visible()
            )
        ];
    return [];
}


// This returns a block of PennController commands that shows the options and makes them clickable
// When type=="Training" it will add only the singular and plural words, increment score if correct choice, and give feeback
// When type=="Test" it will add eight words retreived from the table
var answerOptions = (row,type) => {
    if (type=="Training")
        return [
            getCanvas("options", 400, 125)
                .settings.add( "center at 33%", "center at 50%", newText(row.Sg, row.Sg).settings.selector("choice") )
                .settings.add( "center at 66%", "center at 50%", newText(row.Pl, row.Pl).settings.selector("choice") )
                .print()
            ,
            newText("good", "Well done!").settings.color("green").settings.bold(),  // Create the Text elements now
            newText("bad", "Try again").settings.color("red").settings.bold()       // but only print them after choice
            ,
            newVar("correct", true)    // We'll turn this to false if incorrect choice
            ,
            getSelector("choice")
                .shuffle()             // Randomize the options' positions on the screen
                .wait(
                    getSelector("choice")
                        .test.selected( getText(row["Ask for singular or plural?"]=="Singular"?row.Sg:row.Pl) )
                        .success( getText("bad").remove(),getText("good").print() )        // Positive feedback
                        .failure( getVar("correct").set( false ),getText("bad").print() )  // Set "correct" to false and negative feedback
                )
            ,
            getVar("correct").test.is(true)  // This is still true only if there was no incorrect choice
                .success( ...addScore() )    // see function above
            ,
            newFunction( "check" , ()=>{       // some pure javascript to store the correct image + its corresponding word (see check trials)
                    if (row["Ask for singular or plural?"]=="Singular")
                        checkPairs.push( [ getImage("one animal") , row.Sg ] );
                    else
                        checkPairs.push( [ getImage("two animals") , row.Pl ] );
                }).call()
        ];
    else if (type=="Test")
        return [
            getCanvas("options")  // add the eight words from the table
                .settings.add(   0,  25, newText(row.opt1, row.opt1).settings.selector("choice") )
                .settings.add(   0,  75, newText(row.opt2, row.opt2).settings.selector("choice") )
                .settings.add( 100,  25, newText(row.opt3, row.opt3).settings.selector("choice") )
                .settings.add( 100,  75, newText(row.opt4, row.opt4).settings.selector("choice") )
                .settings.add( 200,  25, newText(row.opt5, row.opt5).settings.selector("choice") )
                .settings.add( 200,  75, newText(row.opt6, row.opt6).settings.selector("choice") )
                .settings.add( 300,  25, newText(row.opt7, row.opt7).settings.selector("choice") )
                .settings.add( 300,  75, newText(row.opt8, row.opt8).settings.selector("choice") )
                .print()
            ,
            getSelector("choice")
                .shuffle()       // randomize the options' positions on the screen
                .wait()
        ];
}



// This function generates slightly different PennController trials depending on whether type=="Training" or "Test"
var newTrial = (row,type) => PennController( type ,
    // Blank 250ms delay
    newTimer("toNext", 250)
        .start()
        .wait()
    ,
    // This stores the score; initiated at 0 but then keeps its global value
    newVar("score", 0)
        .settings.global()
    ,
    [type=="Training"? 
        newText("scoreDisplay", "")  // Display the score only if type=="Training"
            .settings.before( newText("Score:&nbsp;").settings.bold() )
            .settings.text( getVar("score") )
            .print( "right at 90vw" , "top at 10vh" )
        :
        null  // Do nothing here if type=="Test"
    ]
    ,
    defaultText
        .settings.center()
        .settings.size(200, "auto")                 // 200px wide text boxes under each 200px wide picture
    ,
    ///
    // Images + Sentences block
    //
    newImage("one animal", row.SgPicZip)
        .settings.size(200, 200)
    ,
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
    newSelector("singular-plural")                          // Add singular and plural to a Selector group so we chan shuffle (see below)
        .settings.add( getCanvas("singular") , getCanvas("plural") )
        .settings.disable()                                 // Not really selectable (Selector only here for shuffling purposes)
        .shuffle()                                          // Selector used to shuffle positions
    //
    // end Images + Sentences block
    //
    ,
    newText("blank spacing", " ")
        .print()
    ,
    ...clickToProceedTraining(row,type)                     // See function above (will do nothing for Test trials)
    ,
    newSelector("choice")
        .settings.log()                                     // We want to save the final choice in the results file
        .settings.frame("2px dotted black")
    ,
    defaultText
        .settings.center()
        .settings.size(100, "auto")
    ,
    newCanvas("options", 400, 125)                          // We create the 'options' Canvas here...
        .settings.center()
        .settings.log()                                     // ... we'll want to record what option was chosen...
    ,
    ...answerOptions(row,type)                              // ... this is what takes care of filling the Canvas (and waiting for a selection to happen)
    ,
    newText("continue", "Press any key to continue")
        .print()
    ,
    newKey("any", "")
        .settings.log()                                   // Records when keypress occurs
        .wait()
    ,
    (type=="Training"?getText("scoreDisplay").remove():null)  // Make sure to remove the score display if in Training (safety measure)
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
    row => newTrial( row , /*type=*/"Training" )
)

// Test trials generated using all of the spreadsheet's rows (no filtering)
PennController.Template( PennController.GetTable("spreadsheet.csv") ,
    row => newTrial( row, /*type=*/"Test" )
)



// An attention-check trial will be inserted every 4 training trials
// It shows the last 4 correct answers (stored in checkPairs) and randomly picks one to guess
PennController( "check" ,
    // Blank 250ms delay
    newTimer("toNext", 250)
        .start()
        .wait()
    ,
    newVar("score", 0)      // Creating a "score" Var element for check trials...
        .settings.global()  // ...but fetch its value from the global Var element (see newTrial function above)
    ,
    newText("scoreDisplay", "")
        .settings.before( newText("Score:&nbsp;").settings.bold() )
        .settings.text( getVar("score") )
        .print( "right at 90vw" , "top at 10vh" )
    ,
    // Randomly shuffle the last four answers (checkPairs was filled by the four preceding Training trials---see answerOptions above)
    newFunction( "getImageWord" , ()=>fisherYates(checkPairs) ).call()
    ,
    // Fetch the words from checkPairs and keep a record of them
    newVar( "correct" ).set( v=>checkPairs[0][1] ).settings.log("final"),
    newVar( "filler1" ).set( v=>checkPairs[1][1] ).settings.log("final"),
    newVar( "filler2" ).set( v=>checkPairs[2][1] ).settings.log("final"),
    newVar( "filler3" ).set( v=>checkPairs[3][1] ).settings.log("final")
    ,
    // Create text elements and set them using the content of the Var elements above
    newText("correctOption", "").settings.text( getVar("correct") ).settings.center(),
    newText("fillerOption1", "").settings.text( getVar("filler1") ).settings.center(),
    newText("fillerOption2", "").settings.text( getVar("filler2") ).settings.center(),
    newText("fillerOption3", "").settings.text( getVar("filler3") ).settings.center()    
    ,
    // The first members of checkPairs directly point to Image elements ('getImage'---see answerOptions above)
    newVar( "image" , "" ).set( v=>checkPairs[0][0] )
    ,
    // Show the Image element above the Text elements
    newCanvas( "the_image" , 200 , 200 )
        .settings.add( 0 , 0 , getVar("image") )  // This will add an Image element because the Var points to an image element
        .print()
    ,
    newCanvas( "options" , 200 , 150 )
        .settings.add( "center at 30%" ,  "middle at 33%" , getText("correctOption") )
        .settings.add( "center at 70%" ,  "middle at 33%" , getText("fillerOption1") )
        .settings.add( "center at 30%" ,  "middle at 70%" , getText("fillerOption2") )
        .settings.add( "center at 70%" ,  "middle at 70%" , getText("fillerOption3") )
        .print()
    ,   
    newText("failure", "Sorry, please try again")  // Creating feedback Text here but not showing it (yet)
        .settings.color("red")
    ,
    newVar("right", true)  // This will be set to false if an incorrect selection happens
    ,   
    newSelector( "choice" )
        .settings.add( getText("correctOption") , getText("fillerOption1") , getText("fillerOption2") , getText("fillerOption3") )
        .settings.log()    // Record selection
        .shuffle()         // Randomize options' positions on the screen
        .wait(
            getSelector("choice").test.selected( getText("correctOption") )
                .failure( getVar("right").set(false),getText("failure").print() )  // Negative feedback + set "right" to false if incorrect choice
        )
    ,
    getVar("right").test.is(true)  // This is still true only if there was no incorrect choice
        .success( ...addScore() )  // See addScore above
    ,
    getText("scoreDisplay")        // Update the displayed score
        .settings.text( getVar("score") )
        .print( "right at 90vw" , "top at 10vh" )
    ,
    getText("failure")  // Remove any negative feedback message
        .remove()
    ,
    newText("success", "Yes, good job")  // Positive feedback
        .settings.color("green")
        .settings.center()
        .print()
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
    ,
    getText("scoreDisplay").remove()  // Safety measure
)
.log("Participant", PennController.GetURLParameter("PROLIFIC_PID"))