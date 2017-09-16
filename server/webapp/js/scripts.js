$('.challenge-option').click(function (e) {
  console.log("lickes");
  $('.challenge-option').removeClass('selected');
  $(e.target).addClass('selected');
});

setTimeout(function() {
  $('.twitter-timeline').height('100%');
}, 2500);
