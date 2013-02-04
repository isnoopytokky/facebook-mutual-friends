FB.init({
    appId: '351583388282176',
    status: true,
    cookie: true,
    oauth: true
});

$(document).ready(function() {
   // $("#search").addClass("centered");

    var sys = arbor.ParticleSystem(600, 150, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

    FB.getLoginStatus(function(stsResp) {
        if(stsResp.authResponse) {
            setupSearch(stsResp.authResponse.accessToken, sys);
        } else {
            FB.login(function(loginResp) {
                if(loginResp.authResponse) {
                    setupSearch(loginResp.authResponse.accessToken, sys);
                } else {
                    alert('Please authorize this application to use it!');
                }
            });
        }
    });
});

function setupSearch(accessToken, sys) {
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
            $("span").show();
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
                    sys.addNode(response.data[k].id, {label:response.data[k].name, url:res.data.url})
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