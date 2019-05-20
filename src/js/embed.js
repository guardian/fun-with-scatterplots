import iframeMessenger from 'guardian/iframe-messenger'
import reqwest from 'reqwest'
import embedHTML from './text/embed.html!text'
import { Scatterplot } from './modules/scatterplot'

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    el.innerHTML = embedHTML;

    var urlParams; 
    var params = {};

    urlParams = window.location.search.substring(1).split('&');
    
    urlParams.forEach(function(param){
     
        if (param.indexOf('=') === -1) {
            params[param.trim()] = true;
        } else {
            var pair = param.split('=');
            params[ pair[0] ] = pair[1];
        }
        
    });

    var ssKey = (params.key) ? params.key : '1fF-BncFYQd261yn2GI_nBAaYFvWUt7-Jow6ZwgjCS3g' ;

    // var x = (params.x) ? params.x : 'yes' ;

    // var y = (params.y) ? params.y : 'religious_persons_percent' ;

	reqwest({
	  url: 'https://interactive.guim.co.uk/docsdata/' + ssKey + '.json', //https://interactive.guim.co.uk/docsdata/1uQioCaW7on919nLfs7T7Fpiy3tygPmwHfO5Y-H42zxU.json
	  type: 'json',
	  crossOrigin: true,
	  success: (resp) =>  { 
        var sp = new Scatterplot(resp)
	  }
	});
};