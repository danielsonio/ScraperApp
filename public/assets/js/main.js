
  var scrape_button = document.querySelector(".scrape-articles");

  scrape_button.addEventListener("click", function() {
    $.getJSON("/scrape");
    setTimeout(refreshPage, 1000);
    function refreshPage() {
      window.location.assign("/articles");
    }
  });


  $(document).on("click", "#comment", function() {

    var thisId = $(this).attr("data-id");
    $("#notes").empty();
    $("#title").empty();
    $("#prevNotes").empty();
      console.log("This ID: "+ thisId);
    $('#modal1').modal('open', {opacity: .1, inDuration: 600, startingTop: '4%'});
    $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
      // With that done, add the note information to the page
      .done(function(data) {
        console.log(data);
        console.log(data.note);
        // The title of the article
        $("#title").append("<h6 id='articletitle'>Join the conversation about <u>" + data.title + "</u></h6>");
        $("#notes").append("<textarea id='bodyinput' type='text' name='body' placeholder='Write your comment here'></textarea>");
        $("#notes").append("<input id='titleinput' type='text' name='title' placeholder='Post comment as...'></input>");
        // A textarea to add a new note body

        // A button to submit a new note, with the id of the article saved to it
        $("#notes").append("<div class='modal-footer'><button class='modal-action modal-close' data-id='" + data._id + "' id='savenote'>Post Comment</button><div>");


        if (data.note) {
          for (var i=0;i< data.note.length;i++) {
            $("#prevNotes").append("<p class='prevMsg'>" + data.note[i].body+"<span class='prevAuthor'> - " + data.note[i].title + "</span><p>"+"<hr />");
          }

        }

      });

  });


//Save a
  $(document).on("click", "#save", function() {
    event.preventDefault();
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");
    var card = $(this).closest(".remove-card");
    card.remove();
    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/articles/saved/" + thisId
    })
      // With that done
      .done(function(data) {
        // Log the response
        console.log(data);
        // Empty the notes section
      });

  });


  $(document).on("click", "#delete", function() {
    event.preventDefault();

    var thisId = $(this).attr("data-id");
    var card = $(this).closest(".remove-card");
    card.remove();
    console.log("This is the ID:" + thisId);
    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/articles/delete/" + thisId
    })
      // With that done
      .done(function(data) {
        // Log the response
        console.log(data);

      });

  });




  // When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  $('#modal1').modal('close');
  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

$(document).ready(function(){
  $('.tooltipped').tooltip({delay: 50});
});
