/**
 * Colorpicker
 * Author: Simon Lepel <simbo@simbo.de>
 * License: GPL
 *
 * Requirements: jQuery, jQuery-UI (position,draggable)
 */

(function($) {

	// global variables, accessible to Colorpicker only
	var svBoxMousedown=false, hueBoxMousedown=false, builtCanvas=false,
		hueBoxWidth, hueBoxHeight, hueSelectorOffsetX, hueSelectorOffsetY,
		svBoxWidth, svBoxHeight, svSelectorOffsetX, svSelectorOffsetY,
		btnAccept, btnCancel, triggerElement,
	
	// default options
		defaultOptions = {
			color: [0,0,0],		// initial color, rgb or hex; a function that returns a color
			onAccept: $.noop,		// executed when "accept" is pressed
			onCancel: $.noop,		// executed when "cancel" is pressed
			onChange: $.noop,		// executed when color is changed
			maxFields: 18,			// max number of color fields
			position: {				// jquery ui position object for positioning the main container
				of: $(window),
				at: 'center center',
				my: 'center center',
				offset: $(window).scrollLeft()+' '+$(window).scrollTop()
			}
		}, options = defaultOptions,

	// dom elements
		container, dragContainer, svBox, svCanvas, svSelector, hueBox, hueCanvas,
		hueSelector, indicator, indicatorCurrent, indicatorLast, inputR, inputG,
		inputB, inputH, inputS, inputV, inputHex, fields, fieldsAdd;
	
	// global object
	$.colorpicker = {
	
		// current color
		rgb: [0,0,0],
		hsv: [0,0,0],
		hex: '000',

		// last color
		lastRgb: [0,0,0],
		lastHsv: [0,0,0],
		lastHex: '000',
		
		// open colorpicker window
		show: function( _options, _triggerElement ) {
		
			// merge custom options with default options
			options = $.extend({},defaultOptions,_options);

			// set triggerElement
			triggerElement = _triggerElement==undefined ? window : _triggerElement;
			
			// set event handlers
			$(triggerElement).unbind('colorpicker-accept');
			$(triggerElement).unbind('colorpicker-cancel');
			$(triggerElement).unbind('colorpicker-change');
			if( $.isFunction(options.onAccept) )
				$(triggerElement).bind( 'colorpicker-accept', options.onAccept );
			if( $.isFunction(options.onCancel) )
				$(triggerElement).bind( 'colorpicker-cancel', options.onCancel );
			if( $.isFunction(options.onChange) )
				$(triggerElement).bind( 'colorpicker-change', options.onChange );
			
			// if options.color is a function, set its return value as options.color
			if( $.isFunction(options.color) )
				options.color = options.color(triggerElement);
			
			// if options.color is hex, transform to rgb
			if( $.colorpicker.isHex(options.color) )
				options.color = $.colorpicker.hex2rgb(options.color);

			// set current color (and last color)
			$.colorpicker.rgb = options.color;
			$.colorpicker.hsv = $.colorpicker.rgb2hsv( $.colorpicker.rgb );
			$.colorpicker.hex = $.colorpicker.rgb2hex( $.colorpicker.rgb );
			$.colorpicker.lastRgb = $.colorpicker.rgb;
			$.colorpicker.lastHsv = $.colorpicker.hsv;
			$.colorpicker.lastHex = $.colorpicker.hex;
			
			// set dimensions
			hueBoxWidth = $(hueBox).width();
			hueBoxHeight = $(hueBox).height();
			hueSelectorOffsetX = ($(hueSelector).width()-hueBoxWidth)/2;
			hueSelectorOffsetY = $(hueSelector).height()/2;
			svBoxWidth = $(svBox).width();
			svBoxHeight = $(svBox).height();
			svSelectorOffsetX = $(svSelector).width()/2;
			svSelectorOffsetY = $(svSelector).height()/2;
			
			// build canvas if necessary
			if( hueCanvas.width != hueBoxWidth || hueCanvas.height != hueBoxHeight || svCanvas.width != svBoxWidth || svCanvas.height != svBoxHeight ) {
				var ctx, gradient;
				hueCanvas.width = hueBoxWidth;
				hueCanvas.height = hueBoxHeight;
				ctx = hueCanvas.getContext('2d');
				gradient = ctx.createLinearGradient( 0, 0, 0, hueBoxHeight );
				gradient.addColorStop( 0, 'rgb(255,0,0)');
				gradient.addColorStop( 1/6, 'rgb(255,0,255)' );
				gradient.addColorStop( 2/6, 'rgb(0,0,255)' );
				gradient.addColorStop( 3/6, 'rgb(0,255,255)' );
				gradient.addColorStop( 4/6, 'rgb(0,255,0)' );
				gradient.addColorStop( 5/6, 'rgb(255,255,0)' );
				gradient.addColorStop( 1, 'rgb(255,0,0)' );
				ctx.fillStyle = gradient;
				ctx.fillRect( 0, 0, hueBoxWidth, hueBoxHeight );
				svCanvas.width = svBoxWidth;
				svCanvas.height = svBoxHeight;
				ctx = svCanvas.getContext('2d');
				gradient = ctx.createLinearGradient( 0, 0, svBoxWidth, 0 );
				gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
				gradient.addColorStop( 1, 'rgba(255,255,255,0)' );
				ctx.fillStyle = gradient;
				ctx.fillRect( 0, 0, svBoxWidth,svBoxHeight );
				gradient = ctx.createLinearGradient( 0, 0, 0, svBoxHeight );
				gradient.addColorStop( 0, 'rgba(0,0,0,0)' );
				gradient.addColorStop( 1, 'rgba(0,0,0,1)' );
				ctx.fillStyle = gradient;
				ctx.fillRect( 0, 0, svBoxWidth,svBoxHeight );
			}
			
			// set colors in elements
			setSvBox();
			setHueBox();
			setIndicator();
			
			// set input values
			setInputs();
			
			// show main container
			show();
		},
	
		// transform hsv to rgb
		hsv2rgb: function( hsv ) {
			if( !$.colorpicker.isHsv(hsv) )
				return false;
			var rgb,
				h = hsv[0]/60,
				s = hsv[1]/100,
				v = hsv[2]/100,
				i = Math.floor(h),
				f = h-i,
				p = v*(1-s),
				q = v*(1-s*f),
				t = v*(1-s*(1-f));
			switch(i) {
				case 1: rgb = [q,v,p]; break;
				case 2: rgb = [p,v,t]; break;
				case 3: rgb = [p,q,v]; break;
				case 4: rgb = [t,p,v]; break;
				case 5: rgb = [v,p,q]; break;
				default: rgb = [v,t,p]; break;
			}
			for( var i in rgb )
				rgb[i] = Math.round(rgb[i]*255);
			return rgb;
		},

		// transform rgb to hsv
		rgb2hsv: function( rgb ) {
			if( !$.colorpicker.isRgb(rgb) )
				return false;
			var h, s,
				r = rgb[0]/255,
				g = rgb[1]/255,
				b = rgb[2]/255,
				v = Math.max( Math.max( r, g ), b ),
				m = Math.min( Math.min( r, g ), b );
			switch(v) {
				case m: h = 0; break;
				case r: h = 60*(0+(g-b)/(v-m)); break;
				case g: h = 60*(2+(b-r)/(v-m)); break;
				case b: h = 60*(4+(r-g)/(v-m)); break;
			}
			if( h<0 )
				h += 360;
			s = v==0 ? 0 : (v-m)/v;
			return [ Math.round(h), Math.round(s*100), Math.round(v*100) ];
		},

		// transform hex to rgb
		hex2rgb: function( str ) {
			if( !$.colorpicker.isHex(str) )
				return false;
			var rgb = [0,0,0],
				hex = str.replace(/^#/,'').toLowerCase(),
				l = hex.length==3 ? 1 : 2;
			for( var i in rgb )
				rgb[i] = parseInt( hex.substr(i*l,l) + (l==1 ? hex.substr(i*l,l) : '' ), 16 );
			return rgb;
		},

		// transform rgb to hex
		rgb2hex: function( rgb ) {
			if( !$.colorpicker.isRgb(rgb) )
				return false;
			var hex='';
			for( var i in rgb )
				hex += ('0'+parseInt(rgb[i]).toString(16)).substr(-2);
			if( hex.substr(0,1)==hex.substr(1,1) && hex.substr(2,1)==hex.substr(3,1) && hex.substr(4,1)==hex.substr(5,1) )
				hex = hex.substr(0,1)+hex.substr(2,1)+hex.substr(4,1);
			return hex;
		},

		// true if rgb
		isRgb: function( rgb ) {
			return (
				$.isArray(rgb) && rgb.length==3
				&& !isNaN(rgb[0]) && rgb[0]>=0 && rgb[0]<=255
				&& !isNaN(rgb[1]) && rgb[1]>=0 && rgb[1]<=255
				&& !isNaN(rgb[2]) && rgb[2]>=0 && rgb[2]<=255
			);
		},

		// true if hsv
		isHsv: function( hsv ) {
			return (
				$.isArray(hsv) && hsv.length==3
				&& !isNaN(hsv[0]) && hsv[0]>=0 && hsv[0]<=360
				&& !isNaN(hsv[1]) && hsv[1]>=0 && hsv[1]<=100
				&& !isNaN(hsv[2]) && hsv[2]>=0 && hsv[2]<=100
			);
		},

		// true if hex
		isHex: function( str ) {
			var hex = typeof str == 'string' ? str.replace(/^#/,'').toLowerCase() : false,
				hexPattern = /^([0-9a-f]{3}|[0-9a-f]{6})$/;
			return hexPattern.test(hex);
		}

	}
	
	// jquery function
	$.fn.colorpicker = function( _options ) {
		$(this).each(function(){
			$(this).click(function(){
				$.colorpicker.show( _options, this );
			})
		})
		return $(this);
	}
	
	// hide main container
	function hide() {
		$(dragContainer).fadeOut(200);
	}
	
	// show main container
	function show() {
		$(dragContainer).fadeIn(200).position(options.position);
	}
	
	// set input field values to current color values
	function setInputs() {
		$(inputR).val( $.colorpicker.rgb[0]);
		$(inputG).val( $.colorpicker.rgb[1]);
		$(inputB).val( $.colorpicker.rgb[2]);
		$(inputH).val( Math.round( $.colorpicker.hsv[0] ) );
		$(inputS).val( Math.round( $.colorpicker.hsv[1] ) );
		$(inputV).val( Math.round( $.colorpicker.hsv[2] ) );
		$(inputHex).val( $.colorpicker.hex ).removeClass('invalid');
	}
	
	// handle mouse events for hue selection
	function touchHueBox(ev) {
		if( hueBoxMousedown ) {
			var offset = $(hueBox).offset(),
				y = ev.pageY-offset.top,
				hue = Math.round( (hueBoxHeight-y)/hueBoxHeight*360 );
			hue = hue<0 ? 0 : ( hue>360 ? 360 : hue );
			updateHsv( [ hue, $.colorpicker.hsv[1], $.colorpicker.hsv[2] ] );
		}
	}
	
	// handle mouse events for sat/val selection
	function touchSvBox(ev) {
		if( svBoxMousedown ) {
			var offset = $(svBox).offset(),
				s = Math.round( (ev.pageX-offset.left)/svBoxWidth*100 ),
				v = Math.round( (svBoxHeight-(ev.pageY-offset.top))/svBoxHeight*100 );
			s = s<0 ? 0 : ( s>100 ? 100 : s );
			v = v<0 ? 0 : ( v>100 ? 100 : v );
			updateHsv( [ $.colorpicker.hsv[0], s, v ] );
		}
	}
	
	// set hue selector position according to current color
	function setHueBox() {
		var y;
		y = Math.round((360-$.colorpicker.hsv[0])/360*hueBoxHeight);
		$(hueSelector).css({
			left: -hueSelectorOffsetX,
			top: y-hueSelectorOffsetY
		});
	}
	
	// set sat/val background color and selector position according to current color
	function setSvBox() {
		var s = $.colorpicker.hsv[1],
			v = $.colorpicker.hsv[2],
			rgb, x, y;
		rgb = $.colorpicker.hsv2rgb( [ $.colorpicker.hsv[0], 100, 100] );
		$(svBox).css( 'background-color', 'rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')' );
		x = Math.round( s/100*svBoxWidth );
		y = Math.round( (100-v)/100*svBoxHeight );
		$(svSelector).css({
			left: x-svSelectorOffsetX,
			top: y-svSelectorOffsetY
		});
	}

	// set indicators background color according to current and last color
	function setIndicator() {
		$(indicatorCurrent).css( 'background-color', '#'+$.colorpicker.hex );
		$(indicatorLast).css( 'background-color', '#'+$.colorpicker.lastHex );
	}
		
	// update colorpicker based on rgb
	function update() {
		setHueBox();
		setSvBox();
		setIndicator();
		setInputs();
		$(triggerElement).trigger('colorpicker-change');
	}
	
	// update by rgb
	function updateRgb( rgb ) {
		if( $.colorpicker.isRgb(rgb) ) {
			$.colorpicker.rgb = rgb;
			$.colorpicker.hsv = $.colorpicker.rgb2hsv(rgb);
			$.colorpicker.hex = $.colorpicker.rgb2hex(rgb);
			update();
		}
	}
	
	// update by hsv
	function updateHsv( hsv ) {
		if( $.colorpicker.isHsv(hsv) ) {
			$.colorpicker.hsv = hsv,
			$.colorpicker.rgb = $.colorpicker.hsv2rgb(hsv);
			$.colorpicker.hex = $.colorpicker.rgb2hex($.colorpicker.rgb);
			update();
		}
	}

	// update by hex
	function updateHex( hex ) {
		if( $.colorpicker.isHex(hex) ) {
			$.colorpicker.hex = hex;
			$.colorpicker.rgb = $.colorpicker.hex2rgb(hex);
			$.colorpicker.hsv = $.colorpicker.rgb2hsv($.colorpicker.rgb),
			update();
		}
	}
	
	// add a color field
	function addField( hex ) {
		if( $(fields).find('.field').length<options.maxFields ) {
			hex = hex == undefined ? $.colorpicker.hex : hex;
			$(fieldsAdd).before(
				$('<div class="field" data-hex="'+hex+'"/>').css( 'background-color', '#'+hex ).click(function(ev) {
					// remove color field if modifier is pressed
					if( ev.altKey || ev.shiftKey || ev.ctrlKey )
						$(this).remove();
					// otherwise set current color to colorfield color
					else
						updateHex( $(this).attr( 'data-hex' ) );
				})
			);
		}
	}

	// initialize
	$(function(){
	
		// insert dom elements
		$('body').append(
			dragContainer = $('<div class="colorpicker-drag-container" />').append(
				container = $('<div class="colorpicker-container" />').append(
					svBox = $('<div class="sv" />').append(
						svCanvas = $('<canvas />')[0],
						svSelector = $('<div class="selector" />')[0]
					)[0],
					hueBox = $('<div class="hue" />').append(
						hueCanvas = $('<canvas />')[0],
						hueSelector = $('<div class="selector" />')[0]
					)[0],
					indicator = $('<div class="indicator" />').append(
						indicatorCurrent = $('<div class="current" />')[0],
						indicatorLast = $('<div class="last" />')[0]
					)[0],
					$('<form />').append(
						$('<fieldset class="rgb" />').append(
							$('<label for="r">R</label>')[0],
							inputR = $('<input type="text" maxlength="3" size="3" name="r">')[0],
							$('<label for="g">G</label>')[0],
							inputG = $('<input type="text" maxlength="3" size="3" name="g">')[0],
							$('<label for="b">B</label>')[0],
							inputB = $('<input type="text" maxlength="3" size="3" name="b">')[0]
						)[0],
						$('<fieldset class="hsv" />').append(
							$('<label for="r">H</label>')[0],
							inputH = $('<input type="text" maxlength="3" size="3" name="h">')[0],
							$('<label for="g">S</label>')[0],
							inputS = $('<input type="text" maxlength="3" size="3" name="s">')[0],
							$('<label for="b">V</label>')[0],
							inputV = $('<input type="text" maxlength="3" size="3" name="v">')[0]
						)[0],
						$('<fieldset class="hex" />').append(
							$('<label for="r">#</label>')[0],
							inputHex = $('<input type="text" maxlength="6" size="6" name="hex">')[0]
						)[0],
						fields = $('<div class="fields" />').append(
							fieldsAdd = $('<div class="add" />')[0]
						)[0],
						btnAccept = $('<div class="accept" />')[0],
						btnCancel = $('<div class="cancel" />')[0]
					)[0]
				)[0]
			).hide()[0]
		);
		
		// bind events to window
		$(window).bind({
			mousemove: function(ev) {
				touchHueBox(ev);
				touchSvBox(ev);
			},
			mouseup: function(){
				hueBoxMousedown = false;
				svBoxMousedown = false;
			}
		});

		// bind events to input fields
		$([ inputR, inputG, inputB, inputH, inputS, inputV, inputHex ]).each(function() {
			$(this).bind({
				focus: function(){
					$(this).select();
				},
				change: function() {
					var v = $(this).val(),
						n = $(this).attr('name');
					if( n=='hex' ) {
						v = v.replace(/[^0-9a-f]{1,}/gi,'');
						if( $.colorpicker.isHex(v) || v=='' ) {
							$(this).removeClass('invalid');
							updateHex( v==''?'000':v );
						}
						else
							$(this).addClass('invalid');
					}
					else {
						v = v.replace(/[^0-9]{1,}/gi,'');
						switch(n) {
							case 'h':
								v = parseInt(v) >= 360 ? 360 : v;
								updateHsv([ v==''?0:v, $.colorpicker.hsv[1], $.colorpicker.hsv[2] ]);
								break;
							case 's':
								v = parseInt(v) >= 100 ? 100 : v;
								updateHsv([ $.colorpicker.hsv[0], v==''?0:v, $.colorpicker.hsv[2] ]);
								break;
							case 'v':
								v = parseInt(v) >= 100 ? 100 : v;
								updateHsv([ $.colorpicker.hsv[0], $.colorpicker.hsv[1], v==''?0:v ]);
								break;
							default:
								v = parseInt(v) >= 255 ? 255 : v;
								switch(n) {
									case 'r':
										updateRgb([ v==''?0:v, $.colorpicker.rgb[1], $.colorpicker.rgb[2] ]);
										break;
									case 'g':
										updateRgb([ $.colorpicker.rgb[0], v==''?0:v, $.colorpicker.rgb[2] ]);
										break;
									case 'b':
										updateRgb([ $.colorpicker.rgb[0], $.colorpicker.rgb[1], v==''?0:v ]);
										break;
								}
								break;
						}
					}
					$(this).val(v);
				},
				keyup: function() {
					$(this).change();
				},
				blur: function() {
					var v = $(this).val(),
						n = $(this).attr('name');
					if( v=='' ) {
						v = v=='hex' ? '000' : '0';
						$(this).val(v);
					}
				}				
			})
		});
		
		// bind events to last color indicator
		$(indicatorLast).bind({
			click: function() {
				updateRgb($.colorpicker.lastRgb);
			}
		});
		
		// bind events to hue selector
		$(hueCanvas).bind({
			mousedown: function(ev) {
				hueBoxMousedown = true;
				touchHueBox(ev);
			}
		});
	
		// bind events to sat/val selector
		$(svCanvas).bind({
			mousedown: function(ev) {
				svBoxMousedown = true;
				touchSvBox(ev);
			}
		});
		
		// bind events to button "add color field"
		$(fieldsAdd).bind({
			click: function(){
				addField();
			}
		});
		
		// bind events to accept button
		$(btnAccept).bind({
			click: function() {
				$.colorpicker.lastRgb = $.colorpicker.rgb;
				$.colorpicker.lastHsv = $.colorpicker.hsv;
				$.colorpicker.lastHex = $.colorpicker.hex;
				hide();
				$(triggerElement).trigger('colorpicker-accept');
			}
		});
		
		// bind events to cancel button
		$(btnCancel).bind({
			click: function() {
				indicatorLast.click();
				hide();
				$(triggerElement).trigger('colorpicker-cancel');
			}
		});
		
		// draggable container
		$(dragContainer).draggable({
			scroll: false,
			containment: 'window',
			cancel: '.colorpicker-container'
		});
		
		// add initial color fields
		addField('fff');
		addField('000');

	});

})(jQuery);
