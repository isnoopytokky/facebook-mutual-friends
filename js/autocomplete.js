var apikey = "jjfwv3tdzmqxz63pjtdgevqv";

$(document).ready(function() {
	var sys = arbor.ParticleSystem() // create the system with sensible repulsion/stiffness/friction
	sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
	sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...
	
	$("#search").autocomplete({
		//autoFocus: true,
		source: function( request, response ) {
			$.ajax("http://api.rottentomatoes.com/api/public/v1.0/movies.json", {
				data: {
					apikey: apikey,
					q: request.term,
					page_limit: 5
				},
				dataType: "jsonp",
				success: function(data) {
					response($.map(data.movies, function(movie) {
						return {
							label: movie.title,
							value: movie.title,
							thumb: movie.posters.thumbnail,
							id: movie.id
						}
					}));           
				}
			});
		},
		messages: {
			noResults: null,
			results: function() {}
		},
		select: function( event, ui ) {
			sys.prune(function(node, pt){
				return true
			});
	
			var similarURL = 'http://api.rottentomatoes.com/api/public/v1.0/movies/' + ui.item.id + '/similar.json';
			$.ajax(similarURL, {
				data: {	apikey: apikey },
				dataType: "jsonp",
				success: function(data) {
					sys.addNode(ui.item.id, {label:ui.item.label, color:'1D4D80'})
					for(var i=0; i < data.movies.length; i++){
						sys.addNode(data.movies[i].id, {label:data.movies[i].title, color:'238E66'})
						sys.addEdge(ui.item.id, data.movies[i].id, {directed:true})
					}
				}
			});
			$(this).val('');
			$("span").show();
		}
	}).data( "autocomplete" )._renderItem = function( ul, item ) {
		var img = $("<img>").attr("src", item.thumb);
		var link = $("<a>").text(item.label).prepend(img);
		return $("<li>")
			.data( "item.autocomplete", item )
			.append(link)
			.appendTo(ul);
	};
});