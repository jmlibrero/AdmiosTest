$(document).ready(function(){  
	$('#search').click(function(){
		search();
	});
	
	function search(){
		$.mobile.showPageLoadingMsg();
		var stockSymbol = $('#stockSymbol').val();
		var exchange;
		
		$("#company").html("");
		$("#exchange").html("");
		$("#high").html("");
		$("#low").html("");
		$("#last").html("");
		$("#tweets").html('');
		
		$.ajax({
		  type: 'GET',
		  url: '/search',
		  async: false,
		  timeout: 30000,
		  data: 'stockSymbol='+stockSymbol,
		  dataType: 'text',
		  success: function(data){     
			var xml=data;

			$(xml).find('finance').each(function(){
				$(this).find('exchange').each(function(){
					if($(this).attr('data')=='UNKNOWN EXCHANGE'){
						stockSymbol='UNKNOWN EXCHANGE';
						 $(document.body).stop();
						$( "<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h3>UNKNOWN STOCK SYMBOL</h3></div>" ).css({ "display": "block", "opacity": 0.96, "top": $(window).scrollTop() + 100 }).appendTo( $.mobile.pageContainer ).delay( 1500 ).fadeOut( 800, function() {$( this ).remove();});						
						return;
					}
					exchange =$(this).attr('data');
				});	
				$(this).find('company').each(function(){
					$("#company").html($(this).attr('data')+" - "+exchange);
				});
				$(this).find('high').each(function(){
					$("#high").html($(this).attr('data'));
				});
				$(this).find('low').each(function(){
					$("#low").html($(this).attr('data'));
				});
				$(this).find('last').each(function(){
					$("#last").html($(this).attr('data'));
				});
			});
		  }      
		});
		if(stockSymbol!='UNKNOWN EXCHANGE'){
			$.ajax({
				url: 'http://search.twitter.com/search.json?q='+stockSymbol,
				type: 'GET',
				dataType: 'jsonp',
				success: function(data, textStatus, xhr) {
					var i, tweet, compiled;
					var htmlData = "<li data-role='list-divider'>Tweets</li>";
					var liElem = $(document.createElement('li'));
					$("#tweets").append(liElem.html(htmlData));
					for (i = 0; i < data.results.length; i++) {
						tweet = data.results[i];
						htmlData = "<img src='" + tweet.profile_image_url + "' class='ui-li-thumb ui-li-aside'/><span>"+tweet.text+"</span><br/><span>"+tweet.from_user_name+"</span><br/><span>"+tweet.created_at+"</span><br/>";
						liElem = $(document.createElement('li'));
						$("#tweets").append(liElem.html(htmlData));
					}
					$('#tweets').listview("refresh");
				},
				error: function(jqXHR, textStatus, errorThrown){
					alert("error: "+errorThrown);
				}
			});
			$(document.body).delay(30000).show(1, search);
		}
		$.mobile.hidePageLoadingMsg();
  }
  
});