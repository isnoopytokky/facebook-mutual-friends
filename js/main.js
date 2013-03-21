 function login() {
    $( "#progressbar" ).progressbar({ value: 70 });
    FB.login(function(response) {
        $( "#progressbar" ).progressbar({ value: 80 });
        if (response.authResponse) {
            $( "#progressbar" ).progressbar({ value: 90 });
            // connected
            setupSearch(response.authResponse.accessToken);
        } else {
            // cancelled
        }
    });
  }
 // Additional JS functions here
  window.fbAsyncInit = function() {
    $( "#progressbar" ).progressbar({ value: 20 });
    FB.init({
      appId      : '351583388282176', // App ID
      channelUrl : '//logstown.mycloudnas.com/fb/channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });
    $( "#progressbar" ).progressbar({ value: 30 });

    $( "#progressbar" ).progressbar({ value: 40 });
    FB.getLoginStatus(function(response) {
        $( "#progressbar" ).progressbar({ value: 50 });
      if (response.status === 'connected') {
        $( "#progressbar" ).progressbar({ value: 90 });
        setupSearch(response.authResponse.accessToken);

      } else if (response.status === 'not_authorized') {
        $( "#progressbar" ).progressbar({ value: 60 });
        // not_authorized
        login();
      } else {
        $( "#progressbar" ).progressbar({ value: 60 });
        // not_logged_in
        login();
      }
    }, 
    true);

    // Additional init code here

  };

  // Load the SDK Asynchronously
  (function(d){
    $( "#progressbar" ).progressbar({ value: 10 });
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     ref.parentNode.insertBefore(js, ref);
   }(document));


function setupSearch(accessToken) {
    $( "#progressbar" ).progressbar({ value: 100 });
    $( "#progressbar" ).hide();
    var sys = arbor.ParticleSystem(600, 150, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...
    
    var tokenUrl = "https://graph.facebook.com/me/friends?access_token=" + accessToken + "&callback=?"

    $("#name").autocomplete({
        source: function(request, add) {
            $this = $(this)
            // Call out to the Graph API for the friends list
            $.ajax({
                url: tokenUrl,
                dataType: "jsonp",
                success: function(results){
                    // Filter the results and return a label/value object array  
                    var formatted = [];
                    for(var i = 0; i< results.data.length; i++) {
                        if (results.data[i].name.toLowerCase().indexOf($('#name').val().toLowerCase()) >= 0)
                        formatted.push({
                            label: results.data[i].name,
                            id: results.data[i].id
                        })
                    }
                    add(formatted);
                }
            });
        },
        select: function(event, ui) {
            $("#search").removeClass("centered");
            $("h1").addClass("noText");
            $("#controls").removeClass("noText");
            $("#controls").addClass("contFormat");

            getUserInfo(sys, ui.item.id, ui.item.value)
            
            return false;
        },
        minLength: 2
    });
}

function getUserInfo(sys, id, name) {
    $('#name').val(name)

    FB.api(id, function(response) {$("p").html(response.first_name)});

    sys.prune(function(node, pt){return true});

    var url = 'me/mutualfriends/' + id
    FB.api(url, function(response) {
        var friends = new Array();
        for(var i=0; i < response.data.length; i++) {
            (function(){
                var k = i;
                friends.push(response.data[i].id);

                FB.api(response.data[i].id + '/picture?type=square', function(res){
                    sys.addNode(response.data[k].id, {label:response.data[k].name, url:res.data.url, hovered:false})
                });
            })();
        }

        for(var j=0; j < friends.length; j++) {
            (function(){
                var k = j;
                var req = 'me/mutualfriends/' + friends[j];
            
                FB.api(req, function(resp){
                    for(var i=0; i < resp.data.length; i++) {
                        if(jQuery.inArray(resp.data[i].id, friends) >= 0) {
                            if(sys.getEdges(friends[k], resp.data[i].id).length === 0){
                                sys.addEdge(friends[k], resp.data[i].id)
                            }
                        }
                    }
                });
            })();
        }
    });
}
