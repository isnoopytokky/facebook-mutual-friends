 function login() {
    FB.login(function(response) {
        if (response.authResponse) {
            // connected
            setupSearch(response.authResponse.accessToken);
        } else {
            // cancelled
        }
    });
  }
 // Additional JS functions here
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '351583388282176', // App ID
      channelUrl : '//loganjoecks.com/mutual-friends/channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });

    FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        setupSearch(response.authResponse.accessToken);

      } else if (response.status === 'not_authorized') {
        // not_authorized
        login();
      } else {
        // not_logged_in
        login();
      }
    }, 
    true);

    // Additional init code here

  };

  // Load the SDK Asynchronously
  (function(d){
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     ref.parentNode.insertBefore(js, ref);
   }(document));


function setupSearch(accessToken) {
    $("h4").addClass("noText");

    //Initialize arbor.js graph
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

            drawGraph(sys, ui.item.id, ui.item.value)
            
            return false;
        },
        minLength: 2
    });
}

// Draws main graph from searched or clicked friend
function drawGraph(sys, id, name) {
    $('#name').val(name);  //update search field with selected friend

    sys.prune(function(node, pt){return true});  //Clear current graph

    // Get mutual friends of selected friend
    var url = id + '?fields=mutualfriends,first_name'
    FB.api(url, function(response) {
        $("p").html(response.first_name);  // Fill in watermark with first name

        // Create URL containing all mutual friends of selected friends
        var url = '?ids=';
        for(var i=0; i < response.mutualfriends.data.length; i++) {
            url += response.mutualfriends.data[i].id + ',';
        }

        url = url.substring(0,url.length-1); //get rid of trailing comma

        //Get name, mutual friends, and picture of mutual friends of selected friend
        FB.api(url + '&fields=name,mutualfriends,picture', function(res){
            var friendsInGraph = new Array();
            
            // For each mutual friend of selected friend, add node and possible edges
            jQuery.each(res, function(id, friend) {
                sys.addNode(id, {label:friend.name, url:friend.picture.data.url, hovered:false});

                for ( var i=0; i < friendsInGraph.length; i++ ) {
                    isFriendInGraph = friend.mutualfriends.data.some( function(mutual) {
                        return mutual.id === friendsInGraph[i];
                    });

                    if (isFriendInGraph) {
                        sys.addEdge(friendsInGraph[i], id);
                    }
                }
                friendsInGraph.push(id);
            });
        });
    });
}
