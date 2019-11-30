$(document).ready(function() {
  var articleContainer = $(".article-container");
  $(document).on("click", ".btn.delete", deleteArticle);
  $(document).on("click", ".btn.notes", processNotes);
  $(document).on("click", ".btn.save", saveNotes);
  $(document).on("click", ".btn.note-delete", deleteNotes);
  $(".clear").on("click", wipeArticles);

  function initPage() {
    $.get("/api/headlines?saved=true").then(function(data) {
      articleContainer.empty();
      if (data && data.length) {
        scrapeArticles(data);
      } else {
        makeEmpty();
      }
    });
  }

  function makeList(data) {
    var notesToRender = [];
    var currentNote;
    if (!data.notes.length) {
      currentNote = $("<li class='list-group-item'>No notes.</li>");
      notesToRender.push(currentNote);
    } else {
      for (var i = 0; i < data.notes.length; i++) {
        currentNote = $("<li class='list-group-item note'>")
          .text(data.notes[i].noteText)
          .append($("<button class='btn btn-success note-delete'>x</button>"));
        currentNote.children("button").data("_id", data.notes[i]._id);
        notesToRender.push(currentNote);
      }
    }
    $(".note-container").append(notesToRender);
  }
  
  function scrapeArticles(articles) {
    var articleCards = [];
    for (var i = 0; i < articles.length; i++) {
      articleCards.push(makeCards(articles[i]));
    }
    articleContainer.append(articleCards);
  }

  function makeCards(article) {
    var card = $("<div class='card'>");
    var cardHeader = $("<div class='card-header'>").append(
      $("<h3>").append(
        $("<a class='article-link' target='_blank' rel='noopener noreferrer'>")
          .attr("href", article.url)
          .text(article.headline),
        $("<a class='btn btn-danger delete'>Delete</a>"),
        $("<a class='btn btn-info notes'>Notes</a>")
      )
    );

    var cardBody = $("<div class='card-body'>").text(article.summary);

    card.append(cardHeader, cardBody);
    card.data("_id", article._id);
    return card;
  }

  function makeEmpty() {
    var emptyAlert = $(
      [
        "<div class='alert alert-success text-center'>",
        "<h4>No new articles.</h4>",
        "</div>"
      ].join("")
    );
    articleContainer.append(emptyAlert);
  }

  function deleteArticle() {
    var articleToDelete = $(this)
      .parents(".card")
      .data();
    $(this)
      .parents(".card")
      .remove();
    console.log(articleToDelete._id)
    $.ajax({
      method: "DELETE",
      url: "/api/headlines/" + articleToDelete._id
    }).then(function(data) {
      if (data) {
        window.load = "/saved"
      }
    });
  }

  function wipeArticles() {
    $.get("api/clear")
      .then(function(data) {
        articleContainer.empty();
        location.reload();
      });
  }

  function processNotes(event) {
    var currentArticle = $(this)
      .parents(".card")
      .data();
    console.log(currentArticle)
    $.get("/api/notes/" + currentArticle._id).then(function(data) {
      console.log(data)
      var modalText = $("<div class='container-fluid text-center'>").append(
        $("<h4>").text("Notes For Article: " + currentArticle._id),
        $("<hr>"),
        $("<ul class='list-group note-container'>"),
        $("<textarea placeholder='New Note' rows='4' cols='60'>"),
        $("<button class='btn btn-success save'>Save Note</button>")
      );
      console.log(modalText)
      bootbox.dialog({
        message: modalText,
        closeButton: true
      });
      var noteData = {
        _id: currentArticle._id,
        notes: data || []
      };
      console.log('noteData:' + JSON.stringify(noteData))
      $(".btn.save").data("article", noteData);
      makeList(noteData);
    });
  }

  function saveNotes() {
    var noteData;
    var newNote = $(".bootbox-body textarea")
      .val()
      .trim();
    if (newNote) {
      noteData = { _headlineId: $(this).data("article")._id, noteText: newNote };
      $.post("/api/notes", noteData).then(function() {
        bootbox.hideAll();
      });
    }
  }

  function deleteNotes() {
    var noteToDelete = $(this).data("_id");
    $.ajax({
      url: "/api/notes/" + noteToDelete,
      method: "DELETE"
    }).then(function() {
      bootbox.hideAll();
    });
  }

});