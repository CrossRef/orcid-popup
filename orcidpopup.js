+function ($) {
    'use strict';

    var findAuthorByOrcid = function(orcid, items) {
	var a;
	
	$.each(items, function(i) {
	    var authors = items[i]['author'];

	    $.each(authors, function(i) {
		var author = authors[i];
		//alert(author['ORCID']);
		//alert(orcid);
		if (author['ORCID'] === orcid) {
		    a = author;
		}
	    });
	});

	return a;
    };

    var apiJsonMetadataParser = function(data) {
	return {
	    title: data['title'],
	    licenses: data['license'],
	    authors: data['author'],
	    resources: data['link']
	};
    };

    var defaultContentTypeLabels = {
	'application/pdf': 'PDF',
	'text/html': 'HTML',
	'text/plain': 'Plain',
	'application/xml': 'XML',
	'text/xml': 'XML',
	'text/csv': 'CSV'
    };

    var defaultLicenseLabels = {
	'http://creativecommons.org/licenses/by/3.0' :
	'cc-by.svg',
	'http://creativecommons.org/licenses/by/3.0/':
	'cc-by.svg',
	'http://creativecommons.org/licenses/by/4.0':
	'cc-by.svg',
	'http://creativecommons.org/licenses/by/4.0/':
	'cc-by.svg',
    };

    var contributorContentGenerator = function(orcid, items) {
	var a = findAuthorByOrcid(orcid, items);

	if (a == null) {
	    return $('<div>').append('<span>' + orcid + '</span>').html();
	} else {
	
	    var $author = $('<div>');
	    var label;
	    
	    if (a['given'] && a['family']) {
		label = a['given'] + ' ' + a['family'];
	    } else if (a['family']) {
		label = a['family'];
	    } else {
		label = a['ORCID'];
	    }
	    
	    var $a = $('<a>')
		.attr('href', a['ORCID'])
		.append($('<span>').text(' ' + label));

	    $author.append($('<h4>').append($a));

	    if (a['affiliation'].length >= 1) {
		var affiliationName = a['affiliation'][0]['name'];
		$author.append($('<small>').text(affiliationName));
	    }
	    
	    return $author.html();
	}
    };

    var defaultContentGenerator = function(doi, metadata, options) {
	var $authorList = $('<ul class="list-inline">');
	var $resourceList = $('<ul class="list-inline">');
	var $licenseList = $('<ul class="list-inline">');

	if (metadata['authors']) {
	    $.each(metadata['authors'], function(i) {
		var a = metadata['authors'][i];
		if (a['ORCID']) {
		    var label;

		    if (a['given'] && a['family']) {
			label = a['given'] + ' ' + a['family'];
		    } else if (a['family']) {
			label = a['family'];
		    } else {
			label = a['ORCID'];
		    }
		    
		    var $a = $('<a>')
			.attr('href', a['ORCID'])
			.append($('<img>').attr('src', options.imageLocation + '/orcid_24x24.gif'))
			.append($('<span>').text(' ' + label));
		    $authorList.append($('<li>').append($a));
		}
	    });
	}

	if (metadata['resources']) {
	    $.each(metadata['resources'], function(i) {
		var r = metadata['resources'][i];
		if (r['URL']) {
		    var $a = $('<a>')
			.attr('href', r['URL'])
			.text(options.contentTypeLabels[r['content-type']]
			      || r['content-type']);
		    $resourceList.append($('<li>').append($a));
		}
	    });
	}

	if (metadata['licenses']) {
	    $.each(metadata['licenses'], function(i) {
		var l = metadata['licenses'][i];
		if (l['URL']) {
		    var $label;

		    if (options.licenseLabels[l['URL']]) {
			$label = $('<img>').attr('src',
						 options.imageLocation
						 + '/'
						 + options.licenseLabels[l['URL']]);
		    } else {
			$label = $('<span>').text(l['URL']);
		    }   
		    
		    var $a = $('<a>')
			.attr('href', l['URL'])
			.append($label);
		    $licenseList.append($('<li>').append($a));
		}
	    });
	}

	var $authors = $('<div>')
	    .append($('<span>').text('Authors'))
	    .append($authorList);

	var $resources = $('<div>')
	    .append($('<span>').text('Resources'))
	    .append($resourceList);

	var $licenses = $('<div>')
	    .append($('<span>').text('Licenses'))
	    .append($licenseList);

	var $c = $('<div>');

	$c.append($('<hr>'));
	
	$c.append($('<p>').text(metadata['title']));
	$c.append($resourceList.addClass('pull-right'));
	$c.append($('<a>')
		  .attr('href', 'http://doi.org/' + doi)
		  .append($('<span>').text('http://doi.org/' + doi)));

	// if (metadata['licenses'] && metadata['licenses'].length != 0) {
	//     $c.append($('<div class="row" style="font-size: 0.8em;">')
	// 	      .append($('<div class="col-md-2">').append($('<b>').text('Licenses')))
	// 	      .append($('<div class="col-md-10">').append($licenseList)));
	// }

	// if (metadata['authors'] && metadata['authors'].length != 0) {
	//     $c.append($('<div class="row" style="font-size: 0.8em;">')
	// 	      .append($('<div class="col-md-2">').append($('<b>').text('Authors')))
	// 	      .append($('<div class="col-md-10">').append($authorList)));
	// }

	return $c.html();
    };

    var OrcidPopup = function (element, options) {
	this.init('orcidPopup', element, options);

	var orcid = this.getOrcid();
	var o = this.options;
	var u = 'http://api.crossref.org/v1/works?rows=5&filter=orcid:' + encodeURIComponent(orcid);

	$.ajax({url: u}).success(function(data, status, xhr) {
	    var items = data['message']['items'];
	    var newContent = '<div>' + contributorContentGenerator(orcid, items);
	    
	    $.each(items, function(i) {
		var workItem = items[i];
		newContent += defaultContentGenerator(workItem['DOI'], o.metadataParser(workItem), o);
	    });

	    newContent += '</div>';
	    o.content = newContent;
	});
    };

    if (!$.fn.tooltip) throw new Error('OrcidPopup requires tooltip.js');

    OrcidPopup.VERSION  = '1.0.0';

    OrcidPopup.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
	doi: '',
	html: true,
	content: 'spinner',
	placement: 'bottom',
	imageLocation: 'img',
	trigger: 'click',
	metadataContentType: 'application/vnd.citationstyles.csl+json',
	metadataParser: apiJsonMetadataParser,
	licenseLabels: defaultLicenseLabels,
	contentTypeLabels: defaultContentTypeLabels,
	template: '<div style="max-width: 600px;" class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
    });

    OrcidPopup.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);
    
    OrcidPopup.prototype.constructor = OrcidPopup;

    OrcidPopup.prototype.getDefaults = function () {
	return OrcidPopup.DEFAULTS;
    };

    OrcidPopup.prototype.setContent = function () {
	var $tip    = this.tip();
	var title   = this.getTitle();
	var content = this.getContent();

	$tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
	$tip.find('.popover-content').children().detach().end()[
	    // we use append for html objects to maintain js events
	    this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
	](content)

	$tip.removeClass('fade top bottom left right in');

	// IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
	// this manually by checking the contents.
	if (!$tip.find('.popover-title').html()) {
	    $tip.find('.popover-title').hide();
	}
    };

    OrcidPopup.prototype.hasContent = function () {
	return this.getOrcid();
    };

    OrcidPopup.prototype.getContent = function () {
	var $e = this.$element;
	var o  = this.options;

	return $e.attr('data-content')
	    || (typeof o.content == 'function' ?
		o.content.call(o.metadata) :
		o.content);
    };

    OrcidPopup.prototype.getOrcid = function () {
	var o = this.options;
	return o.orcid;
    };

    OrcidPopup.prototype.arrow = function () {
	return (this.$arrow = this.$arrow || this.tip().find('.arrow'));
    };

    OrcidPopup.prototype.tip = function () {
	if (!this.$tip) {
	    this.$tip = $(this.options.template);
	}
	
	return this.$tip;
    };

    function Plugin(option) {
	return this.each(function () {
	    var $this   = $(this);
	    var data    = $this.data('bs.orcidPopup');
	    var options = typeof option == 'object' && option;
	    
	    if (!data && option == 'destroy') {
		return;
	    }
	    
	    if (!data) {
		$this.data('bs.orcidPopup', (data = new OrcidPopup(this, options)));
	    }
	    
	    if (typeof option == 'string') {
		data[option]();
	    }
	});
    }

    var old = $.fn.popover;

    $.fn.orcidPopup             = Plugin;
    $.fn.orcidPopup.Constructor = OrcidPopup;
    
    $.fn.orcidPopup.noConflict = function () {
	$.fn.orcidPopup = old;
	return this;
    };
    
}(jQuery);
